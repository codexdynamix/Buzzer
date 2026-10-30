import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Flag, RefreshCw, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { adminCRMAPI } from '@/services/apiService';

type ReportStatus = 'pending' | 'reviewed' | 'dismissed';
type ReportFilter = 'pending' | 'reviewed' | 'all';
type ReviewAction = 'dismiss' | 'flag_listing';

interface ListingReportItem {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  section: string;
  listingStatus: string;
  reporterName: string;
  sellerName: string;
  reason: string;
  details: string;
  status: ReportStatus;
  createdAt: string;
  reviewNotes?: string;
}

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam or scam',
  misleading: 'Misleading information',
  prohibited: 'Prohibited item',
  wrong_cat: 'Wrong category',
  inappropriate: 'Inappropriate content',
  other: 'Other',
};

export const AdminListingReports: React.FC = () => {
  const [items, setItems] = useState<ListingReportItem[]>([]);
  const [filter, setFilter] = useState<ReportFilter>('pending');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await adminCRMAPI.getListingReports(filter);
      if (!Array.isArray(response.items)) throw new Error('The server returned an invalid report queue');
      setItems(response.items as ListingReportItem[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load customer reports';
      setLoadError(message);
      console.error('Could not load customer reports:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const review = async (item: ListingReportItem, action: ReviewAction) => {
    setReviewingId(item.id);
    try {
      await adminCRMAPI.reviewListingReport(item.id, action, notes[item.id] ?? '');
      toast.success(action === 'dismiss' ? 'Report dismissed' : 'Listing flagged for moderation');
      setItems(previous => previous.filter(report => report.id !== item.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not review this report');
      console.error('Could not review customer report:', error);
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8A6A32]">Trust &amp; safety</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Customer Reports</h2>
          <p className="mt-1 text-sm text-[#6E7A8A]">Review reports submitted against marketplace listings.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadReports()}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-[#E8E2D8] bg-white px-3 py-2 text-xs font-semibold text-[#1A3353] hover:bg-[#F5F0E8] disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="flex gap-2">
        {([
          ['pending', 'Pending'],
          ['reviewed', 'Reviewed'],
          ['all', 'All reports'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              filter === value
                ? 'border-[#1A3353] bg-[#1A3353] text-white'
                : 'border-[#E8E2D8] bg-white text-[#526070] hover:bg-[#F5F0E8]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#E8E2D8] bg-white p-12 text-center text-sm text-[#6E7A8A]">
          Loading customer reports…
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{loadError}</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-white p-12 text-center">
          <CheckCircle2 size={28} className="mx-auto text-emerald-600" />
          <h3 className="mt-3 font-semibold text-[#0F1923]">No reports in this view</h3>
          <p className="mt-1 text-sm text-[#6E7A8A]">Submitted customer reports will appear here for review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <article key={item.id} className="rounded-2xl border border-[#E8E2D8] bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row">
                {item.listingImage && (
                  <img src={item.listingImage} alt="" className="h-20 w-24 rounded-xl object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[#0F1923]">{item.listingTitle}</h3>
                    <span className="rounded-full bg-[#F5F0E8] px-2 py-0.5 text-[10px] font-semibold capitalize text-[#526070]">
                      {item.section.replace('-', ' ')}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      item.status === 'pending' ? 'bg-amber-50 text-amber-800' :
                        item.status === 'dismissed' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-sm font-medium text-red-700">
                    <AlertTriangle size={14} /> {REASON_LABELS[item.reason] ?? item.reason}
                  </p>
                  {item.details && <p className="mt-2 whitespace-pre-wrap text-sm text-[#526070]">{item.details}</p>}
                  <p className="mt-3 text-xs text-[#6E7A8A]">
                    Reported by {item.reporterName} · Seller {item.sellerName} · {new Date(item.createdAt).toLocaleString()}
                  </p>
                  {item.reviewNotes && (
                    <p className="mt-2 text-xs text-[#526070]">Review notes: {item.reviewNotes}</p>
                  )}
                  {item.status === 'pending' && (
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <input
                        value={notes[item.id] ?? ''}
                        onChange={event => setNotes(previous => ({ ...previous, [item.id]: event.target.value }))}
                        maxLength={500}
                        placeholder="Optional review note"
                        aria-label={`Review note for ${item.listingTitle}`}
                        className="min-w-0 flex-1 rounded-xl border border-[#E8E2D8] px-3 py-2 text-xs outline-none focus:border-[#C9A96E]"
                      />
                      <button
                        type="button"
                        disabled={reviewingId === item.id}
                        onClick={() => void review(item, 'flag_listing')}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1A3353] px-3 py-2 text-xs font-semibold text-white hover:bg-[#25476f] disabled:opacity-50"
                      >
                        <Flag size={13} /> Flag listing
                      </button>
                      <button
                        type="button"
                        disabled={reviewingId === item.id}
                        onClick={() => void review(item, 'dismiss')}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E8E2D8] px-3 py-2 text-xs font-semibold text-[#526070] hover:bg-[#F5F0E8] disabled:opacity-50"
                      >
                        <XCircle size={13} /> Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
