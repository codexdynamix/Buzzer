import { db } from '@/services/databaseService';
import { Collection, Document } from 'mongodb';

// Use environment variables - no hardcoded credentials
const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || '';
const port = process.env.PORT || 5000;

// Connection state tracking
let isConnected = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;
const RETRY_INTERVAL_MS = 3000;

/**
 * Connects to MongoDB with retry mechanism and improved error handling
 */
export async function connectToDatabase() {
  try {
    if (!isConnected) {
      if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
        throw new Error(`Failed to connect after ${MAX_CONNECTION_ATTEMPTS} attempts`);
      }
      
      connectionAttempts++;
      console.log(`Connection attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}`);
      
      await db.connect(uri);
      isConnected = true;
      connectionAttempts = 0; // Reset counter on successful connection
      console.log("Successfully connected to MongoDB");
    }
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    
    // Implement exponential backoff for retries
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      console.log(`Retrying in ${RETRY_INTERVAL_MS / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MS));
      return connectToDatabase(); // Retry recursively
    }
    
    throw new Error(`MongoDB connection failed after ${MAX_CONNECTION_ATTEMPTS} attempts: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Connection pooling with caching
let cachedDb: any = null;
let lastConnectionTime: number = 0;
const CONNECTION_TTL = 60000; // 1 minute TTL for cached connection

/**
 * Gets database connection with connection pooling
 */
export async function getDatabase() {
  const now = Date.now();
  
  // Check if connection is stale or doesn't exist
  if (!cachedDb || now - lastConnectionTime > CONNECTION_TTL) {
    try {
      await connectToDatabase();
      cachedDb = db;
      lastConnectionTime = now;
    } catch (error) {
      console.error("Failed to get database connection:", error);
      throw error;
    }
  }
  
  return cachedDb;
}

/**
 * Tests database connection with detailed diagnostics
 */
export async function testConnection() {
  try {
    const database = await connectToDatabase();
    
    // Perform a simple command to verify connection
    const result = await database.runCommand({ ping: 1 });
    
    if (result && result.ok === 1) {
      console.log("MongoDB connection test successful!");
      return true;
    } else {
      console.warn("MongoDB connection test returned unexpected result:", result);
      return false;
    }
  } catch (error) {
    console.error("MongoDB connection test failed with error:", error);
    return false;
  }
}

/**
 * Gets a typed collection with error handling
 */
export async function getCollection<T extends Document>(name: string): Promise<Collection<T>> {
  try {
    const database = await getDatabase();
    return database.collection(name) as Collection<T>;
  } catch (error) {
    console.error(`Failed to get collection ${name}:`, error);
    throw new Error(`Could not access collection ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Export for type safety
export type { Collection, Document };
