export interface AnalyticsData {
  date: string;
  metrics: {
    activeUsers: number;
    newUsers: number;
    messagesSent: number;
    avgResponseTime: number;
    errorRate: number;
  };
  pageViews: Record<string, number>;
  userActions: Record<string, number>;
}

export interface AnalyticsFilter {
  startDate?: Date;
  endDate?: Date;
  metrics?: string[];
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

class AdminAnalyticsService {
  private static instance: AdminAnalyticsService;
  private constructor() {}
  static getInstance(): AdminAnalyticsService {
    if (!AdminAnalyticsService.instance) AdminAnalyticsService.instance = new AdminAnalyticsService();
    return AdminAnalyticsService.instance;
  }

  async getAnalytics(_filter?: AnalyticsFilter): Promise<AnalyticsData[]> {
    try {
      const data = await apiFetch('/admin/analytics');
      return data.analytics || [];
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return [];
    }
  }

  async recordPageView(page: string): Promise<void> {
    try {
      await apiFetch('/admin/analytics/pageview', 'POST', { page });
    } catch (error) {
      console.error('Error recording page view:', error);
    }
  }

  async recordUserAction(action: string): Promise<void> {
    try {
      await apiFetch('/admin/analytics/action', 'POST', { action });
    } catch (error) {
      console.error('Error recording user action:', error);
    }
  }

  async updateDailyMetrics(_metrics: Partial<AnalyticsData['metrics']>): Promise<void> {
    // Handled server-side
  }

  async generateReport(startDate: Date, endDate: Date): Promise<any> {
    try {
      const data = await apiFetch('/admin/analytics');
      const records: AnalyticsData[] = data.analytics || [];
      const filtered = records.filter(r => {
        const d = new Date(r.date);
        return d >= startDate && d <= endDate;
      });
      return {
        period: { start: startDate, end: endDate },
        totalActiveUsers: filtered.reduce((s, r) => s + r.metrics.activeUsers, 0),
        totalNewUsers: filtered.reduce((s, r) => s + r.metrics.newUsers, 0),
        totalMessagesSent: filtered.reduce((s, r) => s + r.metrics.messagesSent, 0),
        avgResponseTime: filtered.length ? filtered.reduce((s, r) => s + r.metrics.avgResponseTime, 0) / filtered.length : 0,
        topPages: filtered.reduce((acc, r) => { Object.entries(r.pageViews || {}).forEach(([p, c]) => { acc[p] = (acc[p] || 0) + c; }); return acc; }, {} as Record<string, number>),
        topActions: filtered.reduce((acc, r) => { Object.entries(r.userActions || {}).forEach(([a, c]) => { acc[a] = (acc[a] || 0) + c; }); return acc; }, {} as Record<string, number>),
      };
    } catch (error) {
      throw new Error('Failed to generate analytics report');
    }
  }
}

export const adminAnalyticsService = AdminAnalyticsService.getInstance();
