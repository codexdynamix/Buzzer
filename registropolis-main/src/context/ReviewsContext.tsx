import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useGuestGate } from './GuestGateContext';

export interface Review {
  id: string;
  listingId: string;
  section: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewsContextValue {
  getReviewsForListing: (listingId: string, section: string) => Review[];
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  getRatingStats: (listingId: string, section: string) => { avg: number; count: number; breakdown: Record<number, number> };
  hasUserReviewed: (listingId: string, section: string) => boolean;
}

const defaultStats = { avg: 0, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

const ReviewsContext = createContext<ReviewsContextValue>({
  getReviewsForListing: () => [],
  addReview: () => {},
  getRatingStats: () => defaultStats,
  hasUserReviewed: () => false,
});

const SEED_REVIEWS: Review[] = [
  { id: 'r1', listingId: '1', section: 'marketplace', reviewerName: 'Sarah M.', rating: 5, comment: 'Exactly as described! MacBook was in perfect condition, seller was responsive and shipping was fast. Highly recommend!', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'r2', listingId: '1', section: 'marketplace', reviewerName: 'David K.', rating: 4, comment: 'Great deal overall. Minor scuff on the corner not mentioned, but honestly barely noticeable. Would buy from again.', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'r3', listingId: '1', section: 'marketplace', reviewerName: 'Priya L.', rating: 5, comment: 'Seller is a gem. Quick replies, fair price, smooth transaction. 10/10.', createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 'r4', listingId: '2', section: 'marketplace', reviewerName: 'Tom W.', rating: 5, comment: 'Headphones are incredible — noise cancellation is top tier. Perfect condition, just like listed.', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'r5', listingId: '2', section: 'marketplace', reviewerName: 'Emily R.', rating: 4, comment: 'Good value. Missing the original case but price was adjusted accordingly. Sound quality is fantastic.', createdAt: new Date(Date.now() - 8 * 86400000).toISOString() },
  { id: 'r6', listingId: '3', section: 'marketplace', reviewerName: 'Marcus T.', rating: 5, comment: 'Deadstock condition for real. Not a crease on them. Lightning fast shipping too.', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'r7', listingId: '4', section: 'marketplace', reviewerName: 'Jen B.', rating: 4, comment: 'Camera shoots beautifully. Battery life is slightly degraded but expected for the age. Great price.', createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 'r8', listingId: '5', section: 'marketplace', reviewerName: 'Alex N.', rating: 5, comment: "Stunning watch. Photos don't do it justice. Seller packaged it immaculately.", createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 'r9', listingId: '6', section: 'marketplace', reviewerName: 'Claire D.', rating: 4, comment: 'Sofa is gorgeous, exact colour as pictured. Delivery coordination was smooth.', createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },
];

export const ReviewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { requireAuth } = useGuestGate();
  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const stored = localStorage.getItem('buzzer_reviews');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SEED_REVIEWS;
  });

  useEffect(() => {
    localStorage.setItem('buzzer_reviews', JSON.stringify(reviews));
  }, [reviews]);

  const getReviewsForListing = useCallback((listingId: string, section: string) =>
    reviews.filter(r => r.listingId === listingId && r.section === section),
  [reviews]);

  const addReview = useCallback((review: Omit<Review, 'id' | 'createdAt'>) => {
    if (!requireAuth()) return;
    const newReview: Review = { ...review, id: `rev_${Date.now()}`, createdAt: new Date().toISOString() };
    setReviews(prev => [newReview, ...prev]);
  }, [requireAuth]);

  const getRatingStats = useCallback((listingId: string, section: string) => {
    const listing = reviews.filter(r => r.listingId === listingId && r.section === section);
    if (!listing.length) return defaultStats;
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
    listing.forEach(r => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });
    const avg = listing.reduce((sum, r) => sum + r.rating, 0) / listing.length;
    return { avg: Math.round(avg * 10) / 10, count: listing.length, breakdown };
  }, [reviews]);

  const hasUserReviewed = useCallback((listingId: string, section: string) =>
    reviews.some(r => r.listingId === listingId && r.section === section && r.reviewerName === 'You'),
  [reviews]);

  return (
    <ReviewsContext.Provider value={{ getReviewsForListing, addReview, getRatingStats, hasUserReviewed }}>
      {children}
    </ReviewsContext.Provider>
  );
};

export const useReviews = () => useContext(ReviewsContext);
