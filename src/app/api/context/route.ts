import { NextResponse } from "next/server";
import { SynovaCloudSdk } from "@synova-cloud/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import { env } from "~/env";
import {
  CATEGORIES,
  QuestionGeneratorResponseSchema,
  TopicExtractionResponseSchema,
  type QuestionGeneratorResponse,
  type TopicExtractionResponse,
  type SessionState,
  type Category,
  getCurrentCategoryDimensions,
} from "~/app/types/contextSchema";

const questionGeneratorJsonSchema = zodToJsonSchema(QuestionGeneratorResponseSchema);
const topicExtractionJsonSchema = zodToJsonSchema(TopicExtractionResponseSchema);

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

    if (!body.sessionState) {
      const description = body.description?.trim();
      if (!description) {
        return NextResponse.json({ error: "description is required" }, { status: 400 });
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
