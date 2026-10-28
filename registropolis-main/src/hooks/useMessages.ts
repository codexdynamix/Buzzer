import { useState, useEffect, useCallback, useRef } from 'react';
import { MessagesState, Message } from '@/types/messageTypes';
import { v4 as uuidv4 } from 'uuid';
import { getSocket } from '@/services/socketService';
import { messagesAPI } from '@/services/apiService';
import { toast } from 'sonner';

function getCurrentUserId(): string | null {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || null;
  } catch {
    return null;
  }
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchMessages(chatId: string): Promise<Message[]> {
  try {
    const data = await messagesAPI.getMessages(chatId);
    const myId = getCurrentUserId();
    return (data.messages || []).map((m: any) => ({
      id: m.id,
      content: m.content,
      timestamp: m.timestamp,
      sender: m.senderId === myId ? 'user' : 'contact',
      status: m.status || 'sent',
      repliedToMessage: m.replyTo,
    }));
  } catch (error) {
    toast.error('Unable to load messages. Please try again.');
    throw error;
  }
}

async function persistMessage(chatId: string, content: string, replyTo?: any): Promise<any> {
  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ recipientId: chatId, content, replyTo }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
    return data.message;
  } catch (err) {
    console.error('Failed to persist message:', err);
    toast.error('Unable to send message. Please try again.');
    throw err;
  }
}

export function useMessages() {
  const [messages, setMessages] = useState<MessagesState>({});
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isContactTyping, setIsContactTyping] = useState(false);
  const currentRoomRef = useRef<string | null>(null);

  // Socket.IO: listen for incoming messages and typing events
  useEffect(() => {
    const socket = getSocket();

    const handleNewMessage = (message: any) => {
      const room = currentRoomRef.current;
      if (!room || message.senderId !== room) return;
      const receivedMessage: Message = {
        id: message.id,
        content: message.content,
        timestamp: message.timestamp,
        sender: 'contact',
        status: message.status || 'delivered',
        repliedToMessage: message.replyTo,
      };
      setMessages(prev => {
        const existing = prev[room] || [];
        if (existing.some(item => item.id === receivedMessage.id)) return prev;
        return { ...prev, [room]: [...existing, receivedMessage] };
      });
    };

    const handleTyping = (data: { roomId: string; isTyping: boolean }) => {
      if (data.roomId === currentRoomRef.current) {
        setIsContactTyping(data.isTyping);
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleTyping);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleTyping);
    };
  }, []);

  // Join a socket room when a chat is selected
  const joinRoom = useCallback((chatId: string) => {
    const socket = getSocket();
    if (currentRoomRef.current && currentRoomRef.current !== chatId) {
      socket.emit('leave-room', currentRoomRef.current);
    }
    currentRoomRef.current = chatId;
    socket.emit('join-room', chatId);
  }, []);

  // Leave the current room
  const leaveRoom = useCallback((chatId: string) => {
    const socket = getSocket();
    socket.emit('leave-room', chatId);
    if (currentRoomRef.current === chatId) currentRoomRef.current = null;
  }, []);

  // Load messages for a chat from the backend
  const loadInitialMessages = useCallback(async (chatId: string) => {
    setMessages(prev => {
      if (prev[chatId]) return prev;
      return { ...prev, [chatId]: [] };
    });
    const msgs = await fetchMessages(chatId);
    setMessages(prev => ({ ...prev, [chatId]: msgs }));
  }, []);

  // Simulate a product inquiry message being received
  const simulateProductInquiry = useCallback((chatId: string, productName: string) => {
    const msg: Message = {
      id: uuidv4(),
      content: `Hi! I'm interested in "${productName}". Is it still available?`,
      timestamp: new Date().toISOString(),
      sender: 'contact',
      status: 'delivered',
    };
    setMessages(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), msg] }));
  }, []);

  // Send a message and broadcast it only after persistence succeeds.
  const handleSendMessage = useCallback(async (chatId: string, content: string) => {
    if (!content.trim()) return;

    const replyTo = replyingTo ? {
      id: replyingTo.id,
      content: replyingTo.content,
      sender: replyingTo.sender,
    } : undefined;
    const savedMessage = await persistMessage(chatId, content.trim(), replyTo);
    const message: Message = {
      id: savedMessage.id,
      content: content.trim(),
      timestamp: savedMessage.timestamp,
      sender: 'user',
      status: savedMessage.status ?? 'sent',
      repliedToMessage: savedMessage.replyTo,
    };
    setMessages(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), message] }));
    setReplyingTo(null);
    const socket = getSocket();
    socket.emit('send-message', { messageId: message.id });
    socket.emit('typing', { peerId: chatId, isTyping: false });
  }, [replyingTo]);

  const handleEditMessage = useCallback((chatId: string, messageId: string, newContent: string) => {
    setMessages(prev => {
      if (!prev[chatId]) return prev;
      return { ...prev, [chatId]: prev[chatId].map(msg => msg.id === messageId ? { ...msg, content: newContent } : msg) };
    });
  }, []);

  const handleDeleteMessage = useCallback((chatId: string, messageId: string) => {
    setMessages(prev => {
      if (!prev[chatId]) return prev;
      return { ...prev, [chatId]: prev[chatId].filter(msg => msg.id !== messageId) };
    });
  }, []);

  const handleReplyToMessage = useCallback((chatId: string, messageId: string) => {
    setMessages(prev => {
      const chatMessages = prev[chatId] || [];
      const target = chatMessages.find(msg => msg.id === messageId);
      if (target) setReplyingTo(target);
      return prev;
    });
  }, []);

  const handleScheduleMessage = useCallback((chatId: string, content: string, scheduledTime: Date) => {
    const message: Message = {
      id: uuidv4(),
      content,
      timestamp: new Date().toISOString(),
      sender: 'user',
      status: 'sent',
      scheduledFor: scheduledTime.toISOString(),
    };
    const delay = scheduledTime.getTime() - Date.now();
    if (delay <= 0) {
      handleSendMessage(chatId, content);
      return;
    }
    setTimeout(() => { void handleSendMessage(chatId, content); }, delay);
  }, [handleSendMessage]);

  return {
    messages,
    isContactTyping,
    replyingTo,
    setReplyingTo,
    joinRoom,
    leaveRoom,
    loadInitialMessages,
    simulateProductInquiry,
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage,
    handleReplyToMessage,
    handleScheduleMessage,
  };
}

export type { Message } from '@/types/messageTypes';
