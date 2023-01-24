import { models, Schema, model } from 'mongoose';

import {
  IDynamicSchemaField,
  IDynamicSchemaFieldType,
} from '@/interfaces/DynamicSchema';

const fields: IDynamicSchemaField[] = [
  {
    schema: 'sdf',
    type: 'text',
    title: 'First Name',
    name: 'firstName',
    required: true,
  },
  {
    schema: 'sdf',
    type: 'text',
    title: 'Last Name',
    name: 'firstName',
  },
  {
    schema: 'sdf',
    type: 'text',
    title: 'Username',
    name: 'username',
    unique: true,
    required: true,
  },
  {
    schema: 'sdf',
    type: 'text',
    title: 'Email',
    name: 'email',
    unique: true,
    required: true,
  },
  {
    schema: 'sdf',
    type: 'list',
    title: 'Role',
    name: 'role',
    default: 'USER',
  },
];

type FieldMapperResult = any | ((field: IDynamicSchemaField) => any);

const fieldTypeMapper: { [key in IDynamicSchemaFieldType]: FieldMapperResult } =
  {
    boolean: Boolean,
    date: Date,
    list: String,
    number: Number,
    text: String,
    'multi-text': [{ type: String }],
  };

const getFieldDef = (field: IDynamicSchemaField) => {
  return {
    type: fieldTypeMapper[field.type],
    required: Boolean(field.required),
    unique: Boolean(field.unique),
    default: typeof field.default === 'undefined' ? undefined : field.default,
  };
};

export const getDynamicSchema = <T extends {}>(
  name: string,
  fields: IDynamicSchemaField[]
) => {
  const fieldDef: { [key: string]: any } = {};

  for (let field of fields) {
    fieldDef[field.name] = getFieldDef(field);
  }

  const dynamicSchema = new Schema<T>(fieldDef, {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
  });

  if (models[name]) {
    delete models[name];
  }

  return model<T>(name, dynamicSchema);
};
