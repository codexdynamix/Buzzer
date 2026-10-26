
import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../services/cache.service';

/**
 * Cache middleware for Express routes
 * @param duration Cache duration in seconds (default: 1 hour)
 */
export const cacheMiddleware = (duration: number = 3600) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      // Try to get cached response
      const cachedResponse = await CacheService.get(key);
      
      if (cachedResponse) {
        return res.json(cachedResponse);
      }

      // Store original res.json to intercept the response
      const originalJson = res.json.bind(res);
      res.json = ((data: any) => {
        // Cache the response before sending
        CacheService.set(key, data, duration).catch(console.error);
        return originalJson(data);
      }) as any;

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

