import { MongoClient } from 'mongodb';

let client;
let db;
let connectionPromise = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 5000;

export async function connect() {
  if (db) return db;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://root:example@database:27017/eegility?authSource=admin';
    
    while (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      try {
        client = new MongoClient(uri, {
          connectTimeoutMS: 10000,
          serverSelectionTimeoutMS: 10000,
          retryWrites: true,
          retryReads: true,
          maxPoolSize: 10,
          minPoolSize: 5
        });
        
        console.log(`Attempting to connect to MongoDB (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
        await client.connect();
        
        // Test the connection
        await client.db('admin').admin().ping();
        
        db = client.db(process.env.DB_NAME || 'eegility');
        console.log('Successfully connected to MongoDB');
        
        // Reset reconnect attempts on successful connection
        reconnectAttempts = 0;
        
        // Set up connection event listeners
        client.on('serverHeartbeatFailed', () => {
          console.warn('MongoDB heartbeat failed');
        });
        
        client.on('connectionClosed', () => {
          console.warn('MongoDB connection closed');
          db = null;
        });
        
        return db;
      } catch (error) {
        reconnectAttempts++;
        console.error(`MongoDB connection error (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}):`, error.message);
        
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          connectionPromise = null;
          reconnectAttempts = 0;
          throw new Error(`Failed to connect to MongoDB after ${MAX_RECONNECT_ATTEMPTS} attempts: ${error.message}`);
        }
        
        // Wait before retrying
        console.log(`Retrying connection in ${RECONNECT_INTERVAL}ms...`);
        await new Promise(resolve => setTimeout(resolve, RECONNECT_INTERVAL));
      }
    }
  })();

  return connectionPromise;
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized - call connect() first');
  }
  return db;
}

// Add a function to check connection status
export async function ensureConnected() {
  try {
    if (!db || !client) {
      return await connect();
    }
    
    // Test if the connection is still alive
    await client.db('admin').admin().ping();
    return db;
  } catch (error) {
    console.warn('Connection lost, attempting to reconnect...', error.message);
    db = null;
    connectionPromise = null;
    return await connect();
  }
}

// Graceful shutdown function
export async function disconnect() {
  try {
    if (client) {
      console.log('Closing MongoDB connection...');
      await client.close();
      client = null;
      db = null;
      connectionPromise = null;
      console.log('MongoDB connection closed successfully');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message);
  }
}