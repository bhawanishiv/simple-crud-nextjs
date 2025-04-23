import { models, Schema, model } from 'mongoose';

import {
  IDynamicSchemaField,
  IDynamicSchemaFieldType,
} from '@/interfaces/DynamicSchema';

type FieldMapperResult = any | ((field: IDynamicSchemaField) => any);

const fieldTypeMapper: {
  [key in IDynamicSchemaFieldType]?: FieldMapperResult;
} = {
  boolean: Boolean,
  date: Date,
  number: Number,
  text: String,
  'multi-text': String,
};

const getFieldDef = (field: IDynamicSchemaField) => {
  if (field.type === 'list') {
    return {
      type: String,
      enum: field.options,
      required: Boolean(field.required),
      unique: Boolean(field.unique),
      default: typeof field.default === 'undefined' ? undefined : field.default,
    };
  }

  if (field.relatedSchema && field.relationType) {
    if (field.relationType === 'hasMany') {
      return [
        {
          type: Schema.Types.ObjectId,
          ref: field.relatedSchema,
          required: Boolean(field.required),
          unique: Boolean(field.unique),
          default:
            typeof field.default === 'undefined' ? undefined : field.default,
        },
      ];
    } else {
      return {
        type: Schema.Types.ObjectId,
        ref: field.relatedSchema,
        required: Boolean(field.required),
        unique: Boolean(field.unique),
        default:
          typeof field.default === 'undefined' ? undefined : field.default,
      };
    }
  }

  return {
    type: fieldTypeMapper[field.type],
    required: Boolean(field.required),
    unique: Boolean(field.unique),
    default: typeof field.default === 'undefined' ? undefined : field.default,
  };
};

export const getDynamicSchema = <T extends object>(
  name: string,
  fields: IDynamicSchemaField[],
) => {
  const fieldDef: { [key: string]: any } = {};

  for (const field of fields) {
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
