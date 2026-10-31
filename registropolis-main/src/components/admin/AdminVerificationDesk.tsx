import React, { useState, useEffect, useCallback } from 'react';
import { 
  BadgeCheck, 
  FileText, 
  Check, 
  X, 
  ExternalLink, 
  AlertCircle, 
  Award, 
  Building2, 
  Wrench, 
  Car, 
  ShoppingBag,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { adminCRMAPI } from '@/services/apiService';

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  vertical: string;
  badgeTitle: string;
  documentType: string;
  documentNumber: string;
  documentImage: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export const AdminVerificationDesk: React.FC = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selectedReq, setSelectedReq] = useState<VerificationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchVerifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminCRMAPI.getVerifications();
      if (data.success) {
        const verificationRequests = (data.requests as VerificationRequest[] | undefined) || [];
        setRequests(verificationRequests);
        if (verificationRequests.length > 0 && !selectedReq) {
          setSelectedReq(verificationRequests[0]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load verification requests');
    } finally {
      setIsLoading(false);
    }
  }, [selectedReq]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const handleDecision = async (requestId: string, decision: 'approved' | 'rejected') => {
    try {
      const data = await adminCRMAPI.decideVerification({ requestId, decision, notes: reviewNotes });
      if (data.success) {
        toast.success(
          decision === 'approved' 
            ? 'Gold Verified Badge awarded to provider!' 
            : 'Verification application rejected with notes'
        );
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: decision, reviewNotes } : r));
        if (selectedReq?.id === requestId) {
          setSelectedReq(prev => prev ? { ...prev, status: decision, reviewNotes } : null);
        }
        setReviewNotes('');
      }
    } catch {
      toast.error('Failed to process verification decision');
    }
  };

  const getVerticalIcon = (vertical: string) => {
    switch (vertical) {
      case 'real-estate': return <Building2 size={16} className="text-[#C9A96E]" />;
      case 'service': return <Wrench size={16} className="text-blue-400" />;
      case 'transport': return <Car size={16} className="text-purple-400" />;
      default: return <ShoppingBag size={16} className="text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#162C48] border border-[#E8E2D8]/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#C9A96E]/20 text-[#C9A96E] flex items-center justify-center font-bold">
            <BadgeCheck size={26} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Verification requests</h3>
            <p className="text-xs text-slate-300">
              Review submitted documents and record an approval decision.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-[#0F1923] border border-slate-700 text-xs text-slate-200 rounded-xl font-mono">
            Pending: <strong className="text-[#C9A96E]">{requests.filter(r => r.status === 'pending').length}</strong>
          </span>
          <span className="px-3 py-1.5 bg-[#0F1923] border border-slate-700 text-xs text-slate-200 rounded-xl font-mono">
            Accredited: <strong className="text-emerald-400">{requests.filter(r => r.status === 'approved').length}</strong>
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400">Loading verification pipeline...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Applications Master List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 px-1">
              Accreditation Applications ({requests.length})
            </h4>
            <div className="space-y-2">
              {requests.map(req => {
                const isSelected = selectedReq?.id === req.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedReq(req)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1A3353] border-[#C9A96E] shadow-lg'
                        : 'bg-[#162C48] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getVerticalIcon(req.vertical)}
                        <span className="font-bold text-sm text-white">{req.userName}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'approved' 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : req.status === 'rejected'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#C9A96E] font-medium mb-1 truncate">
                      {req.badgeTitle}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Doc: {req.documentNumber}</span>
                      <span>{new Date(req.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Document Inspection & Decision Drawer (7 cols) */}
          <div className="lg:col-span-7">
            {selectedReq ? (
              <div className="bg-[#162C48] border border-[#E8E2D8]/20 rounded-2xl overflow-hidden shadow-xl p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-700/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white">{selectedReq.userName}</h3>
                      <span className="text-xs px-2 py-0.5 bg-[#C9A96E]/20 text-[#C9A96E] rounded-md font-mono font-bold capitalize">
                        {selectedReq.vertical}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">{selectedReq.userEmail}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Submitted</span>
                    <span className="text-xs font-semibold text-slate-200">
                      {new Date(selectedReq.submittedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Requested Badge Preview */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#0F1923] to-[#1A3353] border border-[#C9A96E]/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#C9A96E]/20 flex items-center justify-center text-[#C9A96E]">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <div className="text-xs uppercase font-bold tracking-wider text-[#C9A96E]">Badge to be awarded:</div>
                      <div className="text-sm font-bold text-white">{selectedReq.badgeTitle}</div>
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs text-slate-400">
                    <div>Document Registry:</div>
                    <strong className="text-slate-200">{selectedReq.documentNumber}</strong>
                  </div>
                </div>

                {/* Document Image Inspection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                      <FileText size={14} /> Uploaded Government / Trade Credential
                    </span>
                    <a 
                      href={selectedReq.documentImage} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[#C9A96E] hover:underline flex items-center gap-1"
                    >
                      Open Full Res <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="h-64 rounded-xl overflow-hidden bg-black/60 border border-slate-700 relative group">
                    <img 
                      src={selectedReq.documentImage} 
                      alt="Credential Proof" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                      <div className="text-xs text-slate-200 font-mono">
                        Request ID: {selectedReq.id}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auditor Review Notes */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Auditor Review Notes & Policy Verification Record
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter audit remarks or cadastral / state license verification notes..."
                    rows={2}
                    className="w-full bg-[#0F1923] border border-slate-700 text-slate-200 text-xs rounded-xl p-3 focus:border-[#C9A96E] outline-none transition-all"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-700/60">
                  <button
                    onClick={() => handleDecision(selectedReq.id, 'rejected')}
                    className="px-5 py-2.5 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <X size={15} /> Reject Credential
                  </button>
                  <button
                    onClick={() => handleDecision(selectedReq.id, 'approved')}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#C9A96E] to-[#b39358] text-[#0F1923] font-bold rounded-xl text-xs shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Award size={16} /> Grant Verified Gold Badge
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full py-32 text-center text-slate-400 bg-[#162C48] border border-slate-800 rounded-2xl flex flex-col items-center justify-center">
                <FileText size={36} className="text-slate-600 mb-2" />
                Select an accreditation application to inspect credentials.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
