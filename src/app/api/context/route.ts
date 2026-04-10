import { NextResponse } from "next/server";
import { SynovaCloudSdk } from "@synova-cloud/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import { env } from "~/env";
import {
  CATEGORIES,
  QuestionGeneratorResponseSchema,
  TopicExtractionResponseSchema,
  InputValidationResponseSchema,
  type QuestionGeneratorResponse,
  type TopicExtractionResponse,
  type InputValidationResponse,
  type SessionState,
  type Category,
  getCurrentCategoryDimensions,
} from "~/app/types/contextSchema";

const questionGeneratorJsonSchema = zodToJsonSchema(QuestionGeneratorResponseSchema);
const topicExtractionJsonSchema = zodToJsonSchema(TopicExtractionResponseSchema);
const inputValidationJsonSchema = zodToJsonSchema(InputValidationResponseSchema);

function buildEnrichedDescription(state: SessionState): string {
  const parts: string[] = [state.originalDescription];

  for (const entry of state.log) {
    if (entry.questions.length === 0) continue;
    parts.push(`\n## Категория ${entry.category}`);
    for (let i = 0; i < entry.questions.length; i++) {
      const q = entry.questions[i] ?? '';
      const a = entry.answers[i] ?? '';
      parts.push(`В: ${q}\nО: ${a}`);
    }
  }

  return parts.join('\n\n');
}

export async function POST(request: Request) {
  const client = new SynovaCloudSdk(env.SYNOVA_SECRET);

  const body = (await request.json()) as {
    description?: string;
    sessionState?: SessionState | null;
    answers?: string[];
  };

  try {
    let state: SessionState;

    let inputValidationTraceId: undefined | string;
    let topicSummaryTraceId: undefined | string;

    if (!body.sessionState) {
      const description = body.description?.trim();
      if (!description) {
        return NextResponse.json({ error: "description is required" }, { status: 400 });
      }

      const validationResult = await client.prompts.execute<InputValidationResponse>(
        'prm_eBnpKGzSLio0',
        {
          provider: 'openai',
          model: 'gpt-4.1-mini',
          tag: env.PROMPT_VERSION_TAG,
          variables: { user_input: description },
          responseSchema: inputValidationJsonSchema,
        },
      );
      inputValidationTraceId = validationResult.traceId;

      const validation = InputValidationResponseSchema.parse(validationResult.object);

      if (validation.classification !== 'decision') {
        return NextResponse.json({
          status: 'validation_failed',
          classification: validation.classification,
          message: validation.message,
        });
      }

      state = {
        originalDescription: description,
        categoryIndex: 0,
        coveredTopics: [],
        currentQuestions: [],
        log: [],
      };
    } else {
      state = { ...body.sessionState };
      const answers = body.answers ?? [];

      const topicResult = await client.prompts.execute<TopicExtractionResponse>(
        'prm_TxscUEfDA1LP',
        {
          provider: 'openai',
          model: 'gpt-5.2',
          tag: env.PROMPT_VERSION_TAG,
          variables: {
            questions: state.currentQuestions.join('\n'),
            answers: answers.join('\n'),
          },
          responseSchema: topicExtractionJsonSchema,
        },
      );
      topicSummaryTraceId = topicResult.traceId;

      const topicData = TopicExtractionResponseSchema.parse(topicResult.object);

      const currentCategory = CATEGORIES[state.categoryIndex] as Category;
      state = {
        ...state,
        coveredTopics: [...state.coveredTopics, ...topicData.covered_topics],
        log: [
          ...state.log,
          {
            category: currentCategory,
            questions: state.currentQuestions,
            answers,
          },
        ],
        categoryIndex: state.categoryIndex + 1,
        currentQuestions: [],
      };
    }

    while (state.categoryIndex < CATEGORIES.length) {
      const category = CATEGORIES[state.categoryIndex] as Category;

      const questionResult = await client.prompts.execute<QuestionGeneratorResponse>(
        'prm_Eg4albd4wBAq',
        {
          provider: 'openai',
          model: 'gpt-5.2',
          tag: env.PROMPT_VERSION_TAG,
          variables: {
            description: state.originalDescription,
            category,
            current_category_dimensions: getCurrentCategoryDimensions(category),
            covered_topics: state.coveredTopics.join('\n'),
          },
          responseSchema: questionGeneratorJsonSchema,
          traceId: inputValidationTraceId ?? topicSummaryTraceId,
        },
      );

      const questionData = QuestionGeneratorResponseSchema.parse(questionResult.object);

      if (questionData.questions.length === 0) {
        state = {
          ...state,
          coveredTopics: [...state.coveredTopics, ...questionData.covered_topics_after],
          categoryIndex: state.categoryIndex + 1,
        };
        continue;
      }

      state = {
        ...state,
        currentQuestions: questionData.questions,
      };

      return NextResponse.json({
        status: 'questions',
        categoryLabel: category,
        questions: questionData.questions,
        sessionState: state,
      });
    }

    const enrichedDescription = buildEnrichedDescription(state);
    return NextResponse.json({ status: 'ready', enrichedDescription });
  } catch (error) {
    console.error("Context error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
