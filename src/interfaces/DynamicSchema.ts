import { z } from 'zod';

export interface IDynamicSchema {
  id: string;
  title: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export const FieldTypeEnum = z.enum([
  'number',
  'boolean',
  'text',
  'multi-text',
  'list',
  'date',
  'related',
]);

export type IDynamicSchemaFieldType = z.infer<typeof FieldTypeEnum>;

export const RelatedTypeEnum = z.enum(['hasOne', 'hasMany']);
export type IDynamicSchemaRelationType = z.infer<typeof RelatedTypeEnum>;

export interface IDynamicSchemaField {
  id: string;
  schema: string | object;
  title: string;
  name: string;
  type: IDynamicSchemaFieldType;
  unique?: boolean;
  required?: boolean;
  default?: any;
  relatedSchema?: string;
  relationType?: IDynamicSchemaRelationType;
}
