import { z } from 'zod';

const dimensionStatus = () => z.object({
  status: z.enum(['present', 'partial', 'absent']),
  evidence: z.string().describe('Brief quote from description or empty string'),
});

const coverage = z.object({
  A1: dimensionStatus(),
  A2: dimensionStatus(),
  A3: dimensionStatus(),
  A4: dimensionStatus(),
  B1: dimensionStatus(),
  B2: dimensionStatus(),
  B3: dimensionStatus(),
  B4: dimensionStatus(),
  C1: dimensionStatus(),
  C2: dimensionStatus(),
  C3: dimensionStatus(),
  C4: dimensionStatus(),
});

const readiness = z.object({
  level_a_complete: z.boolean(),
  level_b_sufficient: z.boolean(),
  level_c_confirmed: z.boolean(),
  ready: z.boolean(),
});

const question = z.object({
  target_dimension: z.enum([
    'A1', 'A2', 'A3', 'A4',
    'B1', 'B2', 'B3', 'B4',
    'C1', 'C2', 'C3', 'C4',
  ]),
  priority: z.enum(['critical', 'important', 'structural']),
  question: z.string().describe('Question text in Russian'),
});

export const clarificationResponseSchema = z.object({
  status: z.enum(['clarification_needed', 'ready']),
  coverage,
  readiness,
  questions: z.array(question),
  message_to_user: z.string().describe('Brief explanation in Russian, 1-2 sentences'),
  enriched_description: z.string().describe('Full merged case description in Russian'),
});

export type ClarificationResponse = z.infer<typeof clarificationResponseSchema>;
export type ClarificationQuestion = z.infer<typeof question>;
