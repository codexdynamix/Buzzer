
import { createClient } from 'redis';
import config from '../config';

// Create a proper Redis client and export it
let redisClient = null;
let pubClient = null;
let subClient = null;

/**
 * Connect to Redis server
 */
export const connectToRedis = async () => {
  if (!config.redisUrl) {
    console.log('Redis URL not provided, skipping Redis connection');
    return;
  }

  try {
    redisClient = createClient({ url: config.redisUrl });
    pubClient = redisClient.duplicate();
    subClient = pubClient.duplicate();

    await redisClient.connect();
    await pubClient.connect();
    await subClient.connect();

    console.log('Connected to Redis');
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
};

/**
 * Get Redis clients for Socket.IO adapter
 */
export const getRedisClient = async () => {
  if (!pubClient || !subClient) {
    if (!redisClient) {
      await connectToRedis();
    }
    
    if (!pubClient) {
      pubClient = redisClient.duplicate();
      await pubClient.connect();
    }
    
    if (!subClient) {
      subClient = redisClient.duplicate();
      await subClient.connect();
    }
  }
  
  return { pubClient, subClient };
};

/**
 * Get main Redis client
 */
export const getMainRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

/**
 * Close Redis connection
 */
export const closeRedisConnection = async () => {
  try {
    if (redisClient) {
      await redisClient.disconnect();
    }
    if (pubClient) {
      await pubClient.disconnect();
    }
    if (subClient) {
      await subClient.disconnect();
    }
    console.log('Redis connections closed');
  } catch (error) {
    console.error('Error closing Redis connections:', error);
  }
};

// Export the Redis client
export { redisClient };
