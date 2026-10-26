import { MongoClient, Db, Collection, MongoClientOptions } from 'mongodb';
import { UserDocument, MessageDocument, GroupDocument } from '@/types/databaseTypes';

class DatabaseService {
  private static instance: DatabaseService;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnecting: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Connect to MongoDB with optimized connection pooling
   */
  async connect(uri: string): Promise<void> {
    // If already connecting, return the existing promise
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    // If already connected, return immediately
    if (this.client && this.db) {
      return;
    }

    try {
      this.isConnecting = true;
      
      // Heroku-optimized connection options
      const options: MongoClientOptions = {
        maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10'),
        minPoolSize: 0,  // Allow scaling down to zero on Heroku
        maxIdleTimeMS: 30000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000, // Fast fail for Heroku restarts
        retryWrites: true
      };
      
      this.connectionPromise = new Promise<void>(async (resolve, reject) => {
        try {
          this.client = new MongoClient(uri, options);
          await this.client.connect();
          this.db = this.client.db();
          
          // Add Heroku-specific error handling
          this.client.on('error', (error) => {
            console.error('MongoDB connection error event:', error);
            // Attempt reconnection if running on Heroku
            if (process.env.DYNO) {
              this.reconnect();
            }
          });
          
          this.client.on('timeout', () => {
            console.warn('MongoDB connection timeout event');
          });
          
          console.log('Connected to MongoDB successfully');
          resolve();
        } catch (error) {
          this.client = null;
          this.db = null;
          console.error('MongoDB connection error in promise:', error);
          reject(error);
        } finally {
          this.isConnecting = false;
          this.connectionPromise = null;
        }
      });
      
      return this.connectionPromise;
    } catch (error) {
      this.isConnecting = false;
      this.connectionPromise = null;
      console.error('MongoDB connection error:', error);
      throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gracefully disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close(true); // Force close
        this.client = null;
        this.db = null;
        console.log('Disconnected from MongoDB');
      } catch (error) {
        console.error('Error during MongoDB disconnection:', error);
        throw new Error(`Failed to disconnect: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Get a collection with type safety
   */
  private getCollection<T>(name: string): Collection<T> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() before accessing collections.');
    }
    return this.db.collection<T>(name);
  }

  /**
   * Run a database command to test connection
   */
  async runCommand(command: any): Promise<any> {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.command(command);
  }

  // Type-safe collection getters
  users() {
    return this.getCollection<UserDocument>('users');
  }

  messages() {
    return this.getCollection<MessageDocument>('messages');
  }

  groups() {
    return this.getCollection<GroupDocument>('groups');
  }

  // Add reconnection method for Heroku
  private async reconnect() {
    console.log('Attempting to reconnect to MongoDB...');
    try {
      await this.connect(process.env.MONGODB_URI || '');
    } catch (error) {
      console.error('Reconnection failed:', error);
    }
  }
}

export const db = DatabaseService.getInstance();
