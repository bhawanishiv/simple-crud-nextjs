import { models, Schema, Model, model } from 'mongoose';

import { IDynamicSchema } from '@/interfaces/DynamicSchema';

const dynamicSchemaSchema = new Schema<IDynamicSchema>(
  {
    title: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
  }
);

export default (models['IDynamicSchema'] as Model<IDynamicSchema>) ||
  model<IDynamicSchema>('IDynamicSchema', dynamicSchemaSchema);
