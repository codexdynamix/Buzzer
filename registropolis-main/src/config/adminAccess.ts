export const STAFF_ROLES = ['superadmin', 'operations', 'moderator', 'support'] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export type AdminPermission =
  | 'overview:read'
  | 'users:read'
  | 'users:write'
  | 'users:ban'
  | 'users:pii'
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
  operations: ['overview:read', 'users:read', 'ads:manage', 'ads:pricing', 'system:export'],
  moderator: ['overview:read', 'users:read', 'users:ban', 'listings:review', 'listings:delete', 'verification:review'],
  support: ['overview:read', 'users:read', 'support:reply', 'support:escalate'],
};

export type AdminTab =
  | 'overview'
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
  users: 'users:read',
  moderation: 'listings:review',
  merchants: 'ads:manage',
  verification: 'verification:review',
  restrictions: 'users:ban',
  support: 'support:reply',
  features: 'system:flags',
  analytics: 'system:audit_logs',
};

export function hasAdminPermission(role: StaffRole, permission: AdminPermission): boolean {
  return STAFF_ROLE_PERMISSIONS[role].includes(permission);
}

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === 'string' && STAFF_ROLES.includes(value as StaffRole);
}
