import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useGuestGate } from './GuestGateContext';
import { toast } from 'sonner';

export interface ListingChatInfo {
  listingId: string;
  listingTitle: string;
  listingPrice: string;
  listingImage?: string;
  listingCategory: string;
  sellerName: string;
  sellerUserId?: string;
  sellerAvatar?: string;
  triggerOffer?: boolean;
}

interface ChatContextType {
  pendingChat: ListingChatInfo | null;
  openChatWithListing: (info: ListingChatInfo) => void;
  openChatWithUser: (userId: string, userName: string) => void;
  clearPendingChat: () => void;
  unreadByListing: Record<string, number>;
  totalUnread: number;
  getUnreadForListing: (listingId: string, category: string) => number;
  markListingRead: (listingId: string, category: string) => void;
  markAllRead: () => void;
  setListingUnread: (listingId: string, category: string, count: number) => void;
  incrementListingUnread: (listingId: string, category: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const listingKey = (listingId: string, category: string) =>
  `${category}-${listingId}`;

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [pendingChat, setPendingChat] = useState<ListingChatInfo | null>(null);
  const [unreadByListing, setUnreadByListing] = useState<Record<string, number>>({});
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showGuestModal } = useGuestGate();

  const getUnreadForListing = useCallback((listingId: string, category: string) => {
    return unreadByListing[listingKey(listingId, category)] ?? 0;
  }, [unreadByListing]);

  const markListingRead = useCallback((listingId: string, category: string) => {
    setUnreadByListing(prev => {
      const key = listingKey(listingId, category);
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const setListingUnread = useCallback((listingId: string, category: string, count: number) => {
    setUnreadByListing(prev => ({
      ...prev,
      [listingKey(listingId, category)]: count,
    }));
  }, []);

  const incrementListingUnread = useCallback((listingId: string, category: string) => {
    setUnreadByListing(prev => {
      const key = listingKey(listingId, category);
      return { ...prev, [key]: (prev[key] ?? 0) + 1 };
    });
  }, []);

  const markAllRead = useCallback(() => {
    setUnreadByListing({});
  }, []);

  const openChatWithListing = useCallback((info: ListingChatInfo) => {
    if (!isAuthenticated) {
      showGuestModal();
      return;
    }
    if (!info.sellerUserId) {
      toast.error('This listing does not have a verified owner account to message.');
      return;
    }
    setPendingChat(info);
    markListingRead(info.listingId, info.listingCategory);
    navigate('/dashboard/messages');
  }, [isAuthenticated, showGuestModal, navigate, markListingRead]);

  const openChatWithUser = useCallback((userId: string, userName: string) => {
    if (!isAuthenticated) {
      showGuestModal();
      return;
    }
    setPendingChat({
      listingId: userId,
      listingTitle: `Chat with ${userName}`,
      listingPrice: '',
      listingCategory: 'messages',
      sellerName: userName,
      sellerUserId: userId,
    });
    navigate('/dashboard/messages');
  }, [isAuthenticated, showGuestModal, navigate]);

  const clearPendingChat = useCallback(() => {
    setPendingChat(null);
  }, []);

  const totalUnread = Object.values(unreadByListing).reduce((sum, n) => sum + n, 0);

  return (
    <ChatContext.Provider value={{
      pendingChat,
      openChatWithListing,
      openChatWithUser,
      clearPendingChat,
      unreadByListing,
      totalUnread,
      getUnreadForListing,
      markListingRead,
      markAllRead,
      setListingUnread,
      incrementListingUnread,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
};
