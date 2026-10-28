import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, ArrowDownRight as ArrowDownRightIcon, MessageSquare, ShoppingBag, Briefcase, Wrench, Home, Bus, Calendar, Menu, X, Star, Shield, Zap, Globe, Play, Megaphone, Sparkles, Coffee, Heart, Compass, MapPin } from 'lucide-react';
import './Index.css';

const HomeSection = React.lazy(() => import('@/components/home/HomeSection'));

const FEATURES = [
  { icon: MessageSquare, title: 'Encrypted Messaging', desc: 'Military-grade end-to-end encryption for every conversation. Privacy is not a feature — it is the foundation.', section: 'messages' },
  { icon: Play, title: 'Community Reels', desc: 'Discover short videos, creators, and community stories from around your city.', section: 'reels' },
  { icon: ShoppingBag, title: 'Marketplace', desc: 'Buy and sell locally with zero commission. Every transaction protected by our Buyer Guarantee.', section: 'marketplace' },
  { icon: Briefcase, title: 'Careers', desc: 'Curated opportunities from the world\'s most innovative companies and emerging local leaders.', section: 'jobs' },
  { icon: Wrench, title: 'Professional Services', desc: 'Verified, insured, and rated professionals. From architects to plumbers — all in one address book.', section: 'services' },
  { icon: Home, title: 'Real Estate', desc: 'Residential and commercial listings. Partner directly with licensed agents. No intermediaries.', section: 'real-estate' },
  { icon: Bus, title: 'Transport', desc: 'Premium vehicles and verified sellers. Every listing inspected and certified by our team.', section: 'transport' },
  { icon: Calendar, title: 'Events', desc: 'Curated cultural, professional, and community events. Discover what defines your city.', section: 'events' },
  { icon: Megaphone, title: 'Businesses & Advertisements', desc: 'Browse local businesses and all sponsored community advertisements.', section: 'business?tab=ads' },
];

const PILLARS = [
  { icon: Shield, title: 'Privacy First', desc: 'End-to-end encryption and zero-data-sale policy.' },
  { icon: Zap, title: 'Instant Access', desc: 'Real-time listings, messaging, and updates.' },
  { icon: Globe, title: 'Local Precision', desc: 'Hyperlocal intelligence for your exact community.' },
];

const IMAGES = [
  'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=900&auto=format&fit=crop',
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export default function Index() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div
      className="landing-page min-h-screen overflow-x-hidden"
      style={{ backgroundColor: '#FAFAF7', color: '#0F1923' }}
    >
      {/* ── Navigation ────────────────────────────────────────── */}
      <nav
        className="landing-nav fixed top-0 w-full z-50 border-b"
        style={{ backgroundColor: '#FAFAF7', borderColor: '#E8E2D8' }}
      >
        <div className="landing-nav-inner max-w-7xl mx-auto px-6 flex items-center justify-between" style={{ height: '68px' }}>
          {/* Logo */}
          <button type="button" className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')} aria-label="Buzzer home">
            <span className="text-xl font-bold tracking-tight" style={{ color: '#0F1923', letterSpacing: '-0.04em' }}>BUZZER</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#C9A96E' }} />
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium" style={{ color: '#6E7A8A' }}>
            <button onClick={() => navigate('/dashboard/home')} className="hover:text-[#0F1923] transition-colors">Browse</button>
            <button onClick={() => navigate('/dashboard/business?tab=ads')} className="hover:text-[#0F1923] transition-colors">Advertisements</button>
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#0F1923] transition-colors">About</button>
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
          <button className="landing-menu-button md:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)} style={{ color: '#0F1923' }}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden px-6 pb-5 pt-2 flex flex-col gap-3 border-t" style={{ backgroundColor: '#FAFAF7', borderColor: '#E8E2D8' }}>
            <button onClick={() => { navigate('/dashboard/home'); setMenuOpen(false); }} className="text-left py-2 text-sm font-medium" style={{ color: '#6E7A8A' }}>Browse</button>
            <button onClick={() => { navigate('/dashboard/business?tab=ads'); setMenuOpen(false); }} className="text-left py-2 text-sm font-medium" style={{ color: '#6E7A8A' }}>Advertisements</button>
            <button onClick={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false); }} className="text-left py-2 text-sm font-medium" style={{ color: '#6E7A8A' }}>About</button>
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
      <section className="landing-hero px-6 relative" style={{ borderBottom: '1px solid #E8E2D8' }}>
        <div className="landing-hero-inner max-w-7xl mx-auto">
          <div className="landing-hero-copy">
          <motion.div {...fade(0)} className="mb-6">
            <span
              className="landing-eyebrow inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full"
            >
              <Sparkles size={14} strokeWidth={2} />
              Your city, closer
            </span>
          </motion.div>

          <motion.h1
            {...fade(0.1)}
            className="landing-hero-title font-bold leading-[1.06] mb-6"
          >
            Good things<br />happen <span>around here.</span>
          </motion.h1>

          <motion.p
            {...fade(0.2)}
            className="landing-hero-description text-lg leading-relaxed max-w-2xl mb-9"
          >
            Find your people, your next place, and the little things that make a city feel like yours — all in one place.
          </motion.p>

          <motion.div {...fade(0.3)} className="landing-hero-actions flex flex-col sm:flex-row items-start gap-3">
            <button
              onClick={() => navigate('/dashboard/home')}
              className="landing-button landing-button-primary flex items-center gap-3 px-7 py-4 text-base font-semibold rounded-xl transition-all"
            >
              Explore your city <ArrowRight size={17} />
            </button>
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className="landing-button landing-button-secondary flex items-center gap-3 px-7 py-4 text-base font-semibold rounded-xl transition-all"
            >
              Join for free <ArrowUpRight size={17} />
            </button>
          </motion.div>
          <div className="landing-hero-note"><span className="landing-live-dot" /> A little more local. A lot more connected.</div>
          </div>

          <motion.div {...fade(0.18)} className="landing-visual" aria-label="Scenes from a connected neighborhood">
            <div className="landing-visual-main">
              <img src={IMAGES[0]} alt="City neighborhood at golden hour" />
              <div className="landing-visual-label"><MapPin size={14} /> LIFE, AROUND THE CORNER</div>
              <div className="landing-visual-caption"><span>More than a place.</span><strong>Your place.</strong></div>
            </div>
            <motion.div className="landing-visual-tile landing-visual-cafe" animate={reduceMotion ? undefined : { y: [0, -7, 0] }} transition={{ duration: 5, repeat: reduceMotion ? 0 : Infinity, ease: 'easeInOut' }}>
              <img src={IMAGES[1]} alt="Neighbors sharing a meal at a local cafe" />
              <span><Coffee size={14} /> FIND YOUR NEW FAVORITE</span>
            </motion.div>
            <motion.div className="landing-visual-tile landing-visual-people" animate={reduceMotion ? undefined : { y: [0, 7, 0] }} transition={{ duration: 6, repeat: reduceMotion ? 0 : Infinity, ease: 'easeInOut' }}>
              <img src={IMAGES[2]} alt="Friends gathering in their community" />
              <span><Heart size={14} /> GOOD PEOPLE, CLOSE BY</span>
            </motion.div>
            <div className="landing-visual-stamp"><span>YOUR</span><strong>CITY</strong><span>IS CALLING</span><ArrowUpRight size={17} /></div>
          </motion.div>
        </div>
      </section>

      <section className="landing-discovery" aria-label="Explore Buzzer">
        <div className="landing-discovery-inner max-w-7xl mx-auto">
          <span className="landing-discovery-label"><Compass size={15} /> A GOOD PLACE TO START</span>
          <div className="landing-discovery-links">
            {[
              { label: 'Find a place', icon: Home, path: '/dashboard/real-estate' },
              { label: 'See your community', icon: MessageSquare, path: '/dashboard/reels' },
              { label: 'Shop local', icon: ShoppingBag, path: '/dashboard/marketplace' },
              { label: 'What’s happening', icon: Calendar, path: '/dashboard/events' },
            ].map(({ label, icon: Icon, path }, index) => (
              <motion.button
                type="button"
                key={label}
                onClick={() => navigate(path)}
                className="landing-discovery-link"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.35, delay: index * 0.07 }}
              >
                <span><Icon size={17} /></span>{label}<ArrowUpRight size={14} />
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <section id="browse-categories" className="landing-browse py-16 px-6" style={{ backgroundColor: '#FAFAF7', borderBottom: '1px solid #E8E2D8' }}>
        <div className="max-w-7xl mx-auto">
          <div className="landing-section-heading mb-8">
            <span className="landing-section-kicker">THE NEIGHBORHOOD BOARD</span>
            <div className="landing-section-heading-row">
              <div>
                <h2 className="font-bold mb-2">A little bit of everything.<br /><em>All right around you.</em></h2>
                <p className="text-sm">Browse public listings and local ads. Sign in when you’re ready to connect or take action.</p>
              </div>
              <button className="landing-text-link" onClick={() => navigate('/dashboard/home')}>Explore the board <ArrowRight size={16} /></button>
            </div>
          </div>
          <React.Suspense fallback={<div className="py-12 text-center text-sm text-slate-500">Loading community listings…</div>}>
            <HomeSection />
          </React.Suspense>
        </div>
      </section>

      <section className="landing-manifesto">
        <div className="landing-manifesto-inner max-w-7xl mx-auto">
          <div>
            <span className="landing-manifesto-kicker"><Sparkles size={14} /> MADE OF THE LITTLE THINGS</span>
            <h2>A familiar face.<br />A new <em>favorite place.</em></h2>
          </div>
          <div className="landing-manifesto-aside">
            <p>The best parts of a city aren’t found in a guidebook. They’re shared by the people who call it home.</p>
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>See what brings us together <ArrowRight size={16} /></button>
          </div>
        </div>
      </section>

      {/* ── Photo Strip ───────────────────────────────────────── */}
      <section className="landing-photo-section py-14" style={{ borderBottom: '1px solid #E8E2D8' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="landing-photo-heading">
            <span>THE CITY, IN GOOD COMPANY</span>
            <span>Little moments. Shared places. <ArrowDownRightIcon /></span>
          </div>
          <div className="landing-photo-grid">
            {IMAGES.map((src, i) => (
              <motion.div key={i} className={`landing-photo landing-photo-${i + 1}`} whileHover={{ y: -5 }} transition={{ duration: 0.25 }}>
                <img src={src} alt={['A lively city street at sunset', 'A neighborhood cafe ready for guests', 'Friends getting together nearby', 'A community celebrating together'][i]} loading="lazy" />
                <span>{['Meet me out there.', 'Your new usual.', 'Better, together.', 'Make a night of it.'][i]}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pillars ───────────────────────────────────────────── */}
      <section className="landing-pillars py-20" style={{ backgroundColor: '#FAFAF7', borderBottom: '1px solid #E8E2D8' }}>
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div key={p.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.45, delay: 0.08 * i }} className="flex gap-5">
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
      <section id="features" className="landing-features py-28 px-6" style={{ backgroundColor: '#F5F2EC', borderBottom: '1px solid #E8E2D8' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div {...fade(0)} className="mb-16">
            <div className="w-8 h-0.5 mb-6" style={{ backgroundColor: '#C9A96E' }} />
            <h2 className="font-bold mb-4" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', letterSpacing: '-0.035em', color: '#0F1923' }}>
              Everything your community needs.
            </h2>
            <p className="text-base" style={{ color: '#6E7A8A', maxWidth: '38ch' }}>Explore every public section. Sign in when you are ready to connect or take action.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.button
                  type="button"
                  key={feat.section}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
                  onClick={() => navigate(`/dashboard/${feat.section}`)}
                  className={`landing-feature-card p-7 rounded-2xl cursor-pointer group transition-all duration-250 text-left ${i === 6 ? 'lg:col-span-3 lg:max-w-md' : ''}`}
                  style={{ backgroundColor: '#ffffff', border: '1px solid #E8E2D8' }}
                  whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(15,25,35,0.09)', borderColor: '#C9A96E' }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: '#F0EBE1', color: '#C9A96E' }}>
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <h3 className="font-semibold mb-3 text-lg" style={{ color: '#0F1923', letterSpacing: '-0.02em' }}>{feat.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6E7A8A' }}>{feat.desc}</p>
                  <div className="landing-feature-link flex items-center gap-2 mt-6 text-sm font-semibold transition-all duration-200" style={{ color: '#C9A96E' }}>
                    Explore <ArrowRight size={14} />
                  </div>
                </motion.button>
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
