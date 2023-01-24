export interface IDynamicSchema {
  id: string;
  title: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IDynamicSchemaFieldType =
  | 'number'
  | 'boolean'
  | 'text'
  | 'multi-text'
  | 'list'
  | 'date';

export interface IDynamicSchemaField {
  schema: string | object;
  title: string;
  name: string;
  type: IDynamicSchemaFieldType;
  unique?: boolean;
  required?: boolean;
  default?: any;
}
