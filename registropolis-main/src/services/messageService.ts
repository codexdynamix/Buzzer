import { Message } from '@/types/messageTypes';

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

export async function saveMessage(chatId: string, message: Message) {
  try {
    await apiFetch('/messages', 'POST', {
      chatId,
      content: message.content,
      replyTo: message.repliedToMessage,
    });
    return true;
  } catch (error) {
    console.error('Error saving message:', error);
    return false;
  }
}

export async function getMessages(chatId: string): Promise<Message[]> {
  try {
    const data = await apiFetch(`/messages/${chatId}`);
    return (data.messages || []).map((m: any) => ({
      id: m.id,
      content: m.content,
      timestamp: m.timestamp,
      sender: m.sender || 'contact',
      status: m.status || 'sent',
      repliedToMessage: m.replyTo,
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

export async function updateMessage(chatId: string, messageId: string, updates: Partial<Message>) {
  try {
    if (updates.status) {
      await apiFetch(`/messages/${messageId}/status`, 'PATCH', { status: updates.status });
    }
    return true;
  } catch (error) {
    console.error('Error updating message:', error);
    return false;
  }
}

export async function deleteMessage(_chatId: string, _messageId: string) {
  return true;
}
