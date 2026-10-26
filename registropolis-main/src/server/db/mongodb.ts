
import { MongoClient, Db } from 'mongodb';
import config from '../config';

let db: Db | null = null;
let client: MongoClient | null = null;

export const connectToDatabase = async (): Promise<Db> => {
  if (db) return db;

  try {
    const mongoUri = process.env.MONGODB_URI || config.mongoUri;
    client = new MongoClient(mongoUri);
    await client.connect();
    
    const dbName = process.env.MONGODB_DB_NAME || config.dbName;
    db = client.db(dbName);
    
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to database');
  }
};

export const getDb = async (): Promise<Db> => {
  if (!db) {
    return connectToDatabase();
  }
  return db;
};

export const closeConnection = async (): Promise<void> => {
  if (client) {
    await client.close();
    db = null;
    client = null;
    console.log('MongoDB connection closed');
  }
};

// Export the db variable for backward compatibility
export { db };
