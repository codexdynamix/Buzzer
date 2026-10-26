import React from "react";
import { MessageSquare, ShoppingBag, Briefcase, Wrench, Home, Car, Calendar, ArrowRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AiryMinimal() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-800 font-sans selection:bg-slate-200">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
        .text-muted { color: #64748b; }
        .border-delicate { border-color: #f1f5f9; }
        .bg-delicate { background-color: #f8fafc; }
        img { filter: grayscale(40%) contrast(90%); }
      `}} />

      {/* Navigation */}
      <nav className="px-6 py-8 md:px-12 flex justify-between items-center border-b border-delicate bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="font-outfit text-xl font-medium tracking-wide">Buzzer.</div>
        <div className="hidden md:flex space-x-12 text-sm text-slate-500 font-light">
          <a href="#" className="hover:text-slate-900 transition-colors">Platform</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Stories</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Manifesto</a>
        </div>
        <div className="flex items-center space-x-6">
          <a href="#" className="hidden md:block text-sm text-slate-500 font-light hover:text-slate-900 transition-colors">Log in</a>
          <button className="hidden md:block px-5 py-2 text-sm border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-600">
            Join Waitlist
          </button>
          <button className="md:hidden text-slate-500">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 md:py-40 md:px-12 max-w-5xl mx-auto flex flex-col items-center text-center">
        <h1 className="font-outfit text-5xl md:text-7xl font-light tracking-tight text-slate-900 mb-8 leading-tight">
          A quieter way to connect<br/>with your city.
        </h1>
        <p className="text-lg md:text-xl text-slate-500 font-light max-w-2xl mb-12 leading-relaxed">
          One minimal space for local jobs, quiet marketplaces, reliable services, and the people around you. No noise, just community.
        </p>
        <button className="group flex items-center space-x-3 text-slate-900 border-b border-slate-300 pb-1 hover:border-slate-900 transition-colors">
          <span className="text-sm tracking-wide uppercase">Explore the platform</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </section>

      {/* Image Strip */}
      <section className="w-full overflow-hidden flex space-x-4 px-4 pb-24 md:pb-40">
        <div className="w-1/3 aspect-[4/3] relative rounded-sm overflow-hidden">
          <img src="https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80&w=800" alt="Minimal interior" className="w-full h-full object-cover opacity-90" />
        </div>
        <div className="w-1/3 aspect-[4/3] relative rounded-sm overflow-hidden">
          <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800" alt="Quiet coffee shop" className="w-full h-full object-cover opacity-90" />
        </div>
        <div className="w-1/3 aspect-[4/3] relative rounded-sm overflow-hidden">
          <img src="https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=800" alt="Clean workspace" className="w-full h-full object-cover opacity-90" />
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-delicate bg-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8 text-center divide-x divide-transparent md:divide-delicate">
          <div className="flex flex-col items-center">
            <span className="font-outfit text-4xl text-slate-800 font-light mb-2">2.4M</span>
            <span className="text-xs tracking-wider text-slate-400 uppercase">Active users</span>
          </div>
          <div className="flex flex-col items-center border-l border-delicate md:border-none">
            <span className="font-outfit text-4xl text-slate-800 font-light mb-2">$890M</span>
            <span className="text-xs tracking-wider text-slate-400 uppercase">Volume</span>
          </div>
          <div className="flex flex-col items-center pt-8 md:pt-0 border-t border-delicate md:border-t-0 md:border-l">
            <span className="font-outfit text-4xl text-slate-800 font-light mb-2">180K</span>
            <span className="text-xs tracking-wider text-slate-400 uppercase">Local Jobs</span>
          </div>
          <div className="flex flex-col items-center pt-8 md:pt-0 border-t border-l border-delicate md:border-t-0">
            <span className="font-outfit text-4xl text-slate-800 font-light mb-2">4.9</span>
            <span className="text-xs tracking-wider text-slate-400 uppercase">Average Rating</span>
          </div>
        </div>
      </section>

      {/* Features Grid (List Style) */}
      <section className="py-24 md:py-40 max-w-4xl mx-auto px-6 md:px-12">
        <h2 className="font-outfit text-3xl md:text-4xl font-light text-slate-900 mb-16 text-center">Everything in its place.</h2>
        
        <div className="space-y-4">
          {[
            { icon: MessageSquare, name: "Instant Messaging", desc: "Connect without the noise. Clean, minimal threads." },
            { icon: ShoppingBag, name: "Marketplace", desc: "Curated local goods. Buy and sell with intent." },
            { icon: Briefcase, name: "Jobs", desc: "Opportunities in your area, presented simply." },
            { icon: Wrench, name: "Services", desc: "Trusted local professionals for what you need." },
            { icon: Home, name: "Real Estate", desc: "Spaces to live and work. No clutter." },
            { icon: Car, name: "Transport", desc: "Move around your city efficiently." },
            { icon: Calendar, name: "Events", desc: "Gatherings that matter, beautifully organized." }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-center py-6 border-b border-delicate hover:bg-white transition-colors group px-4 -mx-4 rounded-sm cursor-pointer">
              <div className="flex items-center w-full md:w-1/3 mb-4 md:mb-0">
                <feature.icon className="w-5 h-5 text-slate-300 mr-6 group-hover:text-slate-500 transition-colors" strokeWidth={1.5} />
                <h3 className="font-outfit text-lg font-light text-slate-700">{feature.name}</h3>
              </div>
              <div className="w-full md:w-2/3 flex justify-between items-center">
                <p className="text-slate-500 font-light text-sm">{feature.desc}</p>
                <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-slate-400 group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100 hidden md:block" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-24 md:py-40 bg-white border-y border-delicate text-center px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-slate-300 mb-8">
            <svg className="w-8 h-8 mx-auto opacity-50" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
          </div>
          <p className="font-outfit text-2xl md:text-3xl font-light text-slate-800 leading-relaxed mb-10">
            "It feels like walking into a well-designed room. Everything I need for my daily life is here, but none of the visual clutter."
          </p>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full overflow-hidden mb-4">
              <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200" alt="Sarah J." className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-medium text-slate-700">Sarah Jenkins</span>
            <span className="text-xs text-slate-400 font-light mt-1 uppercase tracking-wider">Independent Architect</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 md:py-48 px-6 text-center bg-[#fafafa]">
        <h2 className="font-outfit text-3xl md:text-4xl font-light text-slate-900 mb-8">Begin quietly.</h2>
        <p className="text-slate-500 font-light mb-12 max-w-md mx-auto">
          Join the waitlist to experience a calmer approach to local connection.
        </p>
        <button className="px-8 py-3 bg-white border border-slate-200 rounded-full hover:border-slate-400 hover:shadow-sm transition-all text-slate-700 font-light tracking-wide text-sm">
          Request Access
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-delicate bg-white pt-16 pb-8 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
          <div className="mb-12 md:mb-0">
            <div className="font-outfit text-xl font-medium tracking-wide mb-6">Buzzer.</div>
            <p className="text-sm text-slate-400 font-light">Minimal connection.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-sm">
            <div className="flex flex-col space-y-4">
              <span className="text-slate-800 font-medium mb-2">Platform</span>
              <a href="#" className="text-slate-500 hover:text-slate-900 font-light transition-colors">Manifesto</a>
              <a href="#" className="text-slate-500 hover:text-slate-900 font-light transition-colors">Features</a>
              <a href="#" className="text-slate-500 hover:text-slate-900 font-light transition-colors">Pricing</a>
            </div>
            <div className="flex flex-col space-y-4">
              <span className="text-slate-800 font-medium mb-2">Company</span>
              <a href="#" className="text-slate-500 hover:text-slate-900 font-light transition-colors">About</a>
              <a href="#" className="text-slate-500 hover:text-slate-900 font-light transition-colors">Journal</a>
              <a href="#" className="text-slate-500 hover:text-slate-900 font-light transition-colors">Careers</a>
            </div>
            <div className="flex flex-col space-y-4">
              <span className="text-slate-800 font-medium mb-2">Legal</span>
              <a href="#" className="text-slate-500 hover:text-slate-900 font-light transition-colors">Privacy</a>
              <a href="#" className="text-slate-500 hover:text-slate-900 font-light transition-colors">Terms</a>
            </div>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto pt-8 border-t border-delicate flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-slate-400 font-light mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Buzzer Platform. All rights reserved.
          </p>
          <div className="flex space-x-6 text-xs text-slate-400 font-light">
            <a href="#" className="hover:text-slate-900 transition-colors">Twitter</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Instagram</a>
            <a href="#" className="hover:text-slate-900 transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
