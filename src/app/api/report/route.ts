import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { SynovaCloudSdk } from "@synova-cloud/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import { db } from "~/server/db";
import { env } from "~/env";
import { reportResponseSchema, type ReportResponse, ReflectionQuestionsSchema, type ReflectionQuestions } from "~/app/types/institutionReport";

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

const reportJsonSchema = zodToJsonSchema(reportResponseSchema);
const reflectionQuestionsJsonSchema = zodToJsonSchema(ReflectionQuestionsSchema);

export async function POST(request: Request) {
  const client = new SynovaCloudSdk(env.SYNOVA_SECRET, { timeout: 120_000, retry: { maxRetries: 1 } });
  const body = (await request.json()) as {
    enrichedDescription?: string;
    skipCache?: boolean;
    regenerateHash?: string;
  };

  const skipCache = body.skipCache === true;
  const regenerateHash = body.regenerateHash?.trim();

  let enrichedDescription: string;
  let existingForRegen: Awaited<ReturnType<typeof db.report.findUnique>> = null;

  if (regenerateHash) {
    existingForRegen = await db.report.findUnique({
      where: { raw_description_hash: regenerateHash },
    });
    if (!existingForRegen) {
      return NextResponse.json({ error: "Report not found for regeneration" }, { status: 404 });
    }
    enrichedDescription = existingForRegen.raw_description;
  } else {
    const trimmed = body.enrichedDescription?.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "enrichedDescription is required" }, { status: 400 });
    }
    enrichedDescription = trimmed;
  }

  try {
    const hash = regenerateHash ?? createHash("sha256").update(enrichedDescription).digest("hex");

    if (!skipCache && !regenerateHash) {
      const existing = await db.report.findUnique({
        where: { raw_description_hash: hash },
      });

      if (existing) {
        return NextResponse.json({ status: 'report_ready', hash, ...(existing.response as object) });
      }
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

    const reflectionResult = await client.prompts.execute<ReflectionQuestions>(
      'prm_p9EwbQ74Yw08',
      {
        provider: 'openai',
        model: 'gpt-5.2',
        tag: env.PROMPT_VERSION_TAG,
        variables: { report: JSON.stringify(responseData) },
        responseSchema: reflectionQuestionsJsonSchema,
        traceId: result.traceId,
      }
    );

    const reflectionQuestions = reflectionResult.object?.questions ?? [];
    const structuralFocus = reflectionResult.object?.structural_focus ?? '';

    if (skipCache) {
      const reportResponse = {
        ...responseData,
        structural_focus: structuralFocus,
        reflection_questions: reflectionQuestions,
        created_at: new Date(),
      };
      return NextResponse.json({ status: 'report_ready', hash, ...reportResponse });
    }

    if (existingForRegen) {
      const reportResponse = {
        ...responseData,
        structural_focus: structuralFocus,
        reflection_questions: reflectionQuestions,
        report_id: existingForRegen.id,
        created_at: existingForRegen.createdAt,
      };
      await db.report.update({
        where: { id: existingForRegen.id },
        data: { response: reportResponse },
      });
      return NextResponse.json({ status: 'report_ready', hash, ...reportResponse });
    }

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
      structural_focus: structuralFocus,
      reflection_questions: reflectionQuestions,
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
