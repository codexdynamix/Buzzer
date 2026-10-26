import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useReviews } from '@/context/ReviewsContext';
import { toast } from 'sonner';

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  listingId: string;
  section: string;
  listingTitle: string;
  sellerName: string;
}

export default function ReviewModal({ open, onClose, listingId, section, listingTitle, sellerName }: ReviewModalProps) {
  const { addReview, hasUserReviewed } = useReviews();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const alreadyReviewed = hasUserReviewed(listingId, section);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error('Please select a star rating'); return; }
    if (comment.trim().length < 10) { toast.error('Please write at least 10 characters'); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    addReview({ listingId, section, reviewerName: 'You', rating, comment: comment.trim() });
    toast.success('Review submitted — thank you!');
    setSubmitting(false);
    setRating(0);
    setComment('');
    onClose();
  };

  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,25,35,0.55)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #F0EBE1' }}>
          <div>
            <h3 className="font-bold text-base" style={{ color: '#0F1923' }}>Leave a Review</h3>
            <p className="text-xs mt-0.5" style={{ color: '#6E7A8A' }}>{listingTitle} · by {sellerName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: '#F5F2EC', color: '#6E7A8A' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#E8E2D8'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'}
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {alreadyReviewed ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-3">⭐</div>
              <p className="font-semibold" style={{ color: '#0F1923' }}>You've already reviewed this listing</p>
              <p className="text-sm mt-1" style={{ color: '#6E7A8A' }}>Only one review per listing is allowed</p>
              <button onClick={onClose} className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold" style={{ backgroundColor: '#1A3353', color: '#fff' }}>
                Got it
              </button>
            </div>
          ) : (
            <>
              {/* Stars */}
              <div className="text-center">
                <p className="text-sm font-semibold mb-3" style={{ color: '#0F1923' }}>How was your experience?</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        size={34}
                        className={`transition-colors ${(hovered || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                      />
                    </button>
                  ))}
                </div>
                {(hovered || rating) > 0 && (
                  <p className="text-sm font-medium" style={{ color: '#C9A96E' }}>{LABELS[hovered || rating]}</p>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: '#0F1923' }}>Your review</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Share your experience with this listing and seller..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 transition-shadow"
                  style={{ backgroundColor: '#F9F7F4', border: '1px solid #E8E2D8', color: '#0F1923', '--tw-ring-color': '#C9A96E' } as React.CSSProperties}
                />
                <p className="text-[11px] mt-1 text-right" style={{ color: comment.length < 10 ? '#9CA3AF' : '#15803D' }}>
                  {comment.length} chars {comment.length < 10 ? `(${10 - comment.length} more needed)` : '✓'}
                </p>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#1A3353', color: '#fff' }}
                onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.backgroundColor = '#142842'; }}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3353'}
              >
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
