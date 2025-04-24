import { z } from 'zod';

export const nodeDataSchema = z.object({
  key: z.string(),
  parent: z.string().optional(),
  text: z.string(),
  brush: z.string().optional(),
  dir: z.string().optional(),
  loc: z.string(),
});

export const goMindMapSchema = z.object({
  class: z.literal('go.TreeModel'),
  nodeDataArray: z.array(nodeDataSchema),
});

export const listStringSchema = z.object({
  list: z.array(z.object({ text: z.string() })),
});

export type TNodeData = z.infer<typeof nodeDataSchema>;
export type TGoMindMapSchema = z.infer<typeof goMindMapSchema>;
export type TListStringSchema = z.infer<typeof listStringSchema>;

export const aiRequestSchema = z.object({
  system: z.string(),
  prompt: z.string(),
  stream: z.boolean().optional(),
});

export const aiRequestWithSchemaSchema = aiRequestSchema.extend({
  schema: z.enum(['mind-map', 'list(string)']),
});

export type TAiRequestWithSchema = z.infer<typeof aiRequestWithSchemaSchema>;

export const schemas = {
  'mind-map': goMindMapSchema,
  'list(string)': listStringSchema,
};

export type TAiRequest = z.infer<typeof aiRequestSchema>;

export type TSchemaType = keyof typeof schemas;
