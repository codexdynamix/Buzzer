
import jwt from 'jsonwebtoken';
import { getDb } from '../db/mongodb';
import { ObjectId } from 'mongodb';
import config from '../config';
import { Request, Response, NextFunction } from 'express';

// Add user interface to extend Express Request
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    phoneNumber?: string;
    name?: string;
    id?: string;
  };
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; id?: string };
    
    // Handle both formats (userId and id)
    const userIdFromToken = decoded.userId || decoded.id;
    
    if (!userIdFromToken) {
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    // Get user from database
    const db = await getDb();
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(userIdFromToken) 
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Add user to request object with consistent format
    const authReq = req as AuthenticatedRequest;
    authReq.user = { 
      userId: user._id.toString(),
      id: user._id.toString(), // For backward compatibility
      phoneNumber: user.phoneNumber,
      name: user.name
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Alias for backward compatibility
export const auth = authMiddleware;

export default authMiddleware;
