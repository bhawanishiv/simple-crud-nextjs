// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { Schema, z, ZodError } from 'zod';
import _ from 'lodash';

import mongoClient from '@/lib/mongo';
import { getDynamicSchema } from '@/lib/dynamic-schema';
import DynamicSchemaField from '@/models/DynamicSchemaField';
import DynamicSchema from '@/models/DynamicSchema';

import { IDynamicSchemaField } from '@/interfaces/DynamicSchema';

type Data = {
  message: string;
};

const getFieldSchema = (field: IDynamicSchemaField) => {
  switch (field.type) {
    case 'text':
    case 'multi-text':
    case 'list': {
      if (!field.required) {
        return z.string().trim().optional();
      }
      return z.string().trim();
    }
    case 'related': {
      let schema;
      if (field.relationType === 'hasMany') {
        schema = z.array(
          z
            .string()
            .trim()
            .transform((v) => new mongoose.Types.ObjectId(v))
        );
      } else {
        schema = z
          .string()
          .trim()
          .nullable()
          .transform((v) => (v ? new mongoose.Types.ObjectId(v) : v));
      }

      if (!field.required) {
        return schema.optional();
      }
    }
    default:
      return z.any();
  }
};

const prepareSchema = (fields: IDynamicSchemaField[]) => {
  const schemaObj: { [key: string]: any } = {};

  for (let field of fields) {
    schemaObj[field.name] = getFieldSchema(field);
  }

  return z.array(z.object(schemaObj));
};

const addItems = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await mongoClient;

    const schemaId = z.string().trim().parse(req.query['schema']);

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

    const values = Schema.parse(req.body);

    const Model = getDynamicSchema(
      schema.name,
      fields as IDynamicSchemaField[]
    );

    const results = await Model.bulkWrite(
      values.map((item) => ({
        insertOne: {
          document: item,
        },
      }))
    );

    const response = {
      ...results.insertedIds,
    };

    return res.json(response);
  } catch (e) {
    if (e instanceof ZodError) {
      return res.status(400).json(e.errors[0]);
    }
    return res.status(400).json({ message: (e as Error).message });
  }
};

const updateItem = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await mongoClient;

    const schemaId = z.string().trim().parse(req.query['schema']);
    const itemId = z.string().trim().parse(req.body.id);

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

    const values = Schema.parse(req.body);

    const Model = getDynamicSchema(
      schema.name,
      fields as IDynamicSchemaField[]
    );

    const item = await Model.findByIdAndUpdate(
      itemId,
      { ...values },
      {
        returnDocument: 'after',
      }
    ).exec();

    if (!item) {
      throw new Error("Couldn't find the item");
    }

    await item.save();

    const response = {
      id: (item._id as any).toString(),
      ...item.toObject(),
    };

    return res.json(response);
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
 * /api/schemas/{id}items:
 *   post:
 *     tags: [Dynamic schema item]
 *     description: Ass items based on defined schema fields
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
 *          description: Returns the created items ids
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
      return await addItems(req, res);
    }
  }

  res.status(400).json({ message: 'Invalid input' });
}
