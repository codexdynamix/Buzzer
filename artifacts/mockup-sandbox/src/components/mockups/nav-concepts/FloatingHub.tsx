import React, { useState } from "react";
import { 
  LayoutGrid, 
  X, 
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
  MoreVertical,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function FloatingHub() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Messages");

  const navItems = [
    { id: "Messages", label: "Messages", icon: MessageCircle, badge: "5" },
    { id: "Marketplace", label: "Marketplace", icon: ShoppingBag },
    { id: "Jobs", label: "Jobs", icon: Briefcase },
    { id: "Services", label: "Services", icon: Wrench },
    { id: "Real Estate", label: "Real Estate", icon: Building2 },
    { id: "Transport", label: "Transport", icon: Truck },
    { id: "Events", label: "Events", icon: Calendar },
    { id: "Settings", label: "Settings", icon: Settings },
    { id: "Profile", label: "Profile", icon: User },
  ];

  const contacts = [
    { id: 1, name: "Alex Johnson", category: "MARKETPLACE", categoryColor: "rgba(147,51,234,0.35)", textColor: "#d8b4fe", unread: "3", lastMsg: "Is the bike still available?" },
    { id: 2, name: "Tasty Bites", category: "FOOD", categoryColor: "rgba(249,115,22,0.35)", textColor: "#fdba74", lastMsg: "Your order is on the way!" },
    { id: 3, name: "Michael K. Driver", category: "TAXI", categoryColor: "rgba(34,197,94,0.35)", textColor: "#86efac", lastMsg: "I'm outside in the white Tesla." },
    { id: 4, name: "Sarah Miller", category: "MARKETPLACE", categoryColor: "rgba(147,51,234,0.35)", textColor: "#d8b4fe", lastMsg: "Thanks for the quick response!" },
  ];

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0d1117] text-[#f0f6fc] font-sans">
      {/* Background Content - Messages UI */}
      <div className="flex h-full w-full">
        {/* Messages Sidebar */}
        <div className="w-80 h-full bg-[#161b22] border-r border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-bold">Messages</h2>
            <Button variant="ghost" size="icon" className="text-[#8b949e]">
              <Search size={20} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.map((contact) => (
              <div 
                key={contact.id} 
                className={cn(
                  "p-4 flex flex-col gap-1 cursor-pointer transition-colors border-b border-white/5 hover:bg-white/[0.02]",
                  contact.id === 1 && "bg-white/[0.03]"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{contact.name}</span>
                    <span 
                      className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                      style={{ backgroundColor: contact.categoryColor, color: contact.textColor }}
                    >
                      {contact.category}
                    </span>
                  </div>
                  {contact.unread && (
                    <Badge className="bg-[#1d4ed8] text-white hover:bg-[#1d4ed8] h-5 min-w-5 flex items-center justify-center p-0 text-[10px]">
                      {contact.unread}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-[#8b949e] truncate">{contact.lastMsg}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Messages Main Panel */}
        <div className="flex-1 h-full bg-[#0d1117] flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center opacity-40">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <MessageCircle size={32} />
            </div>
            <div>
              <h3 className="text-lg font-medium">Your Messages</h3>
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Wordmark */}
      <div className="absolute top-4 left-6 z-10 pointer-events-none">
        <span className="text-white font-black tracking-tighter text-xl">BUZZER.</span>
      </div>

      {/* Hub Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Hub Panel */}
      <div 
        className={cn(
          "fixed bottom-24 right-6 z-50 w-72 rounded-2xl overflow-hidden transition-all duration-200 origin-bottom-right",
          isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-2 opacity-0 scale-95 pointer-events-none"
        )}
        style={{ 
          background: 'rgba(22,27,34,0.98)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)' 
        }}
      >
        <div className="px-4 pt-4 pb-1">
          <span className="text-[10px] text-[#8b949e] uppercase tracking-[0.2em] font-bold">Navigate</span>
        </div>
        
        <div className="grid grid-cols-3 gap-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <div
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "group relative rounded-xl p-3 flex flex-col items-center gap-1.5 cursor-pointer transition-all",
                  "bg-white/[0.04] hover:bg-white/[0.1]",
                  isActive && "border border-[#1d4ed8]/40 ring-1 ring-[#1d4ed8]/20"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center relative transition-colors",
                  isActive ? "bg-[#1d4ed8]/30 text-[#60a5fa]" : "bg-white/[0.06] text-[#8b949e]"
                )}>
                  <Icon size={20} />
                  {item.badge && (
                    <div className="absolute -top-1 -right-1 bg-[#1d4ed8] text-white text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full border-2 border-[#161b22] flex items-center justify-center">
                      {item.badge}
                    </div>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium text-center truncate w-full",
                  isActive ? "text-[#f0f6fc]" : "text-[#8b949e]"
                )}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95",
          isOpen 
            ? "bg-[#1e1e2d] text-white" 
            : "bg-[#4f46e5] text-white shadow-[0_0_30px_rgba(79,70,229,0.6)]"
        )}
      >
        {isOpen ? (
          <X size={24} className="animate-in fade-in zoom-in duration-200" />
        ) : (
          <LayoutGrid size={24} className="animate-in fade-in zoom-in duration-200" />
        )}
      </button>
    </div>
  );
}
