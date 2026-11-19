import mongoose from 'mongoose';

export let isConnectedToMongo = false;

/**
 * Connect to MongoDB with graceful zero-dependency fallback for offline/local dev
 */
export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-chat-assistant';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnectedToMongo = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    isConnectedToMongo = false;
    console.warn(`[MongoDB] Primary database connection failed (${uri}): ${err.message}`);
    console.log('[MongoDB] Running in zero-config In-Memory Store mode for development.');
    console.log('[MongoDB] (To connect to a live MongoDB, set a valid MONGO_URI in server/.env)');
    return null;
  }
}
