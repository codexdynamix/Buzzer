import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell, BellOff, TrendingDown, Trash2, ExternalLink, CheckCheck } from 'lucide-react';
import { usePriceAlerts } from '@/context/PriceAlertContext';
import { formatDistanceToNow } from 'date-fns';
import AppLayout from '@/components/layout/AppLayout';

export default function PriceAlertsPage() {
  const navigate = useNavigate();
  const { watchedListings, totalAlerts, removeWatch, clearAlert, clearAllAlerts } = usePriceAlerts();

  useEffect(() => {
    if (totalAlerts > 0) clearAllAlerts();
  }, []);

  const droppedListings = watchedListings.filter(w => w.currentPrice < w.watchedPrice);
  const watchingListings = watchedListings.filter(w => w.currentPrice >= w.watchedPrice);

  return (
    <AppLayout withSidebar>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ backgroundColor: '#F5F2EC', color: '#1A3353' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#EDE8DF'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; }}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: '#0F1923' }}>Price Alerts</h1>
            <p className="text-sm mt-0.5" style={{ color: '#6E7A8A' }}>
              {watchedListings.length === 0
                ? 'No listings being watched'
                : `Watching ${watchedListings.length} listing${watchedListings.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {totalAlerts > 0 && (
            <button
              onClick={clearAllAlerts}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
              style={{ backgroundColor: '#F5F2EC', color: '#6E7A8A', border: '1px solid #E8E2D8' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#EDE8DF'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; }}
            >
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
        </div>

        {/* Empty state */}
        {watchedListings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#F5F2EC' }}
            >
              <Bell size={28} style={{ color: '#C9A96E' }} strokeWidth={1.4} />
            </div>
            <div>
              <p className="font-semibold text-base" style={{ color: '#0F1923' }}>No price watches yet</p>
              <p className="text-sm mt-1 max-w-xs" style={{ color: '#6E7A8A' }}>
                Click the 🔔 icon on any marketplace listing to start watching its price.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/marketplace')}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ backgroundColor: '#1A3353', color: '#fff' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#142842'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3353'; }}
            >
              Browse Marketplace
            </button>
          </motion.div>
        )}

        {/* Price drops section */}
        {droppedListings.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: '#C9A96E' }}>
              <TrendingDown size={13} /> Price Drops ({droppedListings.length})
            </h2>
            <div className="space-y-3">
              <AnimatePresence>
                {droppedListings.map(w => (
                  <WatchCard
                    key={w.watchId}
                    watch={w}
                    onRemove={() => removeWatch(w.section, w.listingId)}
                    onClearAlert={() => clearAlert(w.watchId)}
                    onNavigate={() => navigate(`/dashboard/${w.section}/${w.listingId}`)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Watching section */}
        {watchingListings.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: '#6E7A8A' }}>
              <Bell size={13} /> Watching ({watchingListings.length})
            </h2>
            <div className="space-y-3">
              <AnimatePresence>
                {watchingListings.map(w => (
                  <WatchCard
                    key={w.watchId}
                    watch={w}
                    onRemove={() => removeWatch(w.section, w.listingId)}
                    onClearAlert={() => clearAlert(w.watchId)}
                    onNavigate={() => navigate(`/dashboard/${w.section}/${w.listingId}`)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}

function WatchCard({
  watch,
  onRemove,
  onClearAlert,
  onNavigate,
}: {
  watch: import('@/context/PriceAlertContext').WatchedListing;
  onRemove: () => void;
  onClearAlert: () => void;
  onNavigate: () => void;
}) {
  const dropped = watch.currentPrice < watch.watchedPrice;
  const dropAmt = watch.watchedPrice - watch.currentPrice;
  const dropPct = Math.round((dropAmt / watch.watchedPrice) * 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      className="flex items-center gap-4 p-4 rounded-2xl transition-all"
      style={{
        backgroundColor: '#fff',
        border: `1px solid ${watch.hasAlert ? '#E8D9BC' : '#E8E2D8'}`,
        boxShadow: watch.hasAlert ? '0 2px 12px rgba(201,169,110,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Image */}
      <div
        className="w-16 h-16 rounded-xl overflow-hidden shrink-0 cursor-pointer"
        onClick={onNavigate}
        style={{ backgroundColor: '#F5F2EC' }}
      >
        <img src={watch.image} alt={watch.title} className="w-full h-full object-cover" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p
            className="text-sm font-semibold truncate cursor-pointer flex-1"
            style={{ color: '#0F1923' }}
            onClick={onNavigate}
          >
            {watch.title}
          </p>
          {watch.hasAlert && (
            <span
              className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
            >
              NEW DROP
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: '#6E7A8A' }}>by {watch.seller}</p>

        <div className="flex items-center gap-3 mt-2">
          {dropped ? (
            <>
              <span className="text-base font-bold" style={{ color: '#15803D' }}>
                ${watch.currentPrice.toLocaleString()}
              </span>
              <span className="text-xs line-through" style={{ color: '#6E7A8A' }}>
                ${watch.watchedPrice.toLocaleString()}
              </span>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1"
                style={{ backgroundColor: '#F0FDF4', color: '#15803D' }}
              >
                <TrendingDown size={10} /> −{dropPct}% (−${dropAmt.toLocaleString()})
              </span>
            </>
          ) : (
            <span className="text-base font-bold" style={{ color: '#0F1923' }}>
              ${watch.currentPrice.toLocaleString()}
            </span>
          )}
        </div>
        <p className="text-[10px] mt-1" style={{ color: '#B0B8C4' }}>
          Watching since {formatDistanceToNow(watch.watchedAt, { addSuffix: true })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <button
          onClick={onNavigate}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: '#6E7A8A', backgroundColor: '#F5F2EC' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#EDE8DF'; (e.currentTarget as HTMLElement).style.color = '#1A3353'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; (e.currentTarget as HTMLElement).style.color = '#6E7A8A'; }}
          title="View listing"
        >
          <ExternalLink size={12} />
        </button>
        <button
          onClick={onRemove}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: '#6E7A8A', backgroundColor: '#F5F2EC' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#FEF2F2'; (e.currentTarget as HTMLElement).style.color = '#B91C1C'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; (e.currentTarget as HTMLElement).style.color = '#6E7A8A'; }}
          title="Stop watching"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>
  );
}
