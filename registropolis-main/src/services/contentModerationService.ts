import { loggingService } from '@/services/admin';

export interface ContentItem {
  _id: string;
  type: 'message' | 'post' | 'comment' | 'profile' | 'image';
  content: string;
  userId: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  moderatedBy?: string;
  moderatedAt?: Date;
  flags?: string[];
  reason?: string;
}

export interface ModerationRule {
  type: 'keyword' | 'regex';
  pattern: string;
  action: 'flag' | 'reject' | 'notify';
  enabled: boolean;
  severity: 'low' | 'medium' | 'high';
  createdBy: string;
  createdAt: Date;
  scope: 'global' | 'message' | 'profile' | 'post';
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

class ContentModerationService {
  private static instance: ContentModerationService;
  private blocklistPatterns: RegExp[] = [];
  private moderationRules: ModerationRule[] = [];
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): ContentModerationService {
    if (!ContentModerationService.instance) ContentModerationService.instance = new ContentModerationService();
    return ContentModerationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      await this.loadModerationRules();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize content moderation service:', error);
    }
  }

  async loadModerationRules(): Promise<void> {
    try {
      const data = await apiFetch('/admin/features');
      this.moderationRules = (data.features || []).filter((f: any) => f.name?.startsWith('mod_'));
      this.blocklistPatterns = [];
    } catch (error) {
      this.moderationRules = [];
      this.blocklistPatterns = [];
    }
  }

  async submitContentForModeration(
    content: Omit<ContentItem, '_id' | 'status' | 'moderatedBy' | 'moderatedAt'>
  ): Promise<{ id: string; status: ContentItem['status']; flags?: string[] }> {
    const moderationResult = this.checkContentLocally(content.content);
    const status: ContentItem['status'] = moderationResult.flags.length > 0
      ? (moderationResult.action === 'reject' ? 'rejected' : 'pending')
      : 'approved';

    await loggingService.logAdminAction('content_moderation', 'system', {
      contentType: content.type,
      userId: content.userId,
      status,
      flags: moderationResult.flags,
    });

    return { id: crypto.randomUUID(), status, flags: moderationResult.flags };
  }

  async moderateContent(contentId: string, decision: 'approved' | 'rejected', moderatorId: string, reason?: string): Promise<void> {
    await loggingService.logAdminAction('content_moderation_decision', moderatorId, { contentId, decision, reason });
  }

  async getPendingContent(_limit: number = 20, _contentType?: ContentItem['type']): Promise<ContentItem[]> {
    return [];
  }

  async addModerationRule(rule: Omit<ModerationRule, 'createdAt'>): Promise<string> {
    await loggingService.logAdminAction('add_moderation_rule', rule.createdBy, { pattern: rule.pattern, action: rule.action });
    return crypto.randomUUID();
  }

  async toggleModerationRule(ruleId: string, enabled: boolean, adminId: string): Promise<void> {
    await loggingService.logAdminAction('toggle_moderation_rule', adminId, { ruleId, enabled });
  }

  async getContentModerationStats(): Promise<any> {
    return {
      totalContent: 0,
      statusBreakdown: { approved: 0, rejected: 0, pending: 0 },
      typeBreakdown: { message: 0, post: 0, comment: 0, profile: 0, image: 0 },
    };
  }

  async flagContent(contentId: string, contentType: string, reason: string, reportedBy: string): Promise<void> {
    await loggingService.logAdminAction('flag_content', reportedBy, { contentId, contentType, reason });
  }

  private checkContentLocally(content: string): { flags: string[]; action: 'flag' | 'reject' | 'approve' } {
    const flags: string[] = [];
    let highestSeverity: 'low' | 'medium' | 'high' = 'low';

    for (const rule of this.moderationRules) {
      if (!(rule as any).enabled) continue;
      try {
        const pattern = (rule as any).type === 'regex'
          ? new RegExp((rule as any).pattern, 'i')
          : new RegExp(`\\b${(rule as any).pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (pattern.test(content)) {
          flags.push((rule as any).pattern);
          if ((rule as any).severity === 'high' || ((rule as any).severity === 'medium' && highestSeverity === 'low')) {
            highestSeverity = (rule as any).severity;
          }
        }
      } catch { /* skip invalid patterns */ }
    }

    const action = flags.length > 0 ? (highestSeverity === 'high' ? 'reject' : 'flag') : 'approve';
    return { flags, action };
  }
}

export const contentModerationService = ContentModerationService.getInstance();
