import { z } from 'zod';

export interface IDynamicSchema {
  id: string;
  title: string;
  name: string;
  createdAt: string;
  updatedAt: string;
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

export type IDynamicSchemaFieldType =
  | 'number'
  | 'boolean'
  | 'text'
  | 'multi-text'
  | 'list'
  | 'date'
  | 'related';

export const RelatedTypeEnum = z.enum(['hasOne', 'hasMany']);
export type IDynamicSchemaRelationType = 'hasOne' | 'hasMany';

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
  createdAt: string;
  updatedAt: string;
  options?: string[];
}
