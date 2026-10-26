import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, GitCompareArrows, Plus, BarChart2 } from 'lucide-react';
import { useSellerCompare } from '@/context/SellerCompareContext';
import { AnimatePresence, motion } from 'framer-motion';

export default function SellerCompareBar() {
  const { pinned, unpin, clear } = useSellerCompare();
  const navigate = useNavigate();

  if (pinned.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
        className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
        style={{
          translateX: '-50%',
          backgroundColor: '#0F1923',
          border: '1px solid rgba(201,169,110,0.3)',
          boxShadow: '0 8px 32px rgba(15,25,35,0.4)',
          minWidth: 'min(520px, calc(100vw - 32px))',
        }}
      >
        {/* Icon */}
        <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(201,169,110,0.15)' }}>
          <BarChart2 size={16} style={{ color: '#C9A96E' }} />
        </div>

        {/* Seller slots */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {pinned.map(s => (
            <div
              key={s.name}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ backgroundColor: '#1A3353', color: '#C9A96E' }}
              >
                {s.name[0]}
              </div>
              <span className="text-xs font-semibold truncate max-w-[80px]" style={{ color: '#fff' }}>{s.name}</span>
              <button
                onClick={() => unpin(s.name)}
                className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
              >
                <X size={9} style={{ color: '#fff' }} />
              </button>
            </div>
          ))}

          {pinned.length < 2 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ border: '1px dashed rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)' }}
            >
              <Plus size={12} />
              <span className="text-xs">Add seller</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={clear}
            className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.45)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
          >
            Clear
          </button>
          <button
            onClick={() => navigate('/dashboard/compare')}
            disabled={pinned.length < 2}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              backgroundColor: pinned.length < 2 ? 'rgba(201,169,110,0.3)' : '#C9A96E',
              color: pinned.length < 2 ? 'rgba(201,169,110,0.5)' : '#0F1923',
              cursor: pinned.length < 2 ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (pinned.length >= 2) (e.currentTarget as HTMLElement).style.backgroundColor = '#ba965c'; }}
            onMouseLeave={e => { if (pinned.length >= 2) (e.currentTarget as HTMLElement).style.backgroundColor = '#C9A96E'; }}
          >
            <GitCompareArrows size={13} />
            Compare {pinned.length < 2 ? `(${pinned.length}/2)` : 'Now'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
