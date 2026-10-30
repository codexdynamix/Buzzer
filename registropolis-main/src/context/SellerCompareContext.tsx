import React, { createContext, useContext, useState, useCallback } from 'react';
import { MarketplaceListing } from '@/data/marketplaceData';
import { useGuestGate } from './GuestGateContext';

export interface PinnedSeller {
  name: string;
  verified: boolean;
  rating?: number;
  listings: MarketplaceListing[];
  meta: { memberSince?: string; responseTime?: string; totalSales?: number; bio?: string };
}

interface SellerCompareContextValue {
  pinned: PinnedSeller[];
  pin: (seller: PinnedSeller) => void;
  unpin: (name: string) => void;
  isPinned: (name: string) => boolean;
  clear: () => void;
}

const SellerCompareContext = createContext<SellerCompareContextValue>({
  pinned: [],
  pin: () => {},
  unpin: () => {},
  isPinned: () => false,
  clear: () => {},
});

export function SellerCompareProvider({ children }: { children: React.ReactNode }) {
  const [pinned, setPinned] = useState<PinnedSeller[]>([]);
  const { requireAuth } = useGuestGate();

  const pin = useCallback((seller: PinnedSeller) => {
    if (!requireAuth()) return;
    setPinned(prev => {
      if (prev.some(s => s.name === seller.name)) return prev;
      if (prev.length >= 2) return [prev[1], seller];
      return [...prev, seller];
    });
  }, [requireAuth]);

  const unpin = useCallback((name: string) => {
    if (!requireAuth()) return;
    setPinned(prev => prev.filter(s => s.name !== name));
  }, [requireAuth]);

  const isPinned = useCallback((name: string) =>
    pinned.some(s => s.name === name), [pinned]);

  const clear = useCallback(() => {
    if (!requireAuth()) return;
    setPinned([]);
  }, [requireAuth]);

  return (
    <SellerCompareContext.Provider value={{ pinned, pin, unpin, isPinned, clear }}>
      {children}
    </SellerCompareContext.Provider>
  );
}

export function useSellerCompare() { return useContext(SellerCompareContext); }

export function buildPinnedSeller(name: string, listings: MarketplaceListing[]): PinnedSeller {
  const sellerListings = listings.filter(l => l.seller === name);
  const ratedListings = sellerListings.filter((listing): listing is typeof listing & { sellerRating: number } =>
    typeof listing.sellerRating === 'number'
  );
  const rating = ratedListings.length > 0
    ? ratedListings.reduce((sum, listing) => sum + listing.sellerRating, 0) / ratedListings.length
    : undefined;
  const verified = sellerListings.some(l => l.verified === true);
  const meta = {};
  return { name, verified, rating, listings: sellerListings, meta };
}
