import { v4 as uuidv4 } from 'uuid';

export interface SupportTicket {
  ticketId: string;
  userId: string;
  subject: string;
  description: string;
  priority: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  userWarned?: boolean;
}

export interface TicketResponse {
  responseId: string;
  ticketId: string;
  userId: string;
  message: string;
  createdAt: Date;
}

export interface UserWarning {
  warningId: string;
  userId: string;
  ticketId: string;
  reason: string;
  createdAt: Date;
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

class SupportService {
  private static instance: SupportService;
  private constructor() {}
  static getInstance(): SupportService {
    if (!SupportService.instance) SupportService.instance = new SupportService();
    return SupportService.instance;
  }

  async createTicket(ticket: Omit<SupportTicket, 'ticketId' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
    const data = await apiFetch('/support/tickets', 'POST', ticket);
    return data.ticket?.ticketId || '';
  }

  async getTickets(filters?: Partial<SupportTicket>): Promise<SupportTicket[]> {
    const data = await apiFetch('/support/tickets');
    let tickets = data.tickets || [];
    if (filters) {
      tickets = tickets.filter((t: any) =>
        Object.entries(filters).every(([k, v]) => t[k] === v)
      );
    }
    return tickets;
  }

  async updateTicket(ticketId: string, updates: Partial<SupportTicket>): Promise<void> {
    await apiFetch(`/support/tickets/${ticketId}`, 'PATCH', updates);
  }

  async addResponse(_response: Omit<TicketResponse, 'responseId' | 'createdAt'>): Promise<void> {
    // Responses stored via support ticket update for now
  }

  async getResponses(_ticketId: string): Promise<TicketResponse[]> {
    return [];
  }

  async issueWarning(warning: Omit<UserWarning, 'createdAt'>): Promise<void> {
    await this.updateTicket(warning.ticketId, { userWarned: true });
  }

  async getUserWarnings(_userId: string): Promise<UserWarning[]> {
    return [];
  }
}

export const supportService = SupportService.getInstance();
