// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import _ from 'lodash';
import { z, ZodError } from 'zod';

import mongoClient from '@/lib/mongo';
import DynamicSchemaField from '@/models/DynamicSchemaField';
import { FieldTypeEnum, RelatedTypeEnum } from '@/interfaces/DynamicSchema';
import DynamicSchema from '@/models/DynamicSchema';

const CreateDynamicSchemaAndFieldsSchema = z.object({
  schema: z.object({
    title: z.string().trim(),
    name: z
      .string()
      .trim()
      .transform((v) => _.capitalize(_.camelCase(v))),
  }),
  fields: z.array(
    z.object({
      title: z.string().trim(),
      name: z.string().trim().optional().transform(_.camelCase),
      type: FieldTypeEnum,
      unique: z.boolean().optional(),
      required: z.boolean().optional(),
      relatedSchema: z.string().optional(),
      relationType: RelatedTypeEnum.optional(),
      options: z.array(z.string().trim()).optional(),
      default: z
        .union([
          z.string().trim(),
          z.null(),
          z.boolean(),
          z.number(),
          z.array(z.string().trim()),
        ])
        .optional(),
    })
  ),
});

const ListOptionsSchema = z.array(z.string()).min(1);

type Data = {
  message: string;
};

const createSchemaAndFields = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const { schema, fields } = CreateDynamicSchemaAndFieldsSchema.parse(
      req.body
    );

    await mongoClient;

    const schemaRes = await DynamicSchema.findOneAndUpdate(
      {
        name: schema.name,
      },
      schema,
      { upsert: true, returnDocument: 'after' }
    );

    console.log(`schemaRes->`, schemaRes);

    if (!schemaRes) {
      return res
        .status(500)
        .json({ message: `Couldn't create or find the schema` });
    }

    const fieldNameExists = await DynamicSchemaField.find({
      name: {
        $in: fields.map((field) => field.name),
      },
      schema: schemaRes._id.toString(),
    }).exec();

    if (fieldNameExists.length) {
      return res
        .status(400)
        .json({ message: 'Field name already exists', data: fieldNameExists });
    }

    const formattedFields = fields.map((field) => {
      return {
        ...field,
        name: field.name || _.camelCase(field.title),
        required: Boolean(field.required),
        unique: Boolean(field.unique),
        schema: schemaRes._id,
        options:
          field.type === 'list'
            ? ListOptionsSchema.parse(field.options)
            : undefined,
      };
    });

    const newFields = await DynamicSchemaField.insertMany(formattedFields, {
      // ordered: false,
    });

    if (!newFields) throw new Error("Couldn't create fields");
    return res.json({
      schema: schemaRes,
      fields: newFields.map((field) => ({
        ...field.toJSON(),
        id: field._id.toString(),
      })),
    });
  } catch (e) {
    console.log(`e->`, e);
    if (e instanceof ZodError) {
      return res.status(400).json(e.errors[0]);
    }
    return res.status(400).json({ message: (e as Error).message });
  }
};

/**
 *
 * @swagger
 * /api/schemas/playground:
 *   post:
 *     tags: [Dynamic schema playground]
 *     description: Create / Update a dynamic schema with new fields
 *
 *     responses:
 *        200:
 *          description: Returns the created/updated schema with new fields
 *          content:
 *              application/json:
 *                  schema:
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
 *        404:
 *          description: Results error if schema id is incorrect
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
      return await createSchemaAndFields(req, res);
    }
  }

  res.status(400).json({ message: 'Invalid input' });
}
