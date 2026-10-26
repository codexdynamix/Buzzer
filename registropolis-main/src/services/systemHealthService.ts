export interface SystemHealth {
  timestamp: Date;
  status: 'healthy' | 'degraded' | 'down';
  services: {
    database: { status: 'online' | 'degraded' | 'offline'; responseTime: number; connectionCount: number };
    api: { status: 'online' | 'degraded' | 'offline'; responseTime: number; errorRate: number };
    fileStorage: { status: 'online' | 'degraded' | 'offline'; usedSpace: number; totalSpace: number };
  };
  performance: { cpuUsage: number; memoryUsage: number; activeUsers: number; requestsPerMinute: number };
  lastIncident?: { timestamp: Date; description: string; resolvedAt?: Date };
}

export interface PerformanceMetrics {
  timestamp: Date;
  pageLoadTime: number;
  apiResponseTime: number;
  errorCount: number;
  userCount: number;
}

class SystemHealthService {
  private static instance: SystemHealthService;
  private intervalId: number | null = null;
  private perfHistory: PerformanceMetrics[] = [];

  private constructor() {}

  static getInstance(): SystemHealthService {
    if (!SystemHealthService.instance) SystemHealthService.instance = new SystemHealthService();
    return SystemHealthService.instance;
  }

  async startMonitoring(intervalMs: number = 60000): Promise<void> {
    if (this.intervalId !== null) return;
    this.intervalId = window.setInterval(() => this.recordHealthSnapshot(), intervalMs);
    await this.recordHealthSnapshot();
  }

  stopMonitoring(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const start = Date.now();
    try {
      const res = await fetch('/health');
      const elapsed = Date.now() - start;
      const data = await res.json();
      const dbStatus = data.database === 'connected' ? 'online' : 'offline';
      return {
        timestamp: new Date(),
        status: dbStatus === 'online' ? 'healthy' : 'degraded',
        services: {
          database: { status: dbStatus, responseTime: elapsed, connectionCount: 1 },
          api: { status: 'online', responseTime: elapsed, errorRate: 0 },
          fileStorage: { status: 'online', usedSpace: 0, totalSpace: 5368709120 },
        },
        performance: { cpuUsage: 0, memoryUsage: 0, activeUsers: 0, requestsPerMinute: 0 },
      };
    } catch {
      return {
        timestamp: new Date(),
        status: 'down',
        services: {
          database: { status: 'offline', responseTime: 0, connectionCount: 0 },
          api: { status: 'offline', responseTime: 0, errorRate: 100 },
          fileStorage: { status: 'offline', usedSpace: 0, totalSpace: 0 },
        },
        performance: { cpuUsage: 0, memoryUsage: 0, activeUsers: 0, requestsPerMinute: 0 },
      };
    }
  }

  async recordHealthSnapshot(): Promise<void> {
    try {
      await this.getSystemHealth();
    } catch { /* silent */ }
  }

  async recordPerformanceMetrics(metrics: Omit<PerformanceMetrics, 'timestamp'>): Promise<void> {
    this.perfHistory.push({ ...metrics, timestamp: new Date() });
    if (this.perfHistory.length > 1440) this.perfHistory.shift();
  }

  async getPerformanceHistory(hours: number = 24): Promise<PerformanceMetrics[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.perfHistory.filter(m => m.timestamp >= cutoff);
  }

  async getIncidents(_limit: number = 10): Promise<SystemHealth[]> {
    return [];
  }

  async resolveIncident(_incidentId: string, _resolution: string): Promise<void> {
    // No-op — incidents tracked server-side
  }
}

export const systemHealthService = SystemHealthService.getInstance();
