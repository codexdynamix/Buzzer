
import { useState, useEffect } from 'react';

// Type for cached messages
export interface CachedMessage {
  id: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'contact';
  status: 'sent' | 'delivered' | 'read';
  senderName?: string;
  senderAvatar?: string;
  repliedToMessage?: {
    id: string;
    content: string;
    sender: 'user' | 'contact';
    senderName?: string;
  };
  reactions?: { emoji: string; count: number; users?: {id: string, name: string, avatar?: string}[] }[];
  isStarred?: boolean;
  attachments?: string[];
  scheduledFor?: string;
}

// Message cache interface
export interface MessageCacheState {
  [chatId: string]: CachedMessage[];
}

export function useMessageCache() {
  // Initialize with messages from localStorage if available
  const [cachedMessages, setCachedMessages] = useState<MessageCacheState>(() => {
    try {
      const stored = localStorage.getItem('chat_messages');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load messages from localStorage:', error);
      return {};
    }
  });

  // Save to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem('chat_messages', JSON.stringify(cachedMessages));
      console.log('Messages saved to localStorage', Object.keys(cachedMessages).length);
    } catch (error) {
      console.error('Failed to save messages to localStorage:', error);
    }
  }, [cachedMessages]);

  // Add a message to the cache
  const cacheMessage = (chatId: string, message: CachedMessage) => {
    console.log(`Caching message for chat ${chatId}:`, message);
    setCachedMessages(prev => {
      const updated = { 
        ...prev,
        [chatId]: [...(prev[chatId] || []), message]
      };
      return updated;
    });
  };

  // Add multiple messages to the cache
  const cacheMessages = (chatId: string, messages: CachedMessage[]) => {
    console.log(`Caching ${messages.length} messages for chat ${chatId}`);
    setCachedMessages(prev => {
      const updated = {
        ...prev,
        [chatId]: [...(prev[chatId] || []), ...messages]
      };
      return updated;
    });
  };

  // Update a message in the cache
  const updateCachedMessage = (chatId: string, messageId: string, updates: Partial<CachedMessage>) => {
    setCachedMessages(prev => {
      if (!prev[chatId]) return prev;
      
      const updatedMessages = prev[chatId].map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      );
      
      return {
        ...prev,
        [chatId]: updatedMessages
      };
    });
  };

  // Delete a message from the cache
  const deleteCachedMessage = (chatId: string, messageId: string) => {
    setCachedMessages(prev => {
      if (!prev[chatId]) return prev;
      
      return {
        ...prev,
        [chatId]: prev[chatId].filter(msg => msg.id !== messageId)
      };
    });
  };

  // Get messages for a chat
  const getCachedMessages = (chatId: string): CachedMessage[] => {
    return cachedMessages[chatId] || [];
  };

  // Check if there are any messages for a chat
  const hasCachedMessages = (chatId: string): boolean => {
    return Boolean(cachedMessages[chatId] && cachedMessages[chatId].length > 0);
  };

  // Get all chat IDs that have messages
  const getCachedChatIds = (): string[] => {
    return Object.keys(cachedMessages);
  };

  // Clear the cache for testing or logout
  const clearCache = () => {
    setCachedMessages({});
    localStorage.removeItem('chat_messages');
  };

  return {
    cachedMessages,
    cacheMessage,
    cacheMessages,
    updateCachedMessage,
    deleteCachedMessage,
    getCachedMessages,
    hasCachedMessages,
    getCachedChatIds,
    clearCache
  };
}
