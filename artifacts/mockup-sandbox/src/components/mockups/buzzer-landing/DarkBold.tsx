import React from "react";
import { ArrowRight, MessageSquare, ShoppingBag, Briefcase, Wrench, Home, Bus, Calendar, Menu, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DarkBold() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden font-outfit">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700;900&family=Space+Grotesk:wght@400;700&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
        .font-space { font-family: 'Space Grotesk', monospace; }
        .glow-hover { transition: all 0.3s ease; border: 1px solid rgba(255, 255, 255, 0.05); }
        .glow-hover:hover { border-color: #06b6d4; box-shadow: 0 0 20px rgba(6, 182, 212, 0.3); transform: translateY(-5px); }
        .text-gradient { background: linear-gradient(to right, #4f46e5, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .bg-gradient-dark { background: linear-gradient(135deg, #0a0a0f 0%, #11111a 100%); }
      `}} />

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-black tracking-tighter">BUZZER<span className="text-[#06b6d4]">.</span></div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#8b8b9d]">
            <a href="#" className="hover:text-white transition-colors">Features</a>
            <a href="#" className="hover:text-white transition-colors">Community</a>
            <a href="#" className="hover:text-white transition-colors">Testimonials</a>
            <Button className="bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-full px-6 py-2 h-10 font-bold border-none">
              Join Now
            </Button>
          </div>
          <button className="md:hidden text-white"><Menu /></button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4f46e5]/20 rounded-full blur-[120px] -z-10 mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#06b6d4]/20 rounded-full blur-[120px] -z-10 mix-blend-screen" />
        
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-black leading-[1.1] tracking-tight mb-8">
            OWN YOUR<br/>
            <span className="text-gradient">COMMUNITY.</span>
          </h1>
          <p className="text-xl md:text-2xl text-[#8b8b9d] max-w-2xl mx-auto mb-12 font-light">
            Connect with local jobs, epic marketplace deals, services, real estate, transport, and events—all in one high-voltage platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button className="bg-[#06b6d4] hover:bg-[#0891b2] text-[#0a0a0f] text-lg font-bold px-8 h-14 rounded-full w-full sm:w-auto">
              Get Started Free
            </Button>
            <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white text-lg font-bold px-8 h-14 rounded-full w-full sm:w-auto bg-transparent">
              Explore Features
            </Button>
          </div>
        </div>
      </section>

      {/* Image Strip */}
      <section className="py-10 border-y border-white/5 bg-[#12121a]/50">
        <div className="flex overflow-hidden gap-4 px-4 h-64 md:h-80">
          {[
            "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1000&auto=format&fit=crop"
          ].map((src, i) => (
            <div key={i} className="flex-1 min-w-[250px] relative rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-[#0a0a0f]/40 group-hover:bg-[#0a0a0f]/10 transition-colors z-10" />
              <img src={src} alt="Community" className="w-full h-full object-cover object-center" />
            </div>
          ))}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-20 border-b border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { value: "2.4M+", label: "Active Users" },
            { value: "$890M", label: "Marketplace Volume" },
            { value: "180K+", label: "Jobs Posted" },
            { value: "4.9★", label: "App Store Rating" }
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-4xl md:text-5xl font-space font-bold text-white mb-2">{stat.value}</div>
              <div className="text-[#8b8b9d] text-sm uppercase tracking-widest font-bold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <h2 className="text-4xl md:text-6xl font-black mb-6">EVERYTHING YOU NEED.</h2>
            <p className="text-xl text-[#8b8b9d]">Seven power-ups for your local life.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: MessageSquare, title: "Instant Messaging", desc: "End-to-end encrypted chats with everyone in your area." },
              { icon: ShoppingBag, title: "Marketplace", desc: "Buy and sell locally with zero hidden fees. Pure profit." },
              { icon: Briefcase, title: "Jobs", desc: "Find your next gig or hire top local talent in seconds." },
              { icon: Wrench, title: "Services", desc: "Plumbers, designers, tutors. Reviewed and ready." },
              { icon: Home, title: "Real Estate", desc: "Rent, buy, or lease spaces with high-def virtual tours." },
              { icon: Bus, title: "Transport", desc: "Rideshares and local transit schedules updated live." },
              { icon: Calendar, title: "Events", desc: "Underground gigs to massive festivals. Get on the list." }
            ].map((feat, i) => (
              <div key={i} className={`bg-[#12121a] p-10 rounded-3xl glow-hover ${i === 6 ? 'lg:col-span-3 lg:w-1/3 lg:mx-auto' : ''}`}>
                <div className="w-14 h-14 rounded-2xl bg-[#1e1e2d] flex items-center justify-center mb-6 text-[#06b6d4]">
                  <feat.icon size={28} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feat.title}</h3>
                <p className="text-[#8b8b9d] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-32 px-6 bg-[#12121a]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8 gap-2 text-[#06b6d4]">
            {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" />)}
          </div>
          <blockquote className="text-3xl md:text-5xl font-medium leading-tight mb-12">
            "Buzzer didn't just help me find an apartment and a job—it plugged me directly into the city's pulse. This is how the internet should feel."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#4f46e5]">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" alt="User" />
            </div>
            <div className="text-left">
              <div className="font-bold text-xl">Elena R.</div>
              <div className="text-[#8b8b9d]">Digital Nomad</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-dark z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[500px] bg-[#4f46e5]/30 rounded-full blur-[150px] z-0" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-black mb-8">READY TO RULE<br/>YOUR CITY?</h2>
          <p className="text-xl text-[#8b8b9d] mb-12">Join millions of users who are already tapped in.</p>
          <Button className="bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xl font-bold px-12 h-16 rounded-full w-full sm:w-auto shadow-[0_0_40px_rgba(79,70,229,0.5)]">
            Create Free Account <ArrowRight className="ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-black tracking-tighter">BUZZER<span className="text-[#06b6d4]">.</span></div>
          <div className="flex gap-6 text-[#8b8b9d] text-sm font-medium">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="text-[#8b8b9d] text-sm">
            © {new Date().getFullYear()} Buzzer Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
