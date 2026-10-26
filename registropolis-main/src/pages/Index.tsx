import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, ShoppingBag, Briefcase, Wrench, Home, Bus, Calendar, Menu, X, Star, Shield, Zap, Globe } from 'lucide-react';

const FEATURES = [
  { icon: MessageSquare, title: 'Encrypted Messaging', desc: 'Military-grade end-to-end encryption for every conversation. Privacy is not a feature — it is the foundation.', section: 'messages' },
  { icon: ShoppingBag, title: 'Marketplace', desc: 'Buy and sell locally with zero commission. Every transaction protected by our Buyer Guarantee.', section: 'marketplace' },
  { icon: Briefcase, title: 'Careers', desc: 'Curated opportunities from the world\'s most innovative companies and emerging local leaders.', section: 'jobs' },
  { icon: Wrench, title: 'Professional Services', desc: 'Verified, insured, and rated professionals. From architects to plumbers — all in one address book.', section: 'services' },
  { icon: Home, title: 'Real Estate', desc: 'Residential and commercial listings. Partner directly with licensed agents. No intermediaries.', section: 'real-estate' },
  { icon: Bus, title: 'Transport', desc: 'Premium vehicles and verified sellers. Every listing inspected and certified by our team.', section: 'transport' },
  { icon: Calendar, title: 'Events', desc: 'Curated cultural, professional, and community events. Discover what defines your city.', section: 'events' },
];

const STATS = [
  { value: '2.4M+', label: 'Active Members' },
  { value: '$890M', label: 'Transaction Volume' },
  { value: '180K+', label: 'Opportunities Posted' },
  { value: '4.9', label: 'Average Rating' },
];

const PILLARS = [
  { icon: Shield, title: 'Privacy First', desc: 'End-to-end encryption and zero-data-sale policy.' },
  { icon: Zap, title: 'Instant Access', desc: 'Real-time listings, messaging, and updates.' },
  { icon: Globe, title: 'Local Precision', desc: 'Hyperlocal intelligence for your exact community.' },
];

const IMAGES = [
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1000&auto=format&fit=crop',
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function Index() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ fontFamily: "'Inter', -apple-system, sans-serif", backgroundColor: '#FAFAF7', color: '#0F1923' }}
    >
      {/* ── Navigation ────────────────────────────────────────── */}
      <nav
        className="fixed top-0 w-full z-50 border-b"
        style={{ backgroundColor: 'rgba(250,250,247,0.96)', borderColor: '#E8E2D8', backdropFilter: 'blur(8px)' }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between" style={{ height: '68px' }}>
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-xl font-bold tracking-tight" style={{ color: '#0F1923', letterSpacing: '-0.04em' }}>BUZZER</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#C9A96E' }} />
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium" style={{ color: '#6E7A8A' }}>
            <button onClick={() => navigate('/dashboard')} className="hover:text-[#0F1923] transition-colors">Platform</button>
            <button onClick={() => navigate('/dashboard')} className="hover:text-[#0F1923] transition-colors">Community</button>
            <button onClick={() => navigate('/dashboard')} className="hover:text-[#0F1923] transition-colors">About</button>
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/auth?mode=signin&method=email')}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg border transition-all hover:border-[#1A3353] hover:text-[#1A3353]"
              style={{ borderColor: '#D1C9BC', color: '#4A5568', backgroundColor: 'transparent' }}
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-all"
              style={{ backgroundColor: '#1A3353', color: '#ffffff' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#142842'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3353'}
            >
              Sign Up Free
            </button>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMenuOpen(o => !o)} style={{ color: '#0F1923' }}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden px-6 pb-5 pt-2 flex flex-col gap-3 border-t" style={{ backgroundColor: '#FAFAF7', borderColor: '#E8E2D8' }}>
            <button onClick={() => { navigate('/dashboard'); setMenuOpen(false); }} className="text-left py-2 text-sm font-medium" style={{ color: '#6E7A8A' }}>Platform</button>
            <button onClick={() => { navigate('/dashboard'); setMenuOpen(false); }} className="text-left py-2 text-sm font-medium" style={{ color: '#6E7A8A' }}>Community</button>
            <button onClick={() => { navigate('/dashboard'); setMenuOpen(false); }} className="text-left py-2 text-sm font-medium" style={{ color: '#6E7A8A' }}>About</button>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { navigate('/auth?mode=signin&method=email'); setMenuOpen(false); }}
                className="flex-1 py-3 text-sm font-semibold rounded-lg border"
                style={{ borderColor: '#D1C9BC', color: '#4A5568' }}
              >
                Sign In
              </button>
              <button
                onClick={() => { navigate('/auth?mode=signup'); setMenuOpen(false); }}
                className="flex-1 py-3 text-sm font-semibold rounded-lg"
                style={{ backgroundColor: '#1A3353', color: '#ffffff' }}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="pt-44 pb-28 px-6 relative" style={{ borderBottom: '1px solid #E8E2D8' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fade(0)} className="mb-5">
            <span
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full"
              style={{ backgroundColor: '#F0EBE1', color: '#C9A96E', border: '1px solid #E8D9BC' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#C9A96E' }} />
              Community Platform
            </span>
          </motion.div>

          <motion.h1
            {...fade(0.1)}
            className="font-bold leading-[1.06] mb-8"
            style={{ fontSize: 'clamp(2.8rem, 7.5vw, 5.5rem)', letterSpacing: '-0.04em', color: '#0F1923' }}
          >
            The platform<br />
            your city{' '}
            <span style={{ color: '#C9A96E', fontStyle: 'italic', fontFamily: "'DM Serif Display', Georgia, serif" }}>
              deserves.
            </span>
          </motion.h1>

          <motion.p
            {...fade(0.2)}
            className="text-xl leading-relaxed max-w-2xl mb-12"
            style={{ color: '#6E7A8A', fontWeight: 400 }}
          >
            One address for messaging, marketplace, careers, services, real estate, transport, and events.
            Engineered for precision. Built for community.
          </motion.p>

          <motion.div {...fade(0.3)} className="flex flex-col sm:flex-row items-start gap-4">
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className="flex items-center gap-3 px-8 py-4 text-base font-semibold rounded-xl transition-all"
              style={{ backgroundColor: '#1A3353', color: '#ffffff' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#142842'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(26,51,83,0.25)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3353'; (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
            >
              Create Free Account <ArrowRight size={17} />
            </button>
            <button
              onClick={() => navigate('/auth?mode=signin&method=email')}
              className="flex items-center gap-3 px-8 py-4 text-base font-semibold rounded-xl transition-all"
              style={{ backgroundColor: 'transparent', color: '#0F1923', border: '1px solid #D1C9BC' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#C9A96E'; (e.currentTarget as HTMLElement).style.color = '#C9A96E'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#D1C9BC'; (e.currentTarget as HTMLElement).style.color = '#0F1923'; }}
            >
              Sign In
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: '#F5F2EC', borderBottom: '1px solid #E8E2D8' }}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
          {STATS.map((s, i) => (
            <motion.div key={s.label} {...fade(0.05 * i)} className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-1.5" style={{ color: '#0F1923', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
                {s.value}
              </div>
              <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6E7A8A' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Photo Strip ───────────────────────────────────────── */}
      <section className="py-14" style={{ borderBottom: '1px solid #E8E2D8' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-3" style={{ height: 'clamp(180px,22vw,300px)' }}>
            {IMAGES.map((src, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden group" style={{ border: '1px solid #E8E2D8' }}>
                <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 transition-opacity duration-300" style={{ backgroundColor: 'rgba(15,25,35,0.08)' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pillars ───────────────────────────────────────────── */}
      <section className="py-20" style={{ backgroundColor: '#FAFAF7', borderBottom: '1px solid #E8E2D8' }}>
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div key={p.title} {...fade(0.08 * i)} className="flex gap-5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#F0EBE1', color: '#C9A96E' }}>
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <div>
                  <h4 className="font-semibold mb-1.5" style={{ color: '#0F1923', letterSpacing: '-0.02em' }}>{p.title}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: '#6E7A8A' }}>{p.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="py-28 px-6" style={{ backgroundColor: '#F5F2EC', borderBottom: '1px solid #E8E2D8' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div {...fade(0)} className="mb-16">
            <div className="w-8 h-0.5 mb-6" style={{ backgroundColor: '#C9A96E' }} />
            <h2 className="font-bold mb-4" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', letterSpacing: '-0.035em', color: '#0F1923' }}>
              Everything your community needs.
            </h2>
            <p className="text-base" style={{ color: '#6E7A8A', maxWidth: '38ch' }}>Seven integrated modules. One seamless experience.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.section}
                  {...fade(0.05 * i)}
                  onClick={() => navigate(`/dashboard/${feat.section}`)}
                  className={`p-8 rounded-2xl cursor-pointer group transition-all duration-250 ${i === 6 ? 'lg:col-span-3 lg:max-w-md' : ''}`}
                  style={{ backgroundColor: '#ffffff', border: '1px solid #E8E2D8' }}
                  whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(15,25,35,0.09)', borderColor: '#C9A96E' }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: '#F0EBE1', color: '#C9A96E' }}>
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <h3 className="font-semibold mb-3 text-lg" style={{ color: '#0F1923', letterSpacing: '-0.02em' }}>{feat.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6E7A8A' }}>{feat.desc}</p>
                  <div className="flex items-center gap-2 mt-6 text-sm font-semibold transition-all duration-200 opacity-0 group-hover:opacity-100" style={{ color: '#C9A96E' }}>
                    Explore <ArrowRight size={14} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonial ───────────────────────────────────────── */}
      <section className="py-28 px-6" style={{ backgroundColor: '#0F1923' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8 gap-1.5" style={{ color: '#C9A96E' }}>
            {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" size={18} />)}
          </div>
          <blockquote
            className="font-medium leading-tight mb-12"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2.8rem)', letterSpacing: '-0.03em', color: '#F5F2EC', fontFamily: "'DM Serif Display', Georgia, serif", fontStyle: 'italic' }}
          >
            "Buzzer didn't just help me find an apartment and a job — it plugged me directly into the city's pulse. This is how the internet should feel."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden" style={{ border: '2px solid #C9A96E' }}>
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" alt="Elena R." className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <div className="font-semibold" style={{ color: '#F5F2EC', letterSpacing: '-0.01em' }}>Elena R.</div>
              <div className="text-sm" style={{ color: '#6E7A8A' }}>Digital Nomad · New York</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-28 px-6" style={{ backgroundColor: '#FAFAF7', borderTop: '1px solid #E8E2D8' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-8 h-0.5 mx-auto mb-8" style={{ backgroundColor: '#C9A96E' }} />
          <h2 className="font-bold mb-6" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.04em', color: '#0F1923' }}>
            Ready to join your community?
          </h2>
          <p className="text-lg mb-12" style={{ color: '#6E7A8A', maxWidth: '40ch', margin: '0 auto 3rem' }}>
            Millions of users are already connected. Free to join, forever.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className="flex items-center gap-3 px-9 py-4 text-base font-semibold rounded-xl transition-all"
              style={{ backgroundColor: '#C9A96E', color: '#0F1923' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ba965c'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(201,169,110,0.35)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#C9A96E'; (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.transform = ''; }}
            >
              Create Free Account <ArrowRight size={17} />
            </button>
            <button
              onClick={() => navigate('/auth?mode=signin&method=email')}
              className="flex items-center gap-3 px-9 py-4 text-base font-semibold rounded-xl border transition-all"
              style={{ borderColor: '#D1C9BC', color: '#0F1923', backgroundColor: 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#C9A96E'; (e.currentTarget as HTMLElement).style.color = '#C9A96E'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#D1C9BC'; (e.currentTarget as HTMLElement).style.color = '#0F1923'; }}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="py-10 px-6" style={{ backgroundColor: '#0F1923', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: '#F5F2EC', letterSpacing: '-0.04em' }}>BUZZER</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#C9A96E' }} />
          </div>
          <div className="flex gap-7 text-sm font-medium" style={{ color: '#6E7A8A' }}>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="text-sm" style={{ color: '#6E7A8A' }}>© {new Date().getFullYear()} Buzzer Inc.</div>
        </div>
      </footer>
    </div>
  );
}
