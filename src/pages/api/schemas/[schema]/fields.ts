// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import _ from 'lodash';
import { z, ZodError } from 'zod';

import { connectToDatabase } from '@/lib/mongo';
import DynamicSchemaField from '@/models/DynamicSchemaField';
import { FieldTypeEnum, RelatedTypeEnum } from '@/interfaces/DynamicSchema';
import DynamicSchema from '@/models/DynamicSchema';

const CreateDynamicFieldSchema = z.object({
  title: z.string().trim(),
  name: z.string().trim().optional().transform(_.camelCase),
  type: FieldTypeEnum,
  unique: z.boolean().optional(),
  required: z.boolean().optional(),
  relatedSchema: z.string().optional(),
  relationType: RelatedTypeEnum.optional(),
  default: z
    .union([
      z.string().trim(),
      z.null(),
      z.boolean(),
      z.number(),
      z.array(z.string().trim()),
    ])
    .optional(),
});

const ListOptionsSchema = z.array(z.string().trim()).min(1);

const UpdateFieldSchema = z.object({
  id: z.string().trim(),
  title: z.string().trim(),
  options: z.array(z.string().trim()).min(1).optional(),
});

type Data = {
  message: string;
};

const getSchemaAndFields = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    await connectToDatabase();

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
    const response = {
      schema: { ...schema.toObject(), id },
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

    let options;
    if (field.type === 'list') {
      options = ListOptionsSchema.parse(req.body.options);
    }

    const name = field.name || _.camelCase(field.title);

    await connectToDatabase();

    const fieldNameExists = await DynamicSchemaField.findOne({
      $and: [
        {
          name,
        },
        {
          schema: schemaId,
        },
      ],
    }).exec();

    if (fieldNameExists) {
      return res.status(400).json({ message: 'Field name already exists' });
    }

    const newField = new DynamicSchemaField({
      ...field,
      name,
      options,
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

    await connectToDatabase();

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

/**
 *
 * @swagger
 * /api/schemas/{schemaName}/fields:
 *   get:
 *     tags: [Dynamic schema fields]
 *     description: Get fields information along with schema
 *     parameters:
 *       - in : path
 *         name: schemaName
 *         description: Schema name (Unique name which was use while creation)
 *         required: true
 *         schema:
 *           type: string
 *
 *     responses:
 *        200:
 *          description: Returns the fields information along with schema
 *          content:
 *              application/json:
 *                 schema:
 *                    type: object
 *                    properties:
 *                       schema:
 *                           $ref: '#/components/schemas/IDynamicSchema'
 *
 *                       fields:
 *                          type: array
 *                          items:
 *                            type: object
 *                            $ref: '#/components/schemas/IDynamicSchemaField'
 *
 *        404:
 *          description: Results error if schema is not found
 *        400:
 *          description: Error, for any invalid input
 *
 *
 * /api/schemas/{id}/fields:
 *   post:
 *     tags: [Dynamic schema fields]
 *     description: Create a new field for the dynamic schema
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
 *          description: Returns the created field
 *          content:
 *              application/json:
 *                 schema:
 *                    type: object
 *                    $ref: '#/components/schemas/IDynamicSchemaField'
 *        404:
 *          description: Results error if schema id is incorrect
 *        400:
 *          description: Error, for any invalid input
 *
 *   patch:
 *     tags: [Dynamic schema fields]
 *     description: Update the field for the dynamic schema
 *     parameters:
 *       - in : path
 *         name: id
 *         description: Schema Id
 *         required: true
 *         schema:
 *           type: string
 *
 *       - in : body
 *         name: id
 *         description: Field id
 *         required: true
 *         schema:
 *           type: string
 *
 *     responses:
 *        200:
 *          description: Returns the updated field
 *          content:
 *              application/json:
 *                 schema:
 *                    type: object
 *                    $ref: '#/components/schemas/IDynamicSchemaField'
 *        404:
 *          description: Results error if schema or field id is incorrect
 *        400:
 *          description: Error, for any invalid input
 *
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET': {
      return await getSchemaAndFields(req, res);
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
