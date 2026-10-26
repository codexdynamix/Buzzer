import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface SavedItem {
  section: string;
  listing: any;
  savedAt: number;
}

interface SavedContextValue {
  isSaved: (section: string, id: string) => boolean;
  toggleSaved: (section: string, listing: any) => void;
  removeSaved: (section: string, id: string) => void;
  savedItems: SavedItem[];
  savedCount: number;
}

const SavedContext = createContext<SavedContextValue>({
  isSaved: () => false,
  toggleSaved: () => {},
  removeSaved: () => {},
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

  useEffect(() => { saveToStorage(savedItems); }, [savedItems]);

  const isSaved = useCallback((section: string, id: string) =>
    savedItems.some(i => i.section === section && i.listing?.id === id), [savedItems]);

  const toggleSaved = useCallback((section: string, listing: any) => {
    setSavedItems(prev => {
      const exists = prev.some(i => i.section === section && i.listing?.id === listing?.id);
      if (exists) return prev.filter(i => !(i.section === section && i.listing?.id === listing?.id));
      return [{ section, listing, savedAt: Date.now() }, ...prev];
    });
  }, []);

  const removeSaved = useCallback((section: string, id: string) => {
    setSavedItems(prev => prev.filter(i => !(i.section === section && i.listing?.id === id)));
  }, []);

  return (
    <SavedContext.Provider value={{ isSaved, toggleSaved, removeSaved, savedItems, savedCount: savedItems.length }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() { return useContext(SavedContext); }
