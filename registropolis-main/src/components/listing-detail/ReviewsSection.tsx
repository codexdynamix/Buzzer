import React, { useState } from 'react';
import { Star, MessageSquarePlus, ChevronDown, ChevronUp } from 'lucide-react';
import { useReviews, Review } from '@/context/ReviewsContext';
import ReviewModal from '@/components/common/ReviewModal';

interface ReviewsSectionProps {
  listingId: string;
  section: string;
  listingTitle: string;
  sellerName: string;
}

function StarBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium w-12 text-right shrink-0" style={{ color: '#6E7A8A' }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F0EBE1' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: pct > 0 ? '#F59E0B' : 'transparent' }}
        />
      </div>
      <span className="text-[11px] w-5 shrink-0" style={{ color: '#6E7A8A' }}>{count}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.createdAt);
  const timeAgo = (() => {
    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  })();

  const isYou = review.reviewerName === 'You';

  return (
    <div className="py-4" style={{ borderBottom: '1px solid #F0EBE1' }}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ backgroundColor: isYou ? '#1A3353' : '#F5F2EC', color: isYou ? '#C9A96E' : '#6E7A8A' }}
          >
            {review.reviewerName[0]}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#0F1923' }}>
              {review.reviewerName}
              {isYou && <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#F0EBE1', color: '#1A3353' }}>You</span>}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={11} className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                ))}
              </div>
              <span className="text-[11px]" style={{ color: '#9CA3AF' }}>{timeAgo}</span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-sm leading-relaxed pl-[42px]" style={{ color: '#374151' }}>{review.comment}</p>
    </div>
  );
}

export default function ReviewsSection({ listingId, section, listingTitle, sellerName }: ReviewsSectionProps) {
  const { getReviewsForListing, getRatingStats } = useReviews();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const reviews = getReviewsForListing(listingId, section);
  const stats = getRatingStats(listingId, section);
  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  const ratingLabel = stats.avg >= 4.8 ? 'Exceptional' : stats.avg >= 4.5 ? 'Excellent' : stats.avg >= 4.0 ? 'Very Good' : stats.avg >= 3.5 ? 'Good' : stats.avg >= 3.0 ? 'Average' : 'Below Average';

  return (
    <div className="mt-8">
      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        listingId={listingId}
        section={section}
        listingTitle={listingTitle}
        sellerName={sellerName}
      />

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E2D8' }}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ backgroundColor: '#fff', borderBottom: '1px solid #F0EBE1' }}>
          <div>
            <h3 className="text-base font-bold" style={{ color: '#0F1923' }}>Reviews</h3>
            <p className="text-xs mt-0.5" style={{ color: '#6E7A8A' }}>{stats.count} {stats.count === 1 ? 'review' : 'reviews'} from verified buyers</p>
          </div>
          <button
            onClick={() => setReviewOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ backgroundColor: '#F5F2EC', color: '#1A3353', border: '1px solid #E8E2D8' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#C9A96E'; (e.currentTarget as HTMLElement).style.color = '#0F1923'; (e.currentTarget as HTMLElement).style.borderColor = '#C9A96E'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; (e.currentTarget as HTMLElement).style.color = '#1A3353'; (e.currentTarget as HTMLElement).style.borderColor = '#E8E2D8'; }}
          >
            <MessageSquarePlus size={13} /> Write a Review
          </button>
        </div>

        <div className="px-5 py-5" style={{ backgroundColor: '#fff' }}>
          {stats.count === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-3">💬</div>
              <p className="font-semibold text-sm" style={{ color: '#0F1923' }}>No reviews yet</p>
              <p className="text-xs mt-1 mb-4" style={{ color: '#6E7A8A' }}>Be the first to share your experience</p>
              <button
                onClick={() => setReviewOpen(true)}
                className="px-5 py-2 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: '#1A3353', color: '#fff' }}
              >
                Leave the first review
              </button>
            </div>
          ) : (
            <>
              {/* Rating summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 pb-6" style={{ borderBottom: '1px solid #F0EBE1' }}>
                {/* Big score */}
                <div className="flex flex-col items-center justify-center py-2">
                  <span className="text-5xl font-black" style={{ color: '#0F1923', letterSpacing: '-0.04em' }}>{stats.avg.toFixed(1)}</span>
                  <div className="flex items-center gap-0.5 mt-2 mb-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={18} className={s <= Math.round(stats.avg) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                    ))}
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#C9A96E' }}>{ratingLabel}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{stats.count} ratings</p>
                </div>

                {/* Star breakdown */}
                <div className="space-y-2 justify-center flex flex-col">
                  {[5, 4, 3, 2, 1].map(star => (
                    <StarBar
                      key={star}
                      label={`${star} ★`}
                      count={stats.breakdown[star] || 0}
                      total={stats.count}
                    />
                  ))}
                </div>
              </div>

              {/* Reviews list */}
              <div>
                {displayedReviews.map(r => <ReviewCard key={r.id} review={r} />)}
              </div>

              {reviews.length > 3 && (
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="mt-4 flex items-center gap-1.5 text-sm font-medium transition-colors"
                  style={{ color: '#6E7A8A' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#1A3353'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6E7A8A'}
                >
                  {showAll ? <><ChevronUp size={15} /> Show less</> : <><ChevronDown size={15} /> Show all {reviews.length} reviews</>}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
