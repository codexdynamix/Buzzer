import type { StaffDepartment, StaffRole } from '@/config/adminAccess';
export type { StaffDepartment, StaffRole };

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
  targetUsers?: string[];
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

// ── Enterprise Multi-Tier CRM & Agent Types ─────────────────────

export type ClientTier = 'vip' | 'pro' | 'power' | 'standard' | 'high_risk';

export interface CrmStaffNote {
  id: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  text?: string;
  content?: string;
  timestamp?: string;
  createdAt?: string;
  urgency?: 'routine' | 'warning' | 'critical' | 'normal' | 'urgent' | 'internal';
}

export interface ClientProfile {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  contactPhone?: string;
  businessName?: string;
  taxOrRegNumber?: string;
  role: 'user' | 'admin';
  clientTier: ClientTier;
  assignedSector: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  profileImageUrl?: string;
  location?: string;
  bio?: string;
  riskScore: number;
  lifetimeSpend: number;
  totalListings: number;
  activeAds: number;
  verified: boolean;
  verifiedLevel: number;
  status: 'active' | 'suspended' | 'under_review';
  createdAt: string;
  crmNotes?: CrmStaffNote[];
}

export interface AgentRecord {
  id: string;
  name: string;
  email: string;
  contactPhone?: string;
  role: 'admin';
  staffRole: StaffRole;
  staffTitle: string;
  department: StaffDepartment;
  assignedSupervisorId?: string;
  assignedSupervisorName?: string;
  maxClientQuota: number;
  assignedClientCount: number;
  agentStatus: 'active' | 'away' | 'suspended';
  profileImageUrl?: string;
  createdAt: string;
  lastActive?: string;
  temporaryPassword?: string;
  forcePasswordReset?: boolean;
}

export interface SectorPerformance {
  id: string;
  name: string;
  clientCount: number;
  activeListings: number;
  activeAgents: number;
  backlogCount: number;
  growthRate: string;
}

export interface ExecutiveOverviewData {
  kpis: {
    totalClients: number;
    activeListings: number;
    proMerchants: number;
    vipClients: number;
    unassignedQueue: number;
    pendingVerification: number;
    openTickets: number;
    highRiskAlerts: number;
    avgResponseMinutes: number;
    monthlyGmvEstimate: string;
  };
  sectors: Record<string, SectorPerformance>;
  agentCaseload: Array<{
    agentId: string;
    name: string;
    role: StaffRole;
    department: StaffDepartment;
    assignedCount: number;
    quota: number;
    status: 'active' | 'away' | 'suspended';
  }>;
  recentCriticalAlerts: Array<{
    id: string;
    type: 'risk' | 'ticket' | 'verification';
    title: string;
    clientName: string;
    clientId: string;
    severity: 'critical' | 'high' | 'medium';
    timestamp: string;
  }>;
}
