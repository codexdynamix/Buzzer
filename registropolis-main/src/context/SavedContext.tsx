import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useGuestGate } from './GuestGateContext';
import { useAuth } from './AuthContext';
import { listingEngagementAPI, type ListingEngagementStats } from '@/services/listingEngagementService';

export interface SavedItem {
  section: string;
  listing: any;
  savedAt: number;
}

interface SavedContextValue {
  isSaved: (section: string, id: string) => boolean;
  toggleSaved: (section: string, listing: any) => Promise<ListingEngagementStats | null>;
  removeSaved: (section: string, id: string) => Promise<ListingEngagementStats | null>;
  savedItems: SavedItem[];
  savedCount: number;
}

const SavedContext = createContext<SavedContextValue>({
  isSaved: () => false,
  toggleSaved: async () => null,
  removeSaved: async () => null,
  savedItems: [],
  savedCount: 0,
});

const STORAGE_KEY = 'buzzer_saved_listings';

function loadFromStorage(): SavedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: SavedItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
}

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [savedItems, setSavedItems] = useState<SavedItem[]>(loadFromStorage);
  const { requireAuth } = useGuestGate();
  const { user } = useAuth();

  useEffect(() => { saveToStorage(savedItems); }, [savedItems]);

  const isSaved = useCallback((section: string, id: string) =>
    savedItems.some(i => i.section === section && i.listing?.id === id), [savedItems]);

  const toggleSaved = useCallback(async (section: string, listing: any) => {
    if (!requireAuth()) return null;
    const exists = savedItems.some(i => i.section === section && i.listing?.id === listing?.id);
    try {
      const stats = listing?.id && listing.userId !== user?.id
        ? await listingEngagementAPI.record(listing.id, 'save', !exists)
        : null;
      setSavedItems(prev => exists
        ? prev.filter(i => !(i.section === section && i.listing?.id === listing?.id))
        : [{ section, listing, savedAt: Date.now() }, ...prev]);
      return stats;
    } catch (error) {
      console.error('Could not update saved listing:', error);
      return null;
    }
  }, [requireAuth, savedItems, user?.id]);

  const removeSaved = useCallback(async (section: string, id: string) => {
    if (!requireAuth()) return null;
    try {
      const savedItem = savedItems.find(item => item.section === section && item.listing?.id === id);
      const stats = savedItem?.listing?.userId === user?.id
        ? null
        : await listingEngagementAPI.record(id, 'save', false);
      setSavedItems(prev => prev.filter(i => !(i.section === section && i.listing?.id === id)));
      return stats;
    } catch (error) {
      console.error('Could not remove saved listing:', error);
      return null;
    }
  }, [requireAuth, savedItems, user?.id]);

  return (
    <SavedContext.Provider value={{ isSaved, toggleSaved, removeSaved, savedItems, savedCount: savedItems.length }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() { return useContext(SavedContext); }
