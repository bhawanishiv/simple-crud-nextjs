// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { z, ZodError } from 'zod';
import _ from 'lodash';

import mongoClient from '@/lib/mongo';
import DynamicSchema from '@/models/DynamicSchema';

const CreateSchemaSchema = z.object({
  title: z.string().trim(),
  name: z
    .string()
    .trim()
    .transform((v) => _.capitalize(_.camelCase(v))),
});

const UpdateSchemaSchema = z.object({
  id: z.string().trim(),
  title: z.string().trim(),
});

const GetSchemasSchema = z.object({
  query: z.string().trim().optional(),
  limit: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().nonnegative().max(100)
  ),

  skip: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().nonnegative()
  ),
  sort: z.record(z.string().trim(), z.number()).optional(),
});

type Data = {
  message: string;
};

const getSchemas = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { query, limit, skip, sort } = GetSchemasSchema.parse(req.query);
    await mongoClient;

    let filter = query
      ? {
          title: {
            $regex: query,
            $options: 'i',
          },
        }
      : {};
    const schemas = await DynamicSchema.aggregate([
      {
        $match: filter,
      },
      { $limit: limit },
      { $skip: skip },
      { $sort: { firstName: 1, ...sort } },
      {
        $project: {
          id: '$_id',
          title: 1,
          name: 1,
          createdAt: 1,
          updatedAt: 1,
          _id: 0,
        },
      },
    ]).exec();

    const count = await DynamicSchema.aggregate([
      { $match: {} },
      { $count: 'count' },
    ]).exec();

    if (!schemas) throw new Error("Couldn't find schemas");
    const response = {
      schemas: schemas,
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

const createSchema = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const schema = CreateSchemaSchema.parse(req.body);

    await mongoClient;

    const schemaExists = await DynamicSchema.findOne({ name: schema.name });

    if (schemaExists) {
      return res.status(400).json({ message: 'Schema already exists' });
    }

    const newSchema = new DynamicSchema({ ...schema });
    const createdSchema = await newSchema.save();

    if (!createdSchema) throw new Error("Couldn't create the schema");
    const { _id, ...rest } = createdSchema.toObject();
    return res.json({
      schema: { ...rest, id: _id.toString() },
    });
  } catch (e) {
    if (e instanceof ZodError) {
      return res.status(400).json(e.errors[0]);
    }
    return res.status(400).json({ message: (e as Error).message });
  }
};

const updateSchema = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const schema = UpdateSchemaSchema.parse(req.body);
    // type User = z.infer<typeof CreateUserSchema>;

    const { id, ...rest } = schema;

    await mongoClient;

    const updatedSchema = await DynamicSchema.findByIdAndUpdate(
      id,
      { ...rest },
      {
        returnDocument: 'after',
      }
    ).exec();
    if (!updatedSchema) throw new Error("Couldn't find or update the schema");

    const { _id, ...restObj } = updatedSchema.toObject();

    return res.json({ schema: { ...restObj, id } });
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
      return await getSchemas(req, res);
    }
    case 'POST': {
      return await createSchema(req, res);
    }

    case 'PATCH': {
      return await updateSchema(req, res);
    }
  }

  res.status(400).json({ message: 'Invalid input' });
}
