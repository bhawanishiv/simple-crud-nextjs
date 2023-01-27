// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import _ from 'lodash';
import { z, ZodError } from 'zod';

import mongoClient from '@/lib/mongo';
import DynamicSchemaField from '@/models/DynamicSchemaField';
import { FieldTypeEnum } from '@/interfaces/DynamicSchema';

const CreateDynamicFieldSchema = z.object({
  title: z.string().trim(),
  name: z.string().trim().optional().transform(_.camelCase),
  type: FieldTypeEnum,
  unique: z.boolean().optional(),
  required: z.boolean().optional(),
  default: z
    .union([
      z.string().trim(),
      z.boolean(),
      z.number(),
      z.array(z.string().trim()),
    ])
    .optional(),
});

const UpdateFieldSchema = z.object({
  id: z.string().trim(),
  title: z.string().trim(),
});

type Data = {
  message: string;
};

const getFields = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await mongoClient;

    const schemaId = z.string().trim().parse(req.query['schema']);

    const fields = await DynamicSchemaField.find(
      { schema: schemaId },
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
      }
    ).exec();

    if (!fields) throw new Error("Couldn't find schema fields");
    const response = {
      fields: fields,
    };

    return res.json(response);
  } catch (e) {
    if (e instanceof ZodError) {
      return res.status(400).json(e.errors[0]);
    }
    return res.status(400).json({ message: (e as Error).message });
  }
};

const createField = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const schemaId = z.string().trim().parse(req.query['schema']);

    const field = CreateDynamicFieldSchema.parse(req.body);

    const name = field.name || _.camelCase(field.title);

    await mongoClient;

    const fieldNameExists = await DynamicSchemaField.findOne({
      $and: [
        {
          name,
        },
        {
          schema: schemaId,
        },
      ],
    });

    if (fieldNameExists) {
      return res.status(400).json({ message: 'Field name already exists' });
    }

    const newField = new DynamicSchemaField({
      ...field,
      name,
      schema: schemaId,
    });
    const createdField = await newField.save();

    if (!createdField) throw new Error("Couldn't create field");
    const { _id, ...rest } = createdField.toObject();
    return res.json({
      field: { ...rest, id: _id.toString() },
    });
  } catch (e) {
    if (e instanceof ZodError) {
      return res.status(400).json(e.errors[0]);
    }
    return res.status(400).json({ message: (e as Error).message });
  }
};

const updateField = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const field = UpdateFieldSchema.parse(req.body);

    const { id, ...rest } = field;

    await mongoClient;

    const updatedField = await DynamicSchemaField.findByIdAndUpdate(
      id,
      { ...rest },
      {
        returnDocument: 'after',
      }
    ).exec();
    if (!updatedField) throw new Error("Couldn't find or update the field");

    const { _id, ...restObj } = updatedField.toObject();

    return res.json({ field: { ...restObj, id } });
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
    case 'GET': {
      return await getFields(req, res);
    }
    case 'POST': {
      return await createField(req, res);
    }

    case 'PATCH': {
      return await updateField(req, res);
    }
  }

  res.status(400).json({ message: 'Invalid input' });
}
