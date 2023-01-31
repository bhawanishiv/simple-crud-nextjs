// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import _ from 'lodash';
import { Schema, z, ZodError } from 'zod';

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
        z.string().trim().optional();
      }
      return z.string().trim();
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

  return z.object(schemaObj);
};

const createItem = async (req: NextApiRequest, res: NextApiResponse) => {
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
      }
    ).exec();

    if (!fields) throw new Error("Couldn't find schema fields");

    const Schema = prepareSchema(fields);

    const values = Schema.parse(req.body);

    const Model = getDynamicSchema(
      schema.name,
      fields as IDynamicSchemaField[]
    );

    const item = new Model({ ...values });
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

const deleteItem = async (req: NextApiRequest, res: NextApiResponse) => {
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
      }
    ).exec();

    if (!fields) throw new Error("Couldn't find schema fields");

    const Model = getDynamicSchema(
      schema.name,
      fields as IDynamicSchemaField[]
    );

    const item = await Model.findByIdAndDelete(itemId, {
      returnDocument: 'after',
    });

    if (!item) {
      throw new Error("Couldn't find the item");
    }

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'POST': {
      return await createItem(req, res);
    }
    case 'PATCH': {
      return await updateItem(req, res);
    }
    case 'DELETE': {
      return await deleteItem(req, res);
    }
  }

  res.status(400).json({ message: 'Invalid input' });
}
