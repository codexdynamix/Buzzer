import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { listingsAPI } from '@/services/listingsService';
import { toast } from 'sonner';

export type ListingSection = 'marketplace' | 'job' | 'service' | 'real-estate' | 'transport' | 'event';
export type ListingStatus = 'active' | 'paused' | 'sold';

export interface UserListing {
  id: string;
  section: ListingSection;
  data: any;
  createdAt: Date;
  status: ListingStatus;
  userId?: string;
}

interface UserListingsContextValue {
  listings: UserListing[];
  addListing: (section: ListingSection, data: any) => Promise<void>;
  removeListing: (id: string) => Promise<void>;
  updateListing: (id: string, data: any) => Promise<void>;
  setListingStatus: (id: string, status: ListingStatus) => Promise<void>;
  getListingsForSection: (section: ListingSection) => any[];
  getAllListings: () => any[];
  totalCount: number;
}

const UserListingsContext = createContext<UserListingsContextValue>({
  listings: [],
  addListing: async () => {},
  removeListing: async () => {},
  updateListing: async () => {},
  setListingStatus: async () => {},
  getListingsForSection: () => [],
  getAllListings: () => [],
  totalCount: 0,
});

function fromAPI(l: any): UserListing {
  return {
    id: l.id,
    section: l.section as ListingSection,
    data: {
      ...l.data,
      seller: l.sellerName ?? l.data?.seller,
      name: l.data?.name ?? l.sellerName ?? l.data?.seller,
      owner: l.owner,
    },
    createdAt: new Date(l.createdAt),
    status: (l.status ?? 'active') as ListingStatus,
    userId: l.userId,
  };
}

export const UserListingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [allListings, setAllListings] = useState<UserListing[]>([]);

  useEffect(() => {
    let cancelled = false;
    listingsAPI.getAll()
      .then(({ listings }) => {
        if (!cancelled) setAllListings(listings.map(fromAPI));
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Could not load listings');
        }
      });
    return () => { cancelled = true; };
  }, []);

  const listings = useMemo(
    () => allListings.filter(l => l.userId === user?.id),
    [allListings, user?.id],
  );

  const addListing = useCallback(async (section: ListingSection, data: any) => {
    if (!user?.id) throw new Error('Sign in to publish a listing');
    try {
      const { listing } = await listingsAPI.create(section, data);
      setAllListings(prev => [fromAPI(listing), ...prev.filter(item => item.id !== listing.id)]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not publish listing');
      throw error;
    }
  }, [user?.id]);

  const removeListing = useCallback(async (id: string) => {
    try {
      await listingsAPI.remove(id);
      setAllListings(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove listing');
    }
  }, []);

  const updateListing = useCallback(async (id: string, data: any) => {
    try {
      const { listing } = await listingsAPI.update(id, data);
      setAllListings(prev => prev.map(item => item.id === id ? fromAPI(listing) : item));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update listing');
      throw error;
    }
  }, []);

  const setListingStatus = useCallback(async (id: string, status: ListingStatus) => {
    try {
      await listingsAPI.setStatus(id, status);
      setAllListings(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update listing status');
    }
  }, []);

  const getListingsForSection = useCallback(
    (section: ListingSection) =>
      allListings
        .filter(l => l.section === section && l.status === 'active')
        .map(l => ({ ...l.data, id: l.id, createdAt: l.createdAt, userId: l.userId })),
    [allListings],
  );

  const getAllListings = useCallback(
    () => allListings
      .filter(l => l.status === 'active')
      .map(l => ({
        ...l.data,
        id: l.id,
        section: l.section,
        createdAt: l.createdAt,
        seller: l.data?.seller,
        userId: l.userId,
      })),
    [allListings],
  );

  const value = useMemo(() => ({
    listings,
    addListing,
    removeListing,
    updateListing,
    setListingStatus,
    getListingsForSection,
    getAllListings,
    totalCount: listings.length,
  }), [listings, addListing, removeListing, updateListing, setListingStatus, getListingsForSection, getAllListings]);

  return (
    <UserListingsContext.Provider value={value}>
      {children}
    </UserListingsContext.Provider>
  );
};

export const useUserListings = () => useContext(UserListingsContext);
