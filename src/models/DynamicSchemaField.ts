import { models, Schema, Model, model } from 'mongoose';

import { IDynamicSchemaField } from '@/interfaces/DynamicSchema';

const dynamicSchemaFieldSchema = new Schema<IDynamicSchemaField>(
  {
    schema: {
      type: Schema.Types.ObjectId,
      ref: 'DynamicSchema',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    required: {
      type: Boolean,
    },
    unique: {
      type: Boolean,
    },
    default: {
      type: Schema.Types.Mixed,
    },
    relatedSchema: {
      type: String,
    },
    relationType: {
      type: String,
    },
    options: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
  }
);

export default (models['DynamicSchemaField'] as Model<IDynamicSchemaField>) ||
  model<IDynamicSchemaField>('DynamicSchemaField', dynamicSchemaFieldSchema);
