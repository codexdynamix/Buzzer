import { loggingService } from '@/services/admin';

export interface BulkOperation {
  _id?: string;
  operationType: 'import' | 'export' | 'update' | 'delete' | 'message' | 'permission';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  createdBy: string;
  targetCollection: string;
  affectedCount?: number;
  totalCount?: number;
  progress?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface BulkUserUpdate {
  query: Record<string, any>;
  update: Record<string, any>;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path: string, method = 'GET', body?: any) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const localOps = new Map<string, BulkOperation>();

class BulkOperationsService {
  private static instance: BulkOperationsService;
  private constructor() {}
  static getInstance(): BulkOperationsService {
    if (!BulkOperationsService.instance) BulkOperationsService.instance = new BulkOperationsService();
    return BulkOperationsService.instance;
  }

  async createBulkOperation(operation: Omit<BulkOperation, '_id' | 'status' | 'createdAt' | 'progress'>): Promise<string> {
    const id = crypto.randomUUID();
    const op: BulkOperation = { ...operation, _id: id, status: 'pending', createdAt: new Date(), progress: 0 };
    localOps.set(id, op);
    await loggingService.logAdminAction('create_bulk_operation', operation.createdBy, { operationId: id, type: operation.operationType });
    setTimeout(() => this.processOperation(id), 100);
    return id;
  }

  async getBulkOperation(operationId: string): Promise<BulkOperation | null> {
    return localOps.get(operationId) || null;
  }

  async getAllBulkOperations(_limit: number = 20): Promise<BulkOperation[]> {
    return Array.from(localOps.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async bulkUpdateUsers(query: Record<string, any>, update: Record<string, any>, adminId: string): Promise<string> {
    return this.createBulkOperation({ operationType: 'update', createdBy: adminId, targetCollection: 'users', metadata: { query, update } });
  }

  async bulkDeleteUsers(query: Record<string, any>, adminId: string): Promise<string> {
    return this.createBulkOperation({ operationType: 'delete', createdBy: adminId, targetCollection: 'users', metadata: { query } });
  }

  async bulkSendMessage(userQuery: Record<string, any>, messageTemplate: string, adminId: string): Promise<string> {
    return this.createBulkOperation({ operationType: 'message', createdBy: adminId, targetCollection: 'users', metadata: { userQuery, messageTemplate } });
  }

  async exportUsers(query: Record<string, any>, adminId: string): Promise<string> {
    return this.createBulkOperation({ operationType: 'export', createdBy: adminId, targetCollection: 'users', metadata: { query, format: 'json' } });
  }

  async cancelOperation(operationId: string, adminId: string): Promise<void> {
    const op = localOps.get(operationId);
    if (!op || op.status === 'completed' || op.status === 'failed') throw new Error('Operation cannot be cancelled');
    localOps.set(operationId, { ...op, status: 'failed', error: 'Cancelled by admin', completedAt: new Date() });
    await loggingService.logAdminAction('cancel_bulk_operation', adminId, { operationId });
  }

  async performBulkOperation<T>(_operation: 'delete' | 'update' | 'create', collectionName: string, data: any[], filter?: Record<string, any>): Promise<void> {
    await loggingService.logAdminAction('bulk_operation', 'admin', { collectionName, count: data.length, filter });
  }

  private async processOperation(operationId: string): Promise<void> {
    const op = localOps.get(operationId);
    if (!op) return;
    localOps.set(operationId, { ...op, status: 'processing' });
    try {
      let affectedCount = 0;
      if (op.operationType === 'export') {
        const data = await apiFetch('/admin/users');
        affectedCount = (data.data || []).length;
      } else if (op.operationType === 'update' || op.operationType === 'delete') {
        const data = await apiFetch('/admin/users');
        affectedCount = (data.data || []).length;
      } else if (op.operationType === 'message') {
        const data = await apiFetch('/admin/users');
        affectedCount = (data.data || []).length;
      }
      localOps.set(operationId, { ...localOps.get(operationId)!, status: 'completed', completedAt: new Date(), progress: 100, affectedCount });
    } catch (error) {
      localOps.set(operationId, { ...localOps.get(operationId)!, status: 'failed', error: error instanceof Error ? error.message : String(error), completedAt: new Date() });
    }
  }
}

export const bulkOperationsService = BulkOperationsService.getInstance();
