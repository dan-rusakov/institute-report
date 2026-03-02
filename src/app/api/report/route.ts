import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { SynovaCloudSdk, SchemaResolver } from "@synova-cloud/sdk";
import { db } from "~/server/db";
import { env } from "~/env";

const uncomfortableQuestionSchema = z.object({
  question_id: z.string().describe("Unique identifier for the question"),
  text: z
    .string()
    .describe(
      "The uncomfortable question text that reveals hidden risks or assumptions",
    ),
  answer_provided: z
    .enum(["true", "false"])
    .describe("Whether the user provided an answer to this question"),
  answer_snapshot: z
    .string()
    .describe(
      "Snapshot of the answer provided by the user, or empty string if not answered",
    ),
});

const structuralExposureSchema = z.object({
  exposure_id: z
    .string()
    .describe("Unique identifier for the structural exposure"),
  description: z
    .string()
    .describe(
      "Description of a structural vulnerability or systemic risk in the case",
    ),
});

const irreversibilityPointSchema = z.object({
  point_id: z
    .string()
    .describe("Unique identifier for the irreversibility point"),
  description: z
    .string()
    .describe(
      "Description of a decision or action after which rollback becomes impossible or extremely costly",
    ),
});

const controlLossPointSchema = z.object({
  point_id: z.string().describe("Unique identifier for the control loss point"),
  description: z
    .string()
    .describe(
      "Description of a moment or condition where the actor loses meaningful influence over the outcome",
    ),
});

const dependencyNodeSchema = z.object({
  dependency_id: z
    .string()
    .describe("Unique identifier for the dependency node"),
  description: z
    .string()
    .describe(
      "Description of an external factor, actor, or resource the outcome critically depends on",
    ),
});

const fixationGapSchema = z.object({
  gap_id: z.string().describe("Unique identifier for the fixation gap"),
  description: z
    .string()
    .describe(
      "Description of an agreement, commitment, or state that is not properly documented or legally secured",
    ),
});

const boundaryConditionSchema = z.object({
  condition_id: z
    .string()
    .describe("Unique identifier for the boundary condition"),
  description: z
    .string()
    .describe(
      "Description of an assumption or environmental condition that must hold for the plan to remain valid",
    ),
});

const nonInterpretationNoticeSchema = z.object({
  text: z
    .string()
    .describe(
      "Disclaimer clarifying what this analysis does not constitute (legal, financial, or professional advice)",
    ),
});

const inputSnapshotSchema = z.object({
  structured_parameters_array: z
    .array(z.object({
      key: z.string().describe("Parameter name"),
      value: z.string().describe("Parameter value"),
    }))
    .describe(
      "Key-value pairs of structured parameters extracted from the input",
    ),
});

const reportResponseSchema = z.object({
  niche: z
    .string()
    .describe("Business domain or industry niche the case belongs to"),
  case_type: z
    .string()
    .describe("Type or category of the case being analyzed"),
  block_order: z
    .array(z.string())
    .describe(
      "Ordered list of report block identifiers defining the analysis structure",
    ),
  uncomfortable_questions: z
    .array(uncomfortableQuestionSchema)
    .describe(
      "List of probing questions that surface hidden risks, assumptions, or overlooked factors",
    ),
  structural_exposure: z
    .array(structuralExposureSchema)
    .describe(
      "Systemic vulnerabilities and structural weaknesses identified in the case",
    ),
  irreversibility_points: z
    .array(irreversibilityPointSchema)
    .describe("Points of no return where decisions become irreversible"),
  control_loss_points: z
    .array(controlLossPointSchema)
    .describe(
      "Moments or conditions where the actor loses control over the outcome",
    ),
  dependency_nodes: z
    .array(dependencyNodeSchema)
    .describe("Critical external dependencies that the outcome hinges on"),
  fixation_gaps: z
    .array(fixationGapSchema)
    .describe(
      "Missing documentation, unrecorded agreements, or legally unsecured commitments",
    ),
  boundary_conditions: z
    .array(boundaryConditionSchema)
    .describe(
      "Assumptions and environmental conditions required for the analysis to remain valid",
    ),
  non_interpretation_notice: nonInterpretationNoticeSchema.describe(
    "Disclaimer about the non-advisory nature of this analysis",
  ),
  input_snapshot: inputSnapshotSchema.describe(
    "Structured summary of the input as interpreted by the model",
  ),
});

type ReportResponse = z.infer<typeof reportResponseSchema>;

export async function POST(request: Request) {
  const client = new SynovaCloudSdk(env.SYNOVA_SECRET);
  const body = (await request.json()) as { description: string };
  const description = body.description?.trim();

  if (!description) {
    return NextResponse.json(
      { error: "Description is required" },
      { status: 400 },
    );
  }

  const hash = createHash("sha256").update(description).digest("hex");

  const existing = await db.report.findUnique({
    where: { raw_description_hash: hash },
  });

  if (existing) {
    return NextResponse.json({ error: "duplicate" }, { status: 409 });
  }

  try {
    // DEBUG
    const generatedSchema = await SchemaResolver.resolve(reportResponseSchema);
    console.log("Generated JSON Schema:", JSON.stringify(generatedSchema, null, 2));

    const result = await client.prompts.execute<ReportResponse>(
      "prm_HFL0R9Cgp2lv",
      {
      provider: "anthropic",
      model: "claude-sonnet-4-5",
      tag: "latest",
      variables: { raw_description: description },
      responseSchema: reportResponseSchema,
    });

    console.log("Raw response:", JSON.stringify(result, null, 2));

    const responseData = result.object;

    console.log("Response:", responseData);
    console.log("Usage:", result.executionUsage);

    const report = await db.report.create({
      data: {
        raw_description: description,
        raw_description_hash: hash,
        provider: "anthropic",
        model: "claude-sonnet-4-5",
        response: {},
      },
    });

    const reportResponse = {
      ...responseData,
      report_version: "1.0",
      logic_version: "fixed_v1.0",
      report_id: report.id,
      created_at: report.createdAt,
      regeneration_allowed: false,
      post_processing_allowed: false,
      uncomfortable_questions_count:
        responseData?.uncomfortable_questions.length,
      input_snapshot: {
        description: description,
        structured_parameters: Object.fromEntries(
          responseData?.input_snapshot.structured_parameters_array.map(
            ({ key, value }) => [key, value]
          ) ?? [],
        ),
      },
    };

    return NextResponse.json(reportResponse, { status: 200 });
  } catch (error) {
    console.error("Error generating report:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    if ('details' in error) {
      console.error("Error details:", JSON.stringify((error as any).details, null, 2));
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
