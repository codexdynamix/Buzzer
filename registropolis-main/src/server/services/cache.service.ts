
import { getMainRedisClient } from '../db/redis';

export class CacheService {
  private static DEFAULT_EXPIRY = 3600; // 1 hour in seconds

  /**
   * Set a value in cache
   */
  static async set(key: string, value: any, expiry: number = this.DEFAULT_EXPIRY): Promise<void> {
    const redis = getMainRedisClient();
    await redis.set(key, JSON.stringify(value), {
      EX: expiry
    });
  }

  /**
   * Get a value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    const redis = getMainRedisClient();
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Delete a value from cache
   */
  static async del(key: string): Promise<void> {
    const redis = getMainRedisClient();
    await redis.del(key);
  }

  /**
   * Clear all cache
   */
  static async clear(): Promise<void> {
    const redis = getMainRedisClient();
    await redis.flushAll();
  }
}
