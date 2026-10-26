import { toast } from 'sonner';

type ApiSuccessResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
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
  requiresAuth: boolean = true
): Promise<ApiSuccessResponse<any>> => {
  if (requiresAuth && !localStorage.getItem('auth_token')) {
    throw new Error('Authentication required');
  }
  try {
    const response = await fetch(`/api${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: data !== undefined ? JSON.stringify(data) : undefined,
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
  addAdmin: (email: string) => apiRequest('/admin/users/add-admin', 'POST', { email }),
};

export const adminAPI = {
  getUsers: () => apiRequest('/admin/users'),
  getDashboardStats: () => apiRequest('/admin/stats'),
  getMessages: () => apiRequest('/admin/messages'),
  getGroups: () => apiRequest('/admin/groups'),
  addAdminRole: (email: string) => apiRequest('/admin/users/add-admin', 'POST', { email }),
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
  getBusinesses: (type?: string) => apiRequest(type ? `/businesses?type=${type}` : '/businesses', 'GET', undefined, false),
  createBusiness: (businessData: any) => apiRequest('/businesses', 'POST', businessData),
};
