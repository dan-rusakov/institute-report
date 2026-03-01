import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { db } from "~/server/db";

import { IsString, IsOptional } from 'class-validator';
import { SynovaCloudSdk, ArrayItems, Nullable, SchemaEnum, Description, Example } from '@synova-cloud/sdk';
import { env } from "~/env";

class UncomfortableQuestion {
  @IsString()
  @Description('Unique identifier for the question')
  question_id: string;

  @IsString()
  @Description('The uncomfortable question text that reveals hidden risks or assumptions')
  @Example('What happens if the key contractor disappears mid-project?')
  text: string;

  @SchemaEnum(['true', 'false'])
  @Description('Whether the user provided an answer to this question')
  @Example('true', 'false')
  answer_provided: string;

  @Nullable()
  @IsOptional()
  @IsString()
  @Description('Snapshot of the answer provided by the user, or null if not answered')
  answer_snapshot: string | null;

  constructor(question_id = '', text = '', answer_provided = '', answer_snapshot: string | null = null) {
    this.question_id = question_id;
    this.text = text;
    this.answer_provided = answer_provided;
    this.answer_snapshot = answer_snapshot;
  }
}

class StructuralExposure {
  @IsString()
  @Description('Unique identifier for the structural exposure')
  exposure_id: string;

  @IsString()
  @Description('Description of a structural vulnerability or systemic risk in the case')
  @Example('Single point of failure in the approval chain with no backup authority')
  description: string;

  constructor(exposure_id = '', description = '') {
    this.exposure_id = exposure_id;
    this.description = description;
  }
}

class IrreversibilityPoint {
  @IsString()
  @Description('Unique identifier for the irreversibility point')
  point_id: string;

  @IsString()
  @Description('Description of a decision or action after which rollback becomes impossible or extremely costly')
  @Example('Once the legal entity is dissolved, reactivation requires a full re-registration process')
  description: string;

  constructor(point_id = '', description = '') {
    this.point_id = point_id;
    this.description = description;
  }
}

class ControlLossPoint {
  @IsString()
  @Description('Unique identifier for the control loss point')
  point_id: string;

  @IsString()
  @Description('Description of a moment or condition where the actor loses meaningful influence over the outcome')
  @Example('After signing the exclusivity agreement, negotiation leverage transfers entirely to the counterparty')
  description: string;

  constructor(point_id = '', description = '') {
    this.point_id = point_id;
    this.description = description;
  }
}

class DependencyNode {
  @IsString()
  @Description('Unique identifier for the dependency node')
  dependency_id: string;

  @IsString()
  @Description('Description of an external factor, actor, or resource the outcome critically depends on')
  @Example('Regulatory approval from a single government body with no appeal mechanism')
  description: string;

  constructor(dependency_id = '', description = '') {
    this.dependency_id = dependency_id;
    this.description = description;
  }
}

class FixationGap {
  @IsString()
  @Description('Unique identifier for the fixation gap')
  gap_id: string;

  @IsString()
  @Description('Description of an agreement, commitment, or state that is not properly documented or legally secured')
  @Example('Verbal agreement on profit split with no written contract or witnesses')
  description: string;

  constructor(gap_id = '', description = '') {
    this.gap_id = gap_id;
    this.description = description;
  }
}

class BoundaryCondition {
  @IsString()
  @Description('Unique identifier for the boundary condition')
  condition_id: string;

  @IsString()
  @Description('Description of an assumption or environmental condition that must hold for the plan to remain valid')
  @Example('Analysis assumes current tax regime remains unchanged for the next 24 months')
  description: string;

  constructor(condition_id = '', description = '') {
    this.condition_id = condition_id;
    this.description = description;
  }
}

class NonInterpretationNotice {
  @IsString()
  @Description('Disclaimer clarifying what this analysis does not constitute (legal, financial, or professional advice)')
  @Example('This analysis is not legal advice and does not substitute consultation with a qualified attorney')
  text: string;

  constructor(text = '') {
    this.text = text;
  }
}

class InputSnapshot {
  @Description('Key-value pairs of structured parameters extracted from the input. Each entry is [parameter_name, value]')
  @Example([['entity_type', 'LLC'], ['jurisdiction', 'Russia']])
  structured_parameters_array: [string, (string | number)][];

  constructor() {
    this.structured_parameters_array = [];
  }
}

class ReportResponse {
  @IsString()
  @Description('Business domain or industry niche the case belongs to')
  @Example('Corporate restructuring', 'Real estate transaction', 'Startup fundraising')
  niche: string;

  @IsString()
  @Description('Type or category of the case being analyzed')
  @Example('Asset sale', 'Partnership dissolution', 'Regulatory compliance')
  case_type: string;

  @ArrayItems(String)
  @Description('Ordered list of report block identifiers defining the analysis structure')
  @Example(['uncomfortable_questions', 'structural_exposure', 'irreversibility_points'])
  block_order: string[];

  @Description('List of probing questions that surface hidden risks, assumptions, or overlooked factors')
  uncomfortable_questions: UncomfortableQuestion[];

  @Description('Systemic vulnerabilities and structural weaknesses identified in the case')
  structural_exposure: StructuralExposure[];

  @Description('Points of no return where decisions become irreversible')
  irreversibility_points: IrreversibilityPoint[];

  @Description('Moments or conditions where the actor loses control over the outcome')
  control_loss_points: ControlLossPoint[];

  @Description('Critical external dependencies that the outcome hinges on')
  dependency_nodes: DependencyNode[];

  @Description('Missing documentation, unrecorded agreements, or legally unsecured commitments')
  fixation_gaps: FixationGap[];

  @Description('Assumptions and environmental conditions required for the analysis to remain valid')
  boundary_conditions: BoundaryCondition[];

  @Description('Disclaimer about the non-advisory nature of this analysis')
  non_interpretation_notice: NonInterpretationNotice;

  @Description('Structured summary of the input as interpreted by the model')
  input_snapshot: InputSnapshot;

  constructor() {
    this.niche = '';
    this.case_type = '';
    this.block_order = [];
    this.uncomfortable_questions = [];
    this.structural_exposure = [];
    this.irreversibility_points = [];
    this.control_loss_points = [];
    this.dependency_nodes = [];
    this.fixation_gaps = [];
    this.boundary_conditions = [];
    this.non_interpretation_notice = new NonInterpretationNotice();
    this.input_snapshot = new InputSnapshot();
  }
}

const client = new SynovaCloudSdk(env.SYNOVA_SECRET);

export async function POST(request: Request) {
  const body = (await request.json()) as { description: string };
  const description = body.description?.trim();

  if (!description) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  const hash = createHash("sha256").update(description).digest("hex");

  const existing = await db.report.findUnique({
    where: { raw_description_hash: hash },
  });

  if (existing) {
    return NextResponse.json({ error: "duplicate" }, { status: 409 });
  }

  const responseData = await client.prompts.execute<ReportResponse>('prm_HFL0R9Cgp2lv', {
    provider: 'anthropic',
    model: 'claude-sonnet-4-5',
    tag: 'latest',
    variables: { raw_description: description },
    responseClass: ReportResponse,
  });

  console.log(responseData);

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
    uncomfortable_questions_count: responseData.uncomfortable_questions.length,
    input_snapshot: {
      description: description,
      structured_parameters: Object.fromEntries(responseData.input_snapshot.structured_parameters_array as [string, (string | number)][]),
    },
  }

  return NextResponse.json(reportResponse, { status: 200 });
}
