// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import _ from 'lodash';
import { z, ZodError } from 'zod';

import mongoClient from '@/lib/mongo';
import { getDynamicSchema } from '@/lib/dynamic-schema';
import DynamicSchemaField from '@/models/DynamicSchemaField';
import DynamicSchema from '@/models/DynamicSchema';

import { FieldTypeEnum, IDynamicSchemaField } from '@/interfaces/DynamicSchema';

const SchemaFieldsSchema = z.object({
  fields: z
    .array(
      z.object({
        id: z.string().trim(),
        title: z.string().trim(),
        name: z.string().trim(),
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
      })
    )
    .optional(),
  limit: z.number().nonnegative().max(100),
  skip: z.number().nonnegative(),
  sort: z.record(z.string().trim(), z.number()).optional(),
  query: z.string().trim().optional(),
});

type Data = {
  message: string;
};

const getSchemaItems = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await mongoClient;

    const params = SchemaFieldsSchema.parse(req.body);

    const schemaName = z
      .string()
      .trim()
      .transform((v) => _.capitalize(_.camelCase(v)))
      .parse(req.query['schema']);

    const schema = await DynamicSchema.findOne({ name: schemaName });

    if (!schema) {
      return res.status(404).json({ message: "Couldn't the find schema" });
    }

    const id = schema._id.toString();

    const fields =
      params.fields ||
      (await DynamicSchemaField.find(
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
        }
      ).exec());

    if (!fields) throw new Error("Couldn't find schema fields");

    const Model = getDynamicSchema(
      schema.name,
      fields as IDynamicSchemaField[]
    );

    const { limit, skip, sort } = params;
    const items = await Model.aggregate([
      { $match: {} },
      { $limit: limit },
      { $skip: skip },
      { $sort: { firstName: 1, ...sort } },
      {
        $addFields: {
          id: '$_id',
        },
      },
    ]).exec();

    const count = await Model.aggregate([
      { $match: {} },
      { $count: 'count' },
    ]).exec();

    const response = {
      schema: { ...schema.toObject(), id },
      fields: fields,
      items: items,
      count: count[0] ? count[0]?.count : 0,
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
      return await getSchemaItems(req, res);
    }
  }

  res.status(400).json({ message: 'Invalid input' });
}
