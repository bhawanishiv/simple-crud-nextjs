// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { z, ZodError } from 'zod';

import mongoClient from '@/lib/mongo';
import User from '@/models/User';

const CreateUserSchema = z.object({
  firstName: z.string().trim(),
  lastName: z.string().trim(),
  email: z.string().email().trim(),
  role: z.string().trim().optional(),
});

const UpdateUserSchema = z.object({
  uid: z.string().trim(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  email: z.string().email().trim().optional(),
  role: z.string().trim().optional(),
});

const GetUsersSchema = z.object({
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

const DeleteUserSchema = z.object({
  uid: z.string().trim(),
});

type Data = {
  message: string;
};

const getUsers = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { limit, skip, sort } = GetUsersSchema.parse(req.query);
    await mongoClient;

    const users = await User.aggregate([
      { $match: {} },
      { $limit: limit },
      { $skip: skip },
      { $sort: { firstName: 1, ...sort } },
      {
        $project: {
          uid: '$_id',
          firstName: 1,
          lastName: 1,
          email: 1,
          role: 1,
          createdAt: 1,
          updatedAt: 1,
          _id: 0,
        },
      },
    ]).exec();

    const count = await User.aggregate([
      { $match: {} },
      { $count: 'count' },
    ]).exec();

    if (!users) throw new Error("Couldn't find users");
    const response = {
      users: users,
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

const createUser = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const user = CreateUserSchema.parse(req.body);
    // type User = z.infer<typeof CreateUserSchema>;

    await mongoClient;

    const emailExists = await User.findOne({ email: user.email });

    if (emailExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const newUser = new User({ ...user });
    const createdUser = await newUser.save();

    if (!createdUser) throw new Error("Couldn't create user");
    const { _id, ...rest } = createdUser.toObject();
    return res.json({
      user: { ...rest, uid: _id.toString() },
    });
  } catch (e) {
    if (e instanceof ZodError) {
      return res.status(400).json(e.errors[0]);
    }
    return res.status(400).json({ message: (e as Error).message });
  }
};

const updateUser = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const user = UpdateUserSchema.parse(req.body);
    // type User = z.infer<typeof CreateUserSchema>;

    const { uid, ...rest } = user;

    await mongoClient;

    const emailExists = await User.findOne({ email: user.email });

    if (emailExists && emailExists._id.toString() !== uid) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      uid,
      { ...rest },
      {
        returnDocument: 'after',
      }
    ).exec();
    if (!updatedUser) throw new Error("Couldn't find or update the user");

    const { _id, ...restObj } = updatedUser.toObject();

    return res.json({ user: { ...restObj, uid } });
  } catch (e) {
    if (e instanceof ZodError) {
      return res.status(400).json(e.errors[0]);
    }
    return res.status(400).json({ message: (e as Error).message });
  }
};

const deleteUser = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const user = DeleteUserSchema.parse(req.query);

    const { uid } = user;

    await mongoClient;

    const deleted = await User.findByIdAndDelete(uid, {
      returnDocument: 'after',
    });

    if (!deleted) throw new Error("Couldn't find or delete the user");

    const { _id, ...rest } = deleted.toObject();

    return res.json({
      user: {
        ...rest,
        uid,
      },
    });
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
      return await getUsers(req, res);
    }
    case 'POST': {
      return await createUser(req, res);
    }

    case 'PATCH': {
      return await updateUser(req, res);
    }

    case 'DELETE': {
      return deleteUser(req, res);
    }
  }

  res.status(400).json({ message: 'Invalid input' });
}
