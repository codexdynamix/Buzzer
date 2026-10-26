import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface RecentlyViewedItem {
  section: string;
  listing: any;
  viewedAt: number;
}

interface RecentlyViewedContextValue {
  recentItems: RecentlyViewedItem[];
  recentCount: number;
  recordView: (section: string, listing: any) => void;
  clearRecent: () => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextValue>({
  recentItems: [],
  recentCount: 0,
  recordView: () => {},
  clearRecent: () => {},
});

const STORAGE_KEY = 'buzzer_recently_viewed';
const MAX_ITEMS = 50;

function loadFromStorage(): RecentlyViewedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: RecentlyViewedItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
}

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [recentItems, setRecentItems] = useState<RecentlyViewedItem[]>(loadFromStorage);

  useEffect(() => { saveToStorage(recentItems); }, [recentItems]);

  const recordView = useCallback((section: string, listing: any) => {
    if (!listing?.id) return;
    setRecentItems(prev => {
      const filtered = prev.filter(i => !(i.section === section && i.listing?.id === listing.id));
      const updated = [{ section, listing, viewedAt: Date.now() }, ...filtered];
      return updated.slice(0, MAX_ITEMS);
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentItems([]);
  }, []);

  return (
    <RecentlyViewedContext.Provider value={{ recentItems, recentCount: recentItems.length, recordView, clearRecent }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() { return useContext(RecentlyViewedContext); }
