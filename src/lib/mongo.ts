import { connect, Mongoose } from 'mongoose';

const uri = process.env.MONGODB_URI || '';

if (!uri) {
  throw new Error('Add Mongo URI to .env.local');
}

let cachedDb: Mongoose;

export const connectToDatabase = async () => {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const db = await connect(uri, {});
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};
