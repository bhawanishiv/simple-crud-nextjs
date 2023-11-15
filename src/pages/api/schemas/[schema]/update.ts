// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { Schema, z, ZodError } from 'zod';
import _ from 'lodash';

import { connectToDatabase } from '@/lib/mongo';
import { getDynamicSchema } from '@/lib/dynamic-schema';
import DynamicSchemaField from '@/models/DynamicSchemaField';
import DynamicSchema from '@/models/DynamicSchema';

import { IDynamicSchemaField } from '@/interfaces/DynamicSchema';

type Data = {
  message: string;
};

const getSchema = (field: IDynamicSchemaField) => {
  switch (field.type) {
    case 'text':
    case 'multi-text':
    case 'list': {
      return z.string().trim().optional();
    }
    case 'related': {
      if (field.relationType === 'hasMany') {
        return z
          .array(
            z
              .string()
              .trim()
              .transform((v) => new mongoose.Types.ObjectId(v))
          )
          .optional();
      } else {
        return z
          .string()
          .trim()
          .nullable()
          .transform((v) => (v ? new mongoose.Types.ObjectId(v) : v))
          .optional();
      }
    }
    default:
      return z.any();
  }
};

const prepareSchema = (fields: IDynamicSchemaField[]) => {
  const schemaObj: { [key: string]: any } = {};

  for (let field of fields) {
    schemaObj[field.name] = getSchema(field);
  }

  return z.object(schemaObj);
};

const RequestSchema = z.object({
  body: z.object({
    filter: z.any(),
    update: z.any(),
    updateType: z.enum(['single', 'many']),
  }),
});

const updateItem = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await connectToDatabase();

    const schemaId = z.string().trim().parse(req.query['schema']);

    const input = RequestSchema.parse(req);

    const schema = await DynamicSchema.findById(schemaId);

    if (!schema) {
      return res.status(404).json({ message: "Couldn't the find schema" });
    }

    const id = schema._id.toString();

    const fields = await DynamicSchemaField.find(
      { schema: id },
      {
        id: '$_id',
        _id: 0,
        title: 1,
        name: 1,
        createdAt: 1,
        updatedAt: 1,
        schema: 1,
        type: 1,
        required: 1,
        unique: 1,
        default: 1,
        relationType: 1,
        relatedSchema: 1,
        options: 1,
      }
    ).exec();

    if (!fields) throw new Error("Couldn't find schema fields");

    const Schema = prepareSchema(fields);

    const Model = getDynamicSchema(
      schema.name,
      fields as IDynamicSchemaField[]
    );

    const {
      body: { filter, updateType, update },
    } = input;

    const values = Schema.parse(update);

    if (updateType === 'many') {
      const manyItemsUpdate = await Model.updateMany(filter, values).exec();
      return res.json(manyItemsUpdate);
    } else {
      const singleUpdate = await Model.updateOne(filter, values).exec();
      return res.json(singleUpdate);
    }
  } catch (e) {
    if (e instanceof ZodError) {
      return res.status(400).json(e.errors[0]);
    }
    return res.status(400).json({ message: (e as Error).message });
  }
};

/**
 *
 * @swagger
 * /api/schemas/{id}/update:
 *   post:
 *     tags: [Dynamic schema item]
 *     description: Update single or multiple items based on query and filters on dynamic schema items
 *     parameters:
 *       - in : path
 *         name: id
 *         description: Schema Id
 *         required: true
 *         schema:
 *           type: string
 *
 *     responses:
 *        200:
 *          description: Returns the result of update operation
 *          content:
 *              application/json:
 *                 schema:
 *                    type: object
 *
 *        404:
 *          description: Results error if schema id is not found
 *        400:
 *          description: Error, for any invalid input
 *
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'POST': {
      return await updateItem(req, res);
    }
  }

  res.status(400).json({ message: 'Invalid input' });
}
