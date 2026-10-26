
export interface SupportTicket {
  ticketId: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'technical' | 'billing' | 'report' | 'complaint';
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  resolution?: string;
  userWarned?: boolean;
}

export interface TicketResponse {
  ticketId: string;
  responseId: string;
  responderId: string;
  message: string;
  createdAt: Date;
  isAdminResponse: boolean;
}

export interface UserWarning {
  userId: string;
  ticketId: string;
  reason: string;
  warningLevel: 'low' | 'medium' | 'high';
  createdAt: Date;
  expiresAt?: Date;
  acknowledgedAt?: Date;
}
