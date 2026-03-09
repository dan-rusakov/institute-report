import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { SynovaCloudSdk } from "@synova-cloud/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import { db } from "~/server/db";
import { env } from "~/env";
import { clarificationResponseSchema, type ClarificationResponse } from "../../types/clarificationSchema";
import { reportResponseSchema, type ReportResponse } from "~/app/types/institutionReport";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash");

  if (!hash) {
    return NextResponse.json({ error: "hash is required" }, { status: 400 });
  }

  const report = await db.report.findUnique({
    where: { raw_description_hash: hash },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ status: "report_ready", hash, ...(report.response as object) });
}

const clarificationJsonSchema = zodToJsonSchema(clarificationResponseSchema);
const reportJsonSchema = zodToJsonSchema(reportResponseSchema);

function buildCombinedInput(
  description: string,
  previousAnswers: { question: string; answer: string }[],
): string {
  if (previousAnswers.length === 0) return description;

  const qa = previousAnswers
    .map((a) => `В: ${a.question}\nО: ${a.answer}`)
    .join('\n\n');

  return `${description}\n\nУточнения:\n${qa}`;
}

export async function POST(request: Request) {
  const client = new SynovaCloudSdk(env.SYNOVA_SECRET);
  const body = (await request.json()) as {
    description: string;
    previousAnswers?: { question: string; answer: string }[];
  };

  const description = body.description?.trim();
  const previousAnswers = body.previousAnswers ?? [];

  if (!description) {
    return NextResponse.json(
      { error: "Description is required" },
      { status: 400 },
    );
  }

  const combinedInput = buildCombinedInput(description, previousAnswers);

  try {
    const clarificationResult = await client.prompts.execute<ClarificationResponse>(
      'prm_Eg4albd4wBAq',
      {
        provider: 'openai',
        model: 'gpt-5.2',
        tag: env.PROMPT_VERSION_TAG,
        variables: { raw_description: combinedInput },
        responseSchema: clarificationJsonSchema,
      },
    );

    const clarification = clarificationResponseSchema.parse(clarificationResult.object);

    if (clarification.status === 'clarification_needed') {
      if (!clarification.questions?.length) {
        throw new Error('Model returned status=clarification_needed but questions are missing');
      }
      return NextResponse.json({
        status: 'clarification_needed',
        questions: clarification.questions,
        message_to_user: clarification.message_to_user,
      });
    }

    const enrichedDescription = clarification.enriched_description;
    if (!enrichedDescription?.trim()) {
      throw new Error('Model returned status=ready but enriched_description is missing');
    }

    const hash = createHash("sha256").update(enrichedDescription).digest("hex");

    const existing = await db.report.findUnique({
      where: { raw_description_hash: hash },
    });

    if (existing) {
      return NextResponse.json({ status: 'report_ready', hash, ...(existing.response as object) });
    }

    const result = await client.prompts.execute<ReportResponse>(
      "prm_HFL0R9Cgp2lv",
      {
        provider: 'openai',
        model: 'gpt-5.2',
        tag: env.PROMPT_VERSION_TAG,
        variables: { raw_description: enrichedDescription },
        responseSchema: reportJsonSchema,
      });

    const responseData = result.object;

    const report = await db.report.create({
      data: {
        raw_description: enrichedDescription,
        raw_description_hash: hash,
        provider: 'openai',
        model: 'gpt-5.2',
        response: {},
      },
    });

    const reportResponse = {
      ...responseData,
      report_id: report.id,
      created_at: report.createdAt,
    };

    await db.report.update({
      where: { id: report.id },
      data: { response: reportResponse },
    });

    return NextResponse.json({ status: 'report_ready', hash, ...reportResponse });
  } catch (error) {
    console.error("Error generating report:", error instanceof Error ? error.message : error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
