import { MongoClient } from 'mongodb';

let client;
let db;
let connectionPromise = null;

export async function connect() {
  if (db) return db;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      const uri = process.env.MONGODB_URI || 'mongodb://root:example@database:27017/eegility?authSource=admin';
      client = new MongoClient(uri, {
        connectTimeoutMS: 10000,  // Increased timeout
        serverSelectionTimeoutMS: 10000,
        retryWrites: true,
        retryReads: true
      });
      
      console.log('Attempting to connect to MongoDB...');
      await client.connect();
      db = client.db(process.env.DB_NAME || 'eegility');
      console.log('Successfully connected to MongoDB');
      return db;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      connectionPromise = null;
      throw error;
    }
  })();

  return connectionPromise;
}

export function getDB() {
  if (!db) throw new Error('Database not initialized - call connect() first');
  return db;
}

// Add a function to check connection status
export async function ensureConnected() {
  if (!db) {
    await connect();
  }
  return db;
}