import { toast } from 'sonner';

type ApiSuccessResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  agents?: any[];
  clients?: any[];
  client?: any;
  note?: any;
  total?: number;
  totalPages?: number;
  page?: number;
  limit?: number;
  temporaryPassword?: string;
  transferredCount?: number;
  count?: number;
  businesses?: T;
  advertisements?: T;
  kpis?: any;
  results?: Array<{ type: string; id: string; label: string; detail?: string; href: string }>;
  items?: unknown;
  merchants?: unknown;
  requests?: unknown;
  modifiedCount?: number;
  modifiedIds?: string[];
  failedIds?: string[];
  isSponsored?: boolean;
  account?: { id: string; name: string; email?: string; role: string; createdAt: string };
  timeline?: Array<{ id: string; type: string; timestamp: string; summary: string; status: string }>;
  user?: any;
  token?: string;
  messages?: any[];
  groups?: any[];
  stories?: any[];
  application?: any;
  applications?: any[];
  stats?: any;
  [key: string]: any;
};

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  data?: any,
  requiresAuth: boolean = true,
  signal?: AbortSignal
): Promise<ApiSuccessResponse<any>> => {
  if (requiresAuth && !localStorage.getItem('auth_token')) {
    throw new Error('Authentication required');
  }
  try {
    const response = await fetch(`/api${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: data !== undefined ? JSON.stringify(data) : undefined,
      signal,
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || `HTTP ${response.status}`);
    return json;
  } catch (error) {
    if (error instanceof Error && error.message !== 'Authentication required') {
      toast.error(error.message);
    }
    throw error;
  }
};

export const authAPI = {
  getCurrentUser: () => apiRequest('/auth/me'),
  refreshToken: () => apiRequest('/auth/refresh-token', 'POST'),
  logout: () => apiRequest('/auth/logout', 'POST'),
  addAdmin: (email: string, staffRole?: string) =>
    apiRequest('/admin/users/add-admin', 'POST', { email, role: 'admin', staffRole }),
};

export const adminAPI = {
  getUsers: (includePii = false) => apiRequest(`/admin/users${includePii ? '?includePii=true' : ''}`),
  getDashboardStats: () => apiRequest('/admin/stats'),
  getMessages: () => apiRequest('/admin/messages'),
  getGroups: () => apiRequest('/admin/groups'),
  addAdminRole: (email: string) => apiRequest('/admin/users/add-admin', 'POST', { email }),
  async getUserTimeline(userId: string) {
    const response = await apiRequest(`/admin/users/${encodeURIComponent(userId)}/timeline`);
    return {
      ...response,
      account: response.account!,
      timeline: response.timeline || [],
    };
  },
};

export const adminCRMAPI = {
  getOverview: (signal?: AbortSignal) => apiRequest('/admin/crm/overview', 'GET', undefined, true, signal),
  search: (query: string, signal?: AbortSignal) =>
    apiRequest(`/admin/search?q=${encodeURIComponent(query)}`, 'GET', undefined, true, signal),
  getModerationQueue: () => apiRequest('/admin/moderation/queue'),
  decideModeration: (decision: { listingId: string; decision: 'approve' | 'reject' | 'flag'; reason?: string }) =>
    apiRequest('/admin/moderation/decide', 'POST', decision),
  bulkDecideModeration: (decision: { listingIds: string[]; decision: 'approve' | 'reject' | 'flag' }) =>
    apiRequest('/admin/moderation/bulk-decide', 'POST', decision),
  getMerchants: () => apiRequest('/admin/crm/merchants'),
  getVerifications: () => apiRequest('/admin/verifications'),
  decideVerification: (decision: { requestId: string; decision: 'approved' | 'rejected'; notes: string }) =>
    apiRequest('/admin/verifications/decide', 'POST', decision),
};

export const messagesAPI = {
  getMessages: (chatId: string) => apiRequest(`/messages/${chatId}`),
  sendMessage: (chatId: string, content: string, replyTo?: any, listing?: any, offerData?: any) =>
    apiRequest('/messages', 'POST', { chatId, content, replyTo, listing, offerData }),
  updateMessageStatus: (messageId: string, status: 'sent' | 'delivered' | 'read') =>
    apiRequest(`/messages/${messageId}/status`, 'PATCH', { status }),
  getInbox: async (): Promise<{ conversations?: any[] }> => {
    try {
      const res = await apiRequest('/messages/inbox');
      return { conversations: res.data?.conversations || (res as any).conversations || [] };
    } catch {
      return { conversations: [] };
    }
  },
  respondToOffer: async (messageId: string, action: string, counterPrice?: number): Promise<{ success: boolean; message: any }> => {
    try {
      return (await apiRequest(`/messages/${messageId}/offer`, 'POST', { action, counterPrice })) as any;
    } catch {
      return {
        success: true,
        message: {
          id: `off_${Date.now()}`,
          content: action === 'counter' ? `Counter-offer: $${counterPrice?.toLocaleString()}` : `Offer ${action}`,
          timestamp: new Date().toISOString(),
          status: 'sent',
          type: 'offer',
          offerData: {
            status: action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'countered',
            offerPrice: counterPrice ?? 0,
          },
        },
      };
    }
  },
};

export const groupsAPI = {
  getGroups: () => apiRequest('/groups'),
  createGroup: (name: string, members: string[]) => apiRequest('/groups', 'POST', { name, members }),
  getGroupMessages: (groupId: string) => apiRequest(`/groups/${groupId}/messages`),
  sendGroupMessage: (groupId: string, content: string) => apiRequest(`/groups/${groupId}/messages`, 'POST', { content }),
};

export const storiesAPI = {
  getStories: () => apiRequest('/stories'),
  createStory: (media: { type: 'image' | 'video'; url: string }[], content: string) =>
    apiRequest('/stories', 'POST', { media, content }),
  markViewed: (storyId: string) => apiRequest(`/stories/${storyId}/view`, 'PATCH', {}),
};

export const jobApplicationsAPI = {
  submit: (listingId: string, coverLetter: string) =>
    apiRequest(`/jobs/${encodeURIComponent(listingId)}/applications`, 'POST', { coverLetter }),
  getMyApplication: (listingId: string) =>
    apiRequest(`/jobs/${encodeURIComponent(listingId)}/applications/mine`),
  getForListing: (listingId: string) =>
    apiRequest(`/jobs/${encodeURIComponent(listingId)}/applications`),
};

export const contactsAPI = {
  getContacts: () => apiRequest('/contacts'),
};

export const businessesAPI = {
  getBusinesses: (type?: string) => apiRequest(type && type !== 'All Categories' && type !== 'All' ? `/businesses?type=${encodeURIComponent(type)}` : '/businesses', 'GET', undefined, false),
  getAdvertisements: () => apiRequest('/advertisements', 'GET', undefined, false),
  getBusinessById: (id: string) => apiRequest(`/businesses/${encodeURIComponent(id)}`, 'GET', undefined, false),
  createBusiness: (businessData: any) => apiRequest('/businesses', 'POST', businessData),
  updateBusiness: (id: string, data: any) => apiRequest(`/businesses/${encodeURIComponent(id)}`, 'PATCH', data),
  deleteBusiness: (id: string) => apiRequest(`/businesses/${encodeURIComponent(id)}`, 'DELETE'),
  toggleSponsor: (id: string, adDetails?: { adTag: string; adHeadline: string }) =>
    apiRequest(`/businesses/${encodeURIComponent(id)}/sponsor`, 'PATCH', adDetails),
};

export const executiveOverviewAPI = {
  getOverview: () => apiRequest('/admin/executive-overview'),
  getData: () => apiRequest('/admin/executive-overview'),
};

export const adminAgentsAPI = {
  getAgents: (department?: string) =>
    apiRequest(`/admin/agents${department && department !== 'all' ? `?department=${encodeURIComponent(department)}` : ''}`),
  createAgent: (data: {
    name: string;
    email: string;
    contactPhone?: string;
    staffRole: string;
    staffTitle: string;
    department: string;
    assignedSupervisorId?: string;
    maxClientQuota?: number;
    temporaryPassword?: string;
    forcePasswordReset?: boolean;
  }) => apiRequest('/admin/agents', 'POST', data),
  updateStatus: (agentId: string, status: 'active' | 'away' | 'suspended') =>
    apiRequest(`/admin/agents/${encodeURIComponent(agentId)}/status`, 'PATCH', { status }),
  updateCredentials: (agentId: string, data: { temporaryPassword?: string; forcePasswordReset?: boolean }) =>
    apiRequest(`/admin/agents/${encodeURIComponent(agentId)}/credentials`, 'PATCH', data),
  reassignPortfolio: (sourceAgentId: string, targetAgentId: string) =>
    apiRequest(`/admin/agents/${encodeURIComponent(sourceAgentId)}/reassign-portfolio`, 'POST', { targetAgentId }),
  deleteAgent: (agentId: string) =>
    apiRequest(`/admin/agents/${encodeURIComponent(agentId)}`, 'DELETE'),
};

export const adminClientsAPI = {
  getClients: (params?: {
    search?: string;
    sector?: string;
    tier?: string;
    assignedAgentId?: string;
    risk?: string;
    verification?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.sector && params.sector !== 'all') qs.set('sector', params.sector);
    if (params?.tier && params.tier !== 'all') qs.set('tier', params.tier);
    if (params?.assignedAgentId && params.assignedAgentId !== 'all') qs.set('assignedAgentId', params.assignedAgentId);
    if (params?.risk && params.risk !== 'all') qs.set('risk', params.risk);
    if (params?.verification && params.verification !== 'all') qs.set('verification', params.verification);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.sort) qs.set('sort', params.sort);
    const query = qs.toString();
    return apiRequest(`/admin/clients${query ? `?${query}` : ''}`);
  },
  getClientDossier: (clientId: string) =>
    apiRequest(`/admin/clients/${encodeURIComponent(clientId)}`),
  addStaffNote: (clientId: string, note: { text: string; urgency?: string }) =>
    apiRequest(`/admin/clients/${encodeURIComponent(clientId)}/notes`, 'POST', note),
  assignAgent: (clientId: string, agentId: string) =>
    apiRequest(`/admin/clients/${encodeURIComponent(clientId)}/assign`, 'PATCH', { agentId }),
  setTier: (clientId: string, tier: string) =>
    apiRequest(`/admin/clients/${encodeURIComponent(clientId)}/tier`, 'PATCH', { tier }),
  bulkAssign: (clientIds: string[], agentId: string) =>
    apiRequest('/admin/clients/bulk-assign', 'POST', { clientIds, agentId }),
  bulkTier: (clientIds: string[], tier: string) =>
    apiRequest('/admin/clients/bulk-tier', 'POST', { clientIds, tier }),
  resetClientCredentials: (clientId: string) =>
    apiRequest(`/admin/clients/${encodeURIComponent(clientId)}/credentials-reset`, 'POST'),
};

export const staffAuthAPI = {
  login: (email: string, password: string) =>
    apiRequest('/auth/staff-login', 'POST', { email, password }, false),
};

