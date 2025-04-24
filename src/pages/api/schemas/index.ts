// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { z, ZodError } from 'zod';
import _ from 'lodash';

import { connectToDatabase } from '@/lib/mongo';
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
    z.number().nonnegative().max(100),
  ),

  skip: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().nonnegative(),
  ),
  sort: z.record(z.string().trim(), z.number()).optional(),
});

type Data = {
  message: string;
};

const getSchemas = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { query, limit, skip, sort } = GetSchemasSchema.parse(req.query);
    await connectToDatabase();

    const filter = query
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

    await connectToDatabase();

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

    await connectToDatabase();

    const updatedSchema = await DynamicSchema.findByIdAndUpdate(
      id,
      { ...rest },
      {
        returnDocument: 'after',
      },
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

/**
 * @swagger
 * /api/schemas:
 *   get:
 *     tags: [Schema]
 *     description: Returns a paginated list of dynamic schemas
 *     parameters:
 *       - in : query
 *         name : limit
 *         description : Limit, which results in maximum number of items per request
 *         required : true
 *         schema :
 *           type : integer
 *           format : int32
 *           minimum: 1
 *           maximum: 100
 *
 *       - in : query
 *         name : skip
 *         description : Skip, required to skip some items, for pagination
 *         required : true
 *         schema :
 *           type : integer
 *           format : int32
 *           minimum: 0
 *
 *       - in : query
 *         name : query
 *         description : Query, used to find matching Schema objects
 *         required : false
 *         schema :
 *           type : string
 *     responses:
 *       200:
 *         description: List of dynamic schemas
 *
 *   post:
 *      tags: [Schema]
 *      description: Create a new dynamic schema
 *      parameters:
 *       - in : body
 *         name : title
 *         description : title of the schema, used as a label for the schema
 *         example: Fancy Users
 *         required : true
 *         schema :
 *           type : string
 *
 *       - in : body
 *         name : name
 *         description : Unique name of the schema, which shouldn't exist while creating
 *         example: User
 *         required : true
 *         schema :
 *           type : string
 *      responses:
 *        200:
 *          description: Returns the newly created dynamic schema
 *        400:
 *          description: Returns error message if schema is invalid or already exists
 *
 *   patch:
 *      tags: [Schema]
 *      description: Update the existing dynamic schema
 *      parameters:
 *       - in : body
 *         name : id
 *         description : Id of the dynamic schema
 *         required : true
 *         schema :
 *           type : string
 *
 *       - in : body
 *         name : title
 *         description : Title of the dynamic schema to update
 *         required : true
 *         schema :
 *           type : string
 *      responses:
 *        200:
 *          description: Returns the updated values of the dynamic schema
 *        400:
 *          description: Returns error, if there is any
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
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
