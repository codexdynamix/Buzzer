
import { Document } from 'mongodb';

export interface AdminStats extends Document {
  totalUsers: number;
  totalMessages: number;
  totalGroups: number;
  lastUpdated: Date;
}

export interface AdminLog extends Document {
  action: string;
  performedBy: string;
  timestamp: Date;
  details: Record<string, any>;
}

export interface AdminAction extends Document {
  type: 'user_management' | 'content_moderation' | 'system_config';
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  performedBy: string;
  details: Record<string, any>;
}

export interface FeatureFlag extends Document {
  name: string;
  enabled: boolean;
  description: string;
  scope: 'global' | 'user';
  targetUsers?: string[]; // User IDs if scope is 'user'
  lastModified: Date;
  modifiedBy: string;
}

export interface UserActivity extends Document {
  userId: string;
  action: string;
  timestamp: Date;
  details: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

export interface UserRestriction extends Document {
  userId: string;
  type: 'ban' | 'suspend' | 'restrict';
  reason: string;
  startDate: Date;
  endDate?: Date;
  createdBy: string;
  status: 'active' | 'expired' | 'lifted';
}
