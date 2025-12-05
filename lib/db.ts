// lib/db.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error("⚠️ Please define MONGODB_URI in your .env file");
}

/**
 * Maintains a cached Mongo connection across hot reloads in Next.js
 */
let cached = (global as any).mongoose || { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) {
    console.log("✅ Using existing MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("⏳ Connecting to MongoDB...");
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: "casino_game",
        bufferCommands: false,
      })
      .then((mongoose:any) => {
        console.log("🚀 MongoDB connected successfully");
        return mongoose;
      })
      .catch((err:any) => {
        console.error("❌ MongoDB connection error:", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  (global as any).mongoose = cached;

  return cached.conn;
}
