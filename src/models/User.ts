import { models, Schema, Model, model } from 'mongoose';

import { IUser } from '@/interfaces/User';

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      default: 'USER',
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
  }
);

export default (models['User'] as Model<IUser>) ||
  model<IUser>('User', userSchema);
