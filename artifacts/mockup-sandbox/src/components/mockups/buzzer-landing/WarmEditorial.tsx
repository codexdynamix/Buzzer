import React from "react";
import { ArrowRight, MessageSquare, ShoppingBag, Briefcase, Wrench, Home, Bus, Calendar, Star, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import "./_group.css";

export function WarmEditorial() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--warm-bg)', color: 'var(--warm-text)', fontFamily: 'var(--font-sans)' }}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b transition-all duration-300 backdrop-blur-md bg-white/70" style={{ borderColor: 'var(--warm-border)' }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: 'var(--warm-primary)', fontFamily: 'var(--font-editorial)' }}>B</div>
            <span className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-editorial)', color: 'var(--warm-primary)' }}>Buzzer</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: 'var(--warm-muted)' }}>
            <a href="#" className="hover:text-black transition-colors">Features</a>
            <a href="#" className="hover:text-black transition-colors">Community</a>
            <a href="#" className="hover:text-black transition-colors">Stories</a>
            <a href="#" className="hover:text-black transition-colors">About</a>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="hover:bg-transparent font-medium" style={{ color: 'var(--warm-text)' }}>Log in</Button>
            <Button className="rounded-full px-6 font-medium text-white transition-opacity hover:opacity-90" style={{ backgroundColor: 'var(--warm-primary)' }}>
              Join the neighborhood
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-medium leading-[1.1] mb-8" style={{ fontFamily: 'var(--font-editorial)' }}>
            The pulse of your <br className="hidden md:block" />
            <span className="italic text-opacity-80" style={{ color: 'var(--warm-primary)' }}>local community.</span>
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed mb-12" style={{ color: 'var(--warm-muted)' }}>
            Connect with people, discover local jobs, uncover marketplace treasures, and find the services that make your neighborhood feel like home.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button className="rounded-full px-8 py-6 text-lg font-medium text-white w-full sm:w-auto" style={{ backgroundColor: 'var(--warm-primary)' }}>
              Explore your city
            </Button>
            <Button variant="outline" className="rounded-full px-8 py-6 text-lg font-medium w-full sm:w-auto border-2 hover:bg-black/5" style={{ borderColor: 'var(--warm-border)', color: 'var(--warm-text)' }}>
              See how it works
            </Button>
          </div>
        </div>
      </section>

      {/* Image Strip */}
      <section className="py-12 overflow-hidden">
        <div className="flex gap-6 px-6 md:px-12 md:justify-center overflow-x-auto pb-8 snap-x">
          <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800&h=1000" alt="Cafe" className="w-64 h-80 object-cover rounded-2xl shadow-lg shrink-0 snap-center" />
          <img src="https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=800&h=1000" alt="Market" className="w-64 h-96 object-cover rounded-2xl shadow-lg shrink-0 snap-center -mt-8" />
          <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800&h=1000" alt="Community" className="w-64 h-80 object-cover rounded-2xl shadow-lg shrink-0 snap-center" />
          <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=800&h=1000" alt="Local team" className="w-64 h-96 object-cover rounded-2xl shadow-lg shrink-0 snap-center -mt-8 hidden md:block" />
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-16 border-y" style={{ borderColor: 'var(--warm-border)', backgroundColor: 'var(--warm-surface)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-solid" style={{ borderColor: 'var(--warm-border)' }}>
            <div className="text-center md:px-8">
              <p className="text-4xl font-semibold mb-2" style={{ fontFamily: 'var(--font-editorial)' }}>2.4M+</p>
              <p className="text-sm uppercase tracking-widest font-medium" style={{ color: 'var(--warm-muted)' }}>Active Users</p>
            </div>
            <div className="text-center md:px-8 border-l md:border-l-0" style={{ borderColor: 'var(--warm-border)' }}>
              <p className="text-4xl font-semibold mb-2" style={{ fontFamily: 'var(--font-editorial)' }}>$890M</p>
              <p className="text-sm uppercase tracking-widest font-medium" style={{ color: 'var(--warm-muted)' }}>Local Volume</p>
            </div>
            <div className="text-center md:px-8 mt-8 md:mt-0 pt-8 md:pt-0 border-t md:border-t-0 border-solid" style={{ borderColor: 'var(--warm-border)' }}>
              <p className="text-4xl font-semibold mb-2" style={{ fontFamily: 'var(--font-editorial)' }}>180K+</p>
              <p className="text-sm uppercase tracking-widest font-medium" style={{ color: 'var(--warm-muted)' }}>Jobs Filled</p>
            </div>
            <div className="text-center md:px-8 mt-8 md:mt-0 pt-8 md:pt-0 border-t md:border-t-0 border-l md:border-l-0 border-solid" style={{ borderColor: 'var(--warm-border)' }}>
              <div className="flex items-center justify-center gap-1 mb-2">
                <p className="text-4xl font-semibold" style={{ fontFamily: 'var(--font-editorial)' }}>4.9</p>
                <Star className="w-6 h-6 fill-current" style={{ color: 'var(--warm-accent)' }} />
              </div>
              <p className="text-sm uppercase tracking-widest font-medium" style={{ color: 'var(--warm-muted)' }}>Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-medium mb-6" style={{ fontFamily: 'var(--font-editorial)' }}>Everything you need, right around the corner.</h2>
            <p className="text-lg" style={{ color: 'var(--warm-muted)' }}>Seven distinct spaces designed to bring the fragmented pieces of city life into one cohesive, beautiful platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[
              { title: "Instant Messaging", icon: MessageSquare, desc: "Connect with neighbors, businesses, and groups securely." },
              { title: "Marketplace", icon: ShoppingBag, desc: "Buy, sell, and trade with people in your zip code." },
              { title: "Local Jobs", icon: Briefcase, desc: "Find work or hire talent without leaving the neighborhood." },
              { title: "Services", icon: Wrench, desc: "From plumbers to tutors, find recommended professionals." },
              { title: "Real Estate", icon: Home, desc: "Discover apartments, homes, and commercial spaces." },
              { title: "Transport", icon: Bus, desc: "Coordinate rideshares, moving vans, and local logistics." },
              { title: "Events", icon: Calendar, desc: "Never miss a block party, gallery opening, or local concert." }
            ].map((feature, idx) => (
              <div key={idx} className="p-8 rounded-3xl transition-transform hover:-translate-y-1 cursor-pointer group" style={{ backgroundColor: 'var(--warm-surface)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform" style={{ backgroundColor: 'white', color: 'var(--warm-primary)' }}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: 'var(--font-editorial)' }}>{feature.title}</h3>
                <p className="leading-relaxed text-sm" style={{ color: 'var(--warm-muted)' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-24 px-6 border-y" style={{ borderColor: 'var(--warm-border)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <Star className="w-12 h-12 mx-auto mb-8 opacity-20" />
          <blockquote className="text-3xl md:text-5xl leading-tight font-medium mb-12" style={{ fontFamily: 'var(--font-editorial)' }}>
            "Buzzer didn't just digitize our neighborhood—it revived it. I've hired staff, sold furniture, and met my closest friends here."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200&h=200" alt="Sarah" className="w-14 h-14 rounded-full object-cover shadow-sm" />
            <div className="text-left">
              <p className="font-semibold text-lg" style={{ fontFamily: 'var(--font-editorial)' }}>Sarah Jenkins</p>
              <p className="text-sm" style={{ color: 'var(--warm-muted)' }}>Cafe Owner, Brooklyn</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #D98859 0%, #8C4B33 100%)', color: 'white' }}>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-medium mb-6" style={{ fontFamily: 'var(--font-editorial)' }}>Ready to find your place?</h2>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
              Join millions of others who are building stronger, more connected communities every single day.
            </p>
            <Button className="rounded-full px-10 py-7 text-lg font-medium bg-white text-black hover:bg-white/90">
              Create your account <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-20 pb-10 px-6 border-t" style={{ borderColor: 'var(--warm-border)', backgroundColor: 'var(--warm-bg)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
            <div className="col-span-2 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: 'var(--warm-primary)', fontFamily: 'var(--font-editorial)' }}>B</div>
                <span className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-editorial)', color: 'var(--warm-primary)' }}>Buzzer</span>
              </div>
              <p className="max-w-sm mb-6 text-sm" style={{ color: 'var(--warm-muted)' }}>
                The warm, editorial approach to local community. Elevating the way neighborhoods connect, trade, and thrive.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6" style={{ fontFamily: 'var(--font-editorial)' }}>Platform</h4>
              <ul className="space-y-4 text-sm" style={{ color: 'var(--warm-muted)' }}>
                <li><a href="#" className="hover:text-black">Marketplace</a></li>
                <li><a href="#" className="hover:text-black">Jobs</a></li>
                <li><a href="#" className="hover:text-black">Services</a></li>
                <li><a href="#" className="hover:text-black">Real Estate</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6" style={{ fontFamily: 'var(--font-editorial)' }}>Company</h4>
              <ul className="space-y-4 text-sm" style={{ color: 'var(--warm-muted)' }}>
                <li><a href="#" className="hover:text-black">About Us</a></li>
                <li><a href="#" className="hover:text-black">Careers</a></li>
                <li><a href="#" className="hover:text-black">Press</a></li>
                <li><a href="#" className="hover:text-black">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6" style={{ fontFamily: 'var(--font-editorial)' }}>Legal</h4>
              <ul className="space-y-4 text-sm" style={{ color: 'var(--warm-muted)' }}>
                <li><a href="#" className="hover:text-black">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-black">Terms of Service</a></li>
                <li><a href="#" className="hover:text-black">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-sm" style={{ borderColor: 'var(--warm-border)', color: 'var(--warm-muted)' }}>
            <p>© {new Date().getFullYear()} Buzzer Technologies Inc.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-black">Twitter</a>
              <a href="#" className="hover:text-black">Instagram</a>
              <a href="#" className="hover:text-black">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
