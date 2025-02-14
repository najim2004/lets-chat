// lib/db.ts
import mongoose from "mongoose";

// Type definitions
type CachedConnection = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Declare global type
declare global {
  var mongoose: CachedConnection | undefined;
}

const MONGO_URI = process.env.NEXT_PUBLIC_MONGO_URI || "";


if (!MONGO_URI) {
  throw new Error("Please define the MONGO_URI environment variable");
}

// Initialize cache
const cached: CachedConnection = global.mongoose ?? {
  conn: null,
  promise: null,
};

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}

export default connectToDatabase;
