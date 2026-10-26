const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path: string, method = 'GET', body?: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export class MessagesRepository {
  static async getMessagesBetweenUsers(currentUserId: string, otherUserId: string) {
    try {
      const chatId = [currentUserId, otherUserId].sort().join('-');
      const data = await apiFetch(`/messages/${chatId}`);
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw new Error('Failed to fetch messages');
    }
  }

  static async createMessage(message: { chatId: string; senderId: string; content: string; status?: string; replyTo?: any }) {
    try {
      const data = await apiFetch('/messages', 'POST', {
        chatId: message.chatId,
        content: message.content,
        replyTo: message.replyTo,
      });
      return data.message?.id || '';
    } catch (error) {
      console.error('Error creating message:', error);
      throw new Error('Failed to create message');
    }
  }

  static async updateMessageStatus(messageId: string, status: string) {
    try {
      await apiFetch(`/messages/${messageId}/status`, 'PATCH', { status });
    } catch (error) {
      console.error('Error updating message status:', error);
      throw new Error('Failed to update message status');
    }
  }
}
