import { z } from 'zod';

export const goMindMapSchema = z.object({
  class: z.literal('go.TreeModel'),
  nodeDataArray: z.array(
    z.object({
      key: z.string(),
      parent: z.string().optional(),
      text: z.string(),
      brush: z.string().optional(),
      dir: z.string().optional(),
      loc: z.string(),
    })
  ),
});

export const listStringSchema = z.object({
  list: z.array(z.object({ text: z.string() })),
});

export type TGoMindMapSchema = z.infer<typeof goMindMapSchema>;
export type TListStringSchema = z.infer<typeof listStringSchema>;

const schemas = {
  'mind-map': goMindMapSchema,
  'list(string)': listStringSchema,
};

export default schemas;
