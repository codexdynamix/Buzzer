import React, { useState } from "react";
import { 
  MessageCircle, 
  ShoppingBag, 
  Briefcase, 
  Wrench, 
  Building2, 
  Truck, 
  Calendar, 
  Settings, 
  User, 
  Search,
  MessageSquare,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { id: "Messages", icon: MessageCircle, label: "Messages", badge: "5" },
  { id: "Marketplace", icon: ShoppingBag, label: "Market", badge: null },
  { id: "Jobs", icon: Briefcase, label: "Jobs", badge: null },
  { id: "Services", icon: Wrench, label: "Services", badge: null },
  { id: "RealEstate", icon: Building2, label: "Property", badge: null },
  { id: "Transport", icon: Truck, label: "Logistics", badge: null },
  { id: "Events", icon: Calendar, label: "Events", badge: null },
];

const contacts = [
  { 
    id: 1, 
    name: "Alex Johnson", 
    category: "MARKETPLACE", 
    categoryColor: "rgba(147,51,234,0.35)", 
    categoryTextColor: "#d8b4fe",
    unread: 3,
    lastMsg: "Is the camera still available?",
    time: "12:45 PM"
  },
  { 
    id: 2, 
    name: "Tasty Bites", 
    category: "FOOD", 
    categoryColor: "rgba(249,115,22,0.35)", 
    categoryTextColor: "#fdba74",
    unread: 0,
    lastMsg: "Your order is being prepared",
    time: "11:30 AM"
  },
  { 
    id: 3, 
    name: "Michael K. Driver", 
    category: "TAXI", 
    categoryColor: "rgba(34,197,94,0.35)", 
    categoryTextColor: "#86efac",
    unread: 0,
    lastMsg: "I've arrived at the pickup point",
    time: "Yesterday"
  },
  { 
    id: 4, 
    name: "Sarah Miller", 
    category: "MARKETPLACE", 
    categoryColor: "rgba(147,51,234,0.35)", 
    categoryTextColor: "#d8b4fe",
    unread: 0,
    lastMsg: "Thanks for the quick response!",
    time: "Oct 24"
  },
];

export function BottomTabBar() {
  const [activeTab, setActiveTab] = useState("Messages");

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0d1117] text-[#f0f6fc] font-sans">
      {/* Top Header */}
      <header className="h-14 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-1">
          <span className="text-xl font-bold tracking-tighter text-white">BUZZER<span className="text-[#06b6d4]">.</span></span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#30363d]">
            <Search className="w-5 h-5" />
          </Button>
          <div className="relative">
            <Avatar className="w-8 h-8 border border-[#30363d]">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-[#161b22] rounded-full"></div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-hidden flex relative pb-[80px]">
        {/* Messages Sidebar */}
        <aside className="w-[320px] bg-[#161b22] border-r border-[#30363d] flex flex-col hidden md:flex">
          <div className="p-4 border-b border-[#30363d]">
            <h2 className="text-lg font-semibold text-white">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.map((contact) => (
              <div 
                key={contact.id} 
                className="p-4 flex items-start gap-3 hover:bg-[#21262d] cursor-pointer border-b border-[#30363d]/50 transition-colors group"
              >
                <div className="relative shrink-0">
                  <Avatar className="w-12 h-12 border border-[#30363d]">
                    <AvatarFallback className="bg-[#30363d] text-[#8b949e]">{contact.name[0]}</AvatarFallback>
                  </Avatar>
                  {contact.unread > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#1d4ed8] rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#161b22]">
                      {contact.unread}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-medium text-[#f0f6fc] truncate">{contact.name}</span>
                    <span className="text-[10px] text-[#8b949e]">{contact.time}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: contact.categoryColor, color: contact.categoryTextColor }}
                    >
                      {contact.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#8b949e] truncate">{contact.lastMsg}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Empty State / Message View */}
        <section className="flex-1 bg-[#0d1117] flex flex-col items-center justify-center text-center p-8">
          <div className="w-20 h-20 rounded-full bg-[#161b22] flex items-center justify-center mb-6 border border-[#30363d]">
            <MessageSquare className="w-10 h-10 text-[#30363d]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Your Messages</h3>
          <p className="text-[#8b949e] max-w-xs">
            Select a conversation from the sidebar or start a new chat with your contacts.
          </p>
          <Button variant="outline" className="mt-6 border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d] hover:text-white">
            Compose Message
          </Button>
        </section>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full h-20 bg-[#0d0d0f]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-2 z-50">
        {/* Subtle top gradient shadow */}
        <div className="absolute top-[-20px] left-0 w-full h-[20px] bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
        
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 group`}
            >
              {isActive && (
                <div className="w-8 h-1 rounded-full bg-[#06b6d4] mb-1 animate-in fade-in slide-in-from-top-1 duration-300" />
              )}
              {!isActive && <div className="h-1 mb-1 opacity-0" />}
              
              <div className="relative">
                <item.icon 
                  className={`w-[22px] h-[22px] transition-colors ${
                    isActive ? "text-[#06b6d4]" : "text-[#8b949e] group-hover:text-[#f0f6fc]"
                  }`}
                />
                {item.id === "Messages" && (
                   <div className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white px-0.5 border border-[#0d0d0f]">
                    5
                  </div>
                )}
                {item.badge && item.id !== "Messages" && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#06b6d4] rounded-full border border-[#0d0d0f]"></div>
                )}
              </div>
              <span className={`text-[10px] font-medium uppercase tracking-wider transition-colors ${
                isActive ? "text-[#06b6d4]" : "text-[#8b949e] group-hover:text-[#f0f6fc]"
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Profile/Settings quick access if needed or just part of flow */}
        {/* Since user asked for 7 equal width columns for nav items, I'll stick to that but keep profile in top header */}
      </nav>
    </div>
  );
}
