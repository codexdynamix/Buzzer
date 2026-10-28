
export interface AdminStats {
  totalUsers: number;
  totalMessages: number;
  totalGroups: number;
  lastUpdated: Date;
}

export interface AdminLog {
  action: string;
  performedBy: string;
  timestamp: Date;
  details: Record<string, unknown>;
}

export interface AdminAction {
  type: 'user_management' | 'content_moderation' | 'system_config';
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  performedBy: string;
  details: Record<string, unknown>;
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  scope: 'global' | 'user';
  targetUsers?: string[]; // User IDs if scope is 'user'
  lastModified: Date;
  modifiedBy: string;
}

export interface UserActivity {
  userId: string;
  action: string;
  timestamp: Date;
  details: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

export interface UserRestriction {
  id: string;
  userId: string;
  userName?: string;
  type: 'ban' | 'suspend' | 'restrict';
  reason: string;
  startDate: Date | string;
  endDate?: Date | string;
  createdBy: string;
  status: 'active' | 'expired' | 'lifted';
}
