export const STAFF_ROLES = [
  'superadmin',
  'operations',
  'department_lead',
  'verification',
  'moderator',
  'support',
  'account_exec',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_DEPARTMENTS = [
  'general',
  'real-estate',
  'transport',
  'marketplace',
  'jobs',
  'services',
  'commercial',
] as const;

export type StaffDepartment = (typeof STAFF_DEPARTMENTS)[number];

export const DEPARTMENT_LABELS: Record<StaffDepartment, string> = {
  general: 'General Operations',
  'real-estate': 'Real Estate & Properties',
  transport: 'Motors & Transport',
  marketplace: 'Marketplace & Retail',
  jobs: 'Careers & Recruitment',
  services: 'Professional Services',
  commercial: 'Corporate Advertising & VIPs',
};

export type AdminPermission =
  | 'overview:read'
  | 'users:read'
  | 'users:write'
  | 'users:ban'
  | 'users:pii'
  | 'clients:read'
  | 'clients:write'
  | 'clients:assign'
  | 'clients:tier'
  | 'agents:read'
  | 'agents:create'
  | 'agents:manage'
  | 'agents:credentials'
  | 'listings:review'
  | 'listings:delete'
  | 'verification:review'
  | 'ads:manage'
  | 'ads:pricing'
  | 'support:reply'
  | 'support:escalate'
  | 'system:flags'
  | 'system:audit_logs'
  | 'system:export'
  | 'messaging:audit';

export const STAFF_ROLE_PERMISSIONS: Record<StaffRole, readonly AdminPermission[]> = {
  superadmin: [
    'overview:read',
    'users:read',
    'users:write',
    'users:ban',
    'users:pii',
    'clients:read',
    'clients:write',
    'clients:assign',
    'clients:tier',
    'agents:read',
    'agents:create',
    'agents:manage',
    'agents:credentials',
    'listings:review',
    'listings:delete',
    'verification:review',
    'ads:manage',
    'ads:pricing',
    'support:reply',
    'support:escalate',
    'system:flags',
    'system:audit_logs',
    'system:export',
    'messaging:audit',
  ],
  operations: [
    'overview:read',
    'users:read',
    'users:write',
    'users:pii',
    'clients:read',
    'clients:write',
    'clients:assign',
    'clients:tier',
    'agents:read',
    'agents:create',
    'agents:manage',
    'agents:credentials',
    'ads:manage',
    'ads:pricing',
    'listings:review',
    'listings:delete',
    'verification:review',
    'system:export',
    'system:audit_logs',
  ],
  department_lead: [
    'overview:read',
    'users:read',
    'users:write',
    'clients:read',
    'clients:write',
    'clients:assign',
    'clients:tier',
    'agents:read',
    'agents:create',
    'agents:manage',
    'listings:review',
    'ads:manage',
    'verification:review',
  ],
  verification: [
    'overview:read',
    'users:read',
    'clients:read',
    'clients:write',
    'clients:tier',
    'verification:review',
  ],
  moderator: [
    'overview:read',
    'users:read',
    'users:ban',
    'clients:read',
    'listings:review',
    'listings:delete',
    'verification:review',
  ],
  support: [
    'overview:read',
    'users:read',
    'clients:read',
    'clients:write',
    'support:reply',
    'support:escalate',
  ],
  account_exec: [
    'overview:read',
    'users:read',
    'clients:read',
    'clients:write',
    'clients:tier',
    'ads:manage',
  ],
};

export type AdminTab =
  | 'overview'
  | 'clients'
  | 'agents'
  | 'users'
  | 'moderation'
  | 'merchants'
  | 'verification'
  | 'restrictions'
  | 'support'
  | 'features'
  | 'analytics';

export const ADMIN_TAB_PERMISSIONS: Record<AdminTab, AdminPermission> = {
  overview: 'overview:read',
  clients: 'clients:read',
  agents: 'agents:read',
  users: 'users:read',
  moderation: 'listings:review',
  merchants: 'ads:manage',
  verification: 'verification:review',
  restrictions: 'users:ban',
  support: 'support:reply',
  features: 'system:flags',
  analytics: 'system:audit_logs',
};

export const ROLE_DEFINITIONS: Record<
  StaffRole,
  {
    title: string;
    badge: string;
    description: string;
    badgeColor: string;
    canDelegateCreation: boolean;
  }
> = {
  superadmin: {
    title: 'Platform Director & Owner',
    badge: 'Super Admin',
    description: 'Master authority across all system sectors, financial policies, security, and staff delegation.',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    canDelegateCreation: true,
  },
  operations: {
    title: 'Head of Operations & Regional CRM',
    badge: 'Ops Director',
    description: 'Manages departmental heads, cross-vertical workflows, and provisions new sector agents.',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    canDelegateCreation: true,
  },
  department_lead: {
    title: 'Category Desk Lead',
    badge: 'Desk Lead',
    description: 'Oversees sector inventory (Real Estate, Auto, Marketplace), client queues, and sector agents.',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    canDelegateCreation: true,
  },
  verification: {
    title: 'KYB Verification Specialist',
    badge: 'KYB Agent',
    description: 'Audits business trade licenses, company registries, and grants pro merchant badges.',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    canDelegateCreation: false,
  },
  moderator: {
    title: 'Trust & Safety Moderator',
    badge: 'Moderator',
    description: 'Monitors catalog compliance, prevents fraudulent listings, and handles user restrictions.',
    badgeColor: 'bg-red-100 text-red-900 border-red-300',
    canDelegateCreation: false,
  },
  support: {
    title: 'Customer Care & Dispute Specialist',
    badge: 'Support Agent',
    description: 'Manages incoming client tickets, transaction disputes, and seller-buyer mediation.',
    badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    canDelegateCreation: false,
  },
  account_exec: {
    title: 'Commercial Account Executive',
    badge: 'Account Exec',
    description: 'Dedicated key account manager for VIP enterprise merchants and corporate advertisers.',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    canDelegateCreation: false,
  },
};

export function hasAdminPermission(role: StaffRole, permission: AdminPermission): boolean {
  return STAFF_ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === 'string' && STAFF_ROLES.includes(value as StaffRole);
}
