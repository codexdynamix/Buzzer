import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Send, CheckCircle2, Lock, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export type FooterModalType = 'terms' | 'privacy' | 'contact' | null;

interface SiteFooterModalsProps {
  activeModal: FooterModalType;
  onClose: () => void;
}

export default function SiteFooterModals({ activeModal, onClose }: SiteFooterModalsProps) {
  const { user } = useAuth();

  // Contact form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [category, setCategory] = useState<'general' | 'merchant' | 'bug' | 'safety'>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!activeModal) return null;

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !subject.trim() || !message.trim()) {
      toast.error('Please fill in your email, subject, and message.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not submit contact inquiry');
      }
      setSubmitted(true);
      toast.success('Your message was received! We will be in touch shortly.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#0F1923]/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#FAFAF7] border border-[#E8E2D8] shadow-2xl overflow-hidden"
        style={{ color: '#0F1923' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D8] bg-[#F5F2EC]">
          <div className="flex items-center gap-2.5">
            {activeModal === 'terms' && <FileText className="text-[#C9A96E]" size={20} />}
            {activeModal === 'privacy' && <Lock className="text-[#C9A96E]" size={20} />}
            {activeModal === 'contact' && <MessageSquare className="text-[#C9A96E]" size={20} />}
            <div>
              <h3 className="font-bold text-base tracking-tight" style={{ color: '#0F1923' }}>
                {activeModal === 'terms' && 'Terms of Service'}
                {activeModal === 'privacy' && 'Privacy Policy'}
                {activeModal === 'contact' && 'Contact Buzzer Support'}
              </h3>
              <p className="text-xs text-[#6E7A8A]">
                {activeModal === 'terms' && 'Community guidelines & marketplace policies'}
                {activeModal === 'privacy' && 'How Buzzer handles account, listing, and message data'}
                {activeModal === 'contact' && 'Send a question or report a problem'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6E7A8A] hover:text-[#0F1923] hover:bg-black/5 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm leading-relaxed space-y-4">
          {activeModal === 'terms' && (
            <div className="space-y-4 text-[#4A5568]">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-[#C9A96E]/30 text-xs text-[#0F1923]">
                <strong className="text-[#0F1923] font-semibold">Core Principle:</strong> Buzzer charges <strong>0% commission</strong> on peer-to-peer marketplace sales and services. We empower local commerce without taking a cut from neighborhood sellers.
              </div>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[#0F1923] text-sm">1. Community Conduct & Safe Trading</h4>
                <p>
                  Buzzer connects community members. Users agree to treat others respectfully, provide accurate listing descriptions, and take reasonable precautions when meeting or completing a transaction.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[#0F1923] text-sm">2. Prohibited Goods & Services</h4>
                <p>
                  Listings involving illegal goods or services, fraud, or other content prohibited by Buzzer policy are not allowed. Listings may be removed and accounts may be restricted when policy violations are found.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[#0F1923] text-sm">3. Merchant Storefronts & QR Codes</h4>
                <p>
                  Sellers are entitled to a custom storefront URL and printable QR code for their physical counters. Sellers represent that they have full rights to advertise the products, services, and brand assets displayed on their store.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[#0F1923] text-sm">4. Peer-to-Peer Transactions</h4>
                <p>
                  Buzzer helps users connect, but buyers and sellers arrange payment and delivery directly. Buzzer does not provide a buyer guarantee. Review listings carefully, meet safely, and use the in-app report option if you have a concern.
                </p>
              </section>

              <p className="text-xs text-[#9CA3AF] pt-2">
                For help, use the contact form in the app.
              </p>
            </div>
          )}

          {activeModal === 'privacy' && (
            <div className="space-y-4 text-[#4A5568]">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#1A3353]/10 border border-[#1A3353]/20 text-xs text-[#1A3353]">
                <ShieldCheck size={20} className="shrink-0 text-[#1A3353]" />
                <span>
                  <strong>Zero-Data-Sale Policy:</strong> We never sell your personal data, chat logs, search history, or location records to third-party ad networks or brokers.
                </span>
              </div>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[#0F1923] text-sm">1. Messages and In-App Communications</h4>
                <p>
                  Messages are sent through Buzzer and stored so participants can access their conversations. Messages are not end-to-end encrypted. Avoid sharing passwords, financial credentials, or other sensitive information in chat.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[#0F1923] text-sm">2. Account Credentials & Security</h4>
                <p>
                  Buzzer uses Supabase Authentication to manage sign-in credentials. Keep your password private and use a strong, unique password for your account.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[#0F1923] text-sm">3. Location & Geolocation</h4>
                <p>
                  Location data is used solely to present relevant city listings, neighborhood stories, and nearby service providers. We do not track your background GPS coordinates.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[#0F1923] text-sm">4. Your Rights (GDPR & CCPA Compliant)</h4>
                <p>
                  You retain full ownership of your listings, photos, and profile information. You can edit, export, or permanently delete your account and all associated data at any time from your Profile & Settings workspace.
                </p>
              </section>

              <p className="text-xs text-[#9CA3AF] pt-2">
                Privacy contact: privacy@buzzer.local.
              </p>
            </div>
          )}

          {activeModal === 'contact' && (
            <div>
              {submitted ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="font-bold text-lg text-[#0F1923]">Thank you for reaching out!</h4>
                  <p className="text-sm text-[#6E7A8A] max-w-sm mx-auto">
                    Your inquiry has been routed to our community operations team. A confirmation ticket has been logged and we will reply to <strong>{email}</strong> shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setSubject('');
                      setMessage('');
                      onClose();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#1A3353] text-white text-xs font-semibold hover:bg-[#142842] transition-colors mt-2"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitContact} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#0F1923] mb-1">Your Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#D1C9BC] bg-white focus:outline-none focus:border-[#C9A96E]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0F1923] mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#D1C9BC] bg-white focus:outline-none focus:border-[#C9A96E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F1923] mb-1">Inquiry Topic</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#D1C9BC] bg-white focus:outline-none focus:border-[#C9A96E]"
                    >
                      <option value="general">General Community Question</option>
                      <option value="merchant">Merchant Storefront & QR Verification</option>
                      <option value="safety">Trust & Safety / Report a Listing</option>
                      <option value="bug">Technical Issue or Feedback</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F1923] mb-1">Subject *</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="Brief summary of your question or issue"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#D1C9BC] bg-white focus:outline-none focus:border-[#C9A96E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F1923] mb-1">Message *</label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Please provide any relevant details so we can assist you quickly..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#D1C9BC] bg-white focus:outline-none focus:border-[#C9A96E] resize-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <p className="text-[11px] text-[#6E7A8A]">
                      Usually responds within 2–4 hours.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-medium rounded-lg border border-[#D1C9BC] text-[#6E7A8A] hover:bg-black/5"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-[#1A3353] text-white hover:bg-[#142842] transition-colors disabled:opacity-50"
                      >
                        {submitting ? 'Sending...' : 'Send Message'} <Send size={13} />
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
