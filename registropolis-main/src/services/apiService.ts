import { toast } from 'sonner';

type ApiSuccessResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  businesses?: T;
  advertisements?: T;
  kpis?: {
    totalUsers: number;
    activeListings: number;
    pendingModeration: number;
    pendingVerifications: number;
    openTickets: number;
    sponsoredBusinesses: number;
  };
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
  sendMessage: (chatId: string, content: string, replyTo?: any) => apiRequest('/messages', 'POST', { chatId, content, replyTo }),
  updateMessageStatus: (messageId: string, status: 'sent' | 'delivered' | 'read') => apiRequest(`/messages/${messageId}/status`, 'PATCH', { status }),
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
