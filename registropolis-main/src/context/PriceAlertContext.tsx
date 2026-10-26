import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { listingsAPI } from '@/services/listingsService';

export interface WatchedListing {
  watchId: string;
  listingId: string;
  section: string;
  title: string;
  image: string;
  seller: string;
  originalPrice: number;
  watchedPrice: number;
  currentPrice: number;
  watchedAt: number;
  hasAlert: boolean;
}

interface PriceAlertContextType {
  watchedListings: WatchedListing[];
  totalAlerts: number;
  isWatched: (section: string, listingId: string) => boolean;
  addWatch: (section: string, listing: { id: string; title: string; image: string; seller: string; price: number }) => void;
  removeWatch: (section: string, listingId: string) => void;
  clearAlert: (watchId: string) => void;
  clearAllAlerts: () => void;
}

const PriceAlertContext = createContext<PriceAlertContextType>({
  watchedListings: [],
  totalAlerts: 0,
  isWatched: () => false,
  addWatch: () => {},
  removeWatch: () => {},
  clearAlert: () => {},
  clearAllAlerts: () => {},
});

export const usePriceAlerts = () => useContext(PriceAlertContext);

const STORAGE_KEY = 'buzzer_price_alerts';

function loadFromStorage(): WatchedListing[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: WatchedListing[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export const PriceAlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [watchedListings, setWatchedListings] = useState<WatchedListing[]>(loadFromStorage);
  const watchedRef = useRef<WatchedListing[]>(watchedListings);

  useEffect(() => {
    watchedRef.current = watchedListings;
    saveToStorage(watchedListings);
  }, [watchedListings]);

  useEffect(() => {
    let active = true;
    let hasReportedError = false;
    const checkForPriceChanges = async () => {
      if (watchedRef.current.length === 0) return;
      try {
        const { listings } = await listingsAPI.getAll();
        if (!active) return;
        hasReportedError = false;
        const latestPrices = new Map<string, number>();
        for (const listing of listings) {
          const rawPrice = listing.data?.price;
          const price = typeof rawPrice === 'number'
            ? rawPrice
            : typeof rawPrice === 'string' && rawPrice.trim()
              ? Number(rawPrice)
              : Number.NaN;
          if (Number.isFinite(price)) latestPrices.set(`${listing.section}-${listing.id}`, price);
        }

        const alerts: Array<{ listing: WatchedListing; previousPrice: number }> = [];
        const updated = watchedRef.current.map(watched => {
          const currentPrice = latestPrices.get(`${watched.section}-${watched.listingId}`);
          if (currentPrice == null || currentPrice === watched.currentPrice) return watched;
          const hasPriceDrop = currentPrice < watched.currentPrice;
          const next = {
            ...watched,
            currentPrice,
            hasAlert: watched.hasAlert || hasPriceDrop,
          };
          if (hasPriceDrop && !watched.hasAlert) alerts.push({ listing: next, previousPrice: watched.currentPrice });
          return next;
        });
        watchedRef.current = updated;
        setWatchedListings(updated);
        alerts.forEach(({ listing, previousPrice }) => toast(`Price drop on ${listing.title}`, {
          description: `Price changed from $${previousPrice.toLocaleString()} to $${listing.currentPrice.toLocaleString()}.`,
          icon: '📉',
          duration: 6000,
          position: 'top-right',
        }));
      } catch (error) {
        if (active && !hasReportedError) {
          hasReportedError = true;
          toast.error(error instanceof Error ? error.message : 'Could not check listing prices');
        }
      }
    };

    void checkForPriceChanges();
    const interval = setInterval(() => { void checkForPriceChanges(); }, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const isWatched = useCallback((section: string, listingId: string) => {
    return watchedRef.current.some(w => w.section === section && w.listingId === listingId);
  }, []);

  const addWatch = useCallback((
    section: string,
    listing: { id: string; title: string; image: string; seller: string; price: number }
  ) => {
    if (watchedRef.current.some(w => w.section === section && w.listingId === listing.id)) return;

    const newWatch: WatchedListing = {
      watchId: `watch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      listingId: listing.id,
      section,
      title: listing.title,
      image: listing.image,
      seller: listing.seller,
      originalPrice: listing.price,
      watchedPrice: listing.price,
      currentPrice: listing.price,
      watchedAt: Date.now(),
      hasAlert: false,
    };

    setWatchedListings(prev => [newWatch, ...prev]);
    toast(`Watching "${listing.title}"`, {
      description: "We'll notify you if the price drops.",
      icon: '🔔',
      duration: 3500,
      position: 'top-right',
    });
  }, []);

  const removeWatch = useCallback((section: string, listingId: string) => {
    setWatchedListings(prev => prev.filter(w => !(w.section === section && w.listingId === listingId)));
  }, []);

  const clearAlert = useCallback((watchId: string) => {
    setWatchedListings(prev => prev.map(w => w.watchId === watchId ? { ...w, hasAlert: false } : w));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setWatchedListings(prev => prev.map(w => ({ ...w, hasAlert: false })));
  }, []);

  const totalAlerts = watchedListings.filter(w => w.hasAlert).length;

  return (
    <PriceAlertContext.Provider value={{
      watchedListings, totalAlerts,
      isWatched, addWatch, removeWatch,
      clearAlert, clearAllAlerts,
    }}>
      {children}
    </PriceAlertContext.Provider>
  );
};
