import { z } from 'zod';

export const aiRequestSchema = z.object({
  system: z.string(),
  prompt: z.string(),
  stream: z.boolean().optional(),
  schema: z.string().optional(),
});

export type TAiRequest = z.infer<typeof aiRequestSchema>;
