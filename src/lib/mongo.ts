import { connect, Mongoose } from 'mongoose';

const uri = process.env.MONGODB_URI || '';

let clientPromise: Promise<Mongoose>;

if (!process.env.MONGODB_URI) {
  throw new Error('Add Mongo URI to .env.local');
}
if (process.env.NODE_ENV === 'development') {
  if (!(global as any)._mongoClientPromise) {
    (global as any)._mongoClientPromise = connect(uri);
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  clientPromise = connect(uri);
}

export default clientPromise;
