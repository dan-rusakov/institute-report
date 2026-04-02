import { z } from 'zod';

export const CATEGORIES = ['A', 'B', 'C', 'D', 'E'] as const;
export type Category = (typeof CATEGORIES)[number];

const CATEGORY_DIMENSIONS: Record<string, string[]> = {
  A: ["A1", "A2", "A3", "A4", "A5"],
  B: ["B1", "B2", "B3", "B4", "B5", "B6"],
  C: ["C1", "C2", "C3", "C4", "C5", "C6", "C7"],
  D: ["D1", "D2", "D3", "D4", "D5", "D6"],
  E: ["E1", "E2", "E3", "E4"],
};

export function getCurrentCategoryDimensions(categoryId: string): string {
  return CATEGORY_DIMENSIONS[categoryId]?.join(", ") ?? "";
}

export const QuestionGeneratorResponseSchema = z.object({
  questions: z
    .array(z.string())
    .describe(
      "Список вопросов для пользователя. Каждый элемент — один вопрос на одно измерение. Пустой массив если все измерения категории пропущены.",
    ),
  covered_topics_after: z
    .array(z.string())
    .describe(
      "Краткий список тем (3-7 слов каждая) которые покрывают вопросы из этого раунда. Будет передан в следующую категорию как список уже покрытых тем. Пустой массив если questions пустой.",
    ),
});

export type QuestionGeneratorResponse = z.infer<typeof QuestionGeneratorResponseSchema>;

export const TopicExtractionResponseSchema = z.object({
  covered_topics: z
    .array(z.string())
    .describe(
      "Краткий список тем фактически покрытых в ответах пользователя. Каждая тема — 3-7 слов. Только то о чём реально говорил пользователь.",
    ),
});

export type TopicExtractionResponse = z.infer<typeof TopicExtractionResponseSchema>;

export interface CategoryLogEntry {
  category: Category;
  questions: string[];
  answers: string[];
}

export interface SessionState {
  originalDescription: string;
  categoryIndex: number;
  coveredTopics: string[];
  currentQuestions: string[];
  log: CategoryLogEntry[];
}

export const InputValidationResponseSchema = z.object({
  classification: z
    .enum(["decision", "question", "irrelevant"])
    .describe("Тип ввода: decision — описание сделки/решения, question — вопрос ожидающий совета, irrelevant — не по теме."),
  message: z
    .string()
    .describe("Человекопонятное сообщение на русском языке. Пустая строка если classification = decision."),
});

export type InputValidationResponse = z.infer<typeof InputValidationResponseSchema>;
