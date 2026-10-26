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
  Bell,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function TopCommandBar() {
  const [activeTab, setActiveTab] = useState("Messages");

  const navItems = [
    { id: "Messages", label: "Messages", icon: MessageCircle, badge: "5" },
    { id: "Marketplace", label: "Marketplace", icon: ShoppingBag },
    { id: "Jobs", label: "Jobs", icon: Briefcase },
    { id: "Services", label: "Services", icon: Wrench },
    { id: "Real Estate", label: "Real Estate", icon: Building2 },
    { id: "Transport", label: "Transport", icon: Truck },
    { id: "Events", label: "Events", icon: Calendar },
  ];

  const secondaryNavItems = [
    { id: "Settings", label: "Settings", icon: Settings },
    { id: "Profile", label: "Profile", icon: User },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: '#0a0a0f' }}>
      {/* Top Command Bar */}
      <header className="h-14 shrink-0 flex items-center px-4 gap-0 relative" style={{ backgroundColor: '#0d1117', borderBottom: '1px solid #30363d' }}>
        {/* Logo */}
        <div className="mr-6 shrink-0 flex items-center h-full">
          <span className="font-black text-white text-lg tracking-tighter">
            BUZZER<span className="text-[#06b6d4]">.</span>
          </span>
        </div>

        {/* Nav Tabs */}
        <nav className="flex-1 h-full overflow-x-auto no-scrollbar flex items-center">
          <div className="flex h-full items-center">
            {navItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 h-14 text-sm font-medium cursor-pointer border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === item.id 
                    ? "text-white border-[#06b6d4]" 
                    : "text-[#8b949e] border-transparent hover:text-[#f0f6fc] hover:border-white/20"
                }`}
              >
                <item.icon size={15} />
                <span>{item.label}</span>
                {item.badge && (
                  <span 
                    className="flex items-center justify-center text-[10px] font-bold px-1.5 h-4 rounded-full"
                    style={{ background: '#06b6d4', color: '#0a0a0f' }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Right Side Actions */}
        <div className="shrink-0 flex items-center gap-2 ml-4">
          <Button variant="ghost" size="icon" className="text-[#8b949e] hover:text-white hover:bg-white/10 h-8 w-8">
            <Search size={18} />
          </Button>
          <div className="relative">
            <Button variant="ghost" size="icon" className="text-[#8b949e] hover:text-white hover:bg-white/10 h-8 w-8">
              <Bell size={18} />
            </Button>
            <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#0d1117]"></span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#1d4ed8] flex items-center justify-center text-white text-xs font-bold cursor-pointer">
            JD
          </div>
        </div>

        {/* Subtle Breadcrumb/Section Sub-bar */}
        <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-white/5 pointer-events-none" />
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-hidden flex">
        {activeTab === "Messages" ? (
          <MessagesContent />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#8b949e]">
            <div className="p-4 rounded-full bg-white/5 mb-4">
              {navItems.find(i => i.id === activeTab)?.icon && React.createElement(navItems.find(i => i.id === activeTab)!.icon, { size: 32 })}
            </div>
            <h2 className="text-xl font-semibold text-white mb-1">{activeTab}</h2>
            <p className="text-sm">This section is currently being updated.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function MessagesContent() {
  const contacts = [
    { id: 1, name: "Alex Johnson", category: "MARKETPLACE", badgeColor: "rgba(147,51,234,0.35)", textColor: "#d8b4fe", unread: 3, lastMsg: "Is the camera still available?" },
    { id: 2, name: "Tasty Bites", category: "FOOD", badgeColor: "rgba(249,115,22,0.35)", textColor: "#fdba74", lastMsg: "Your order is on the way!" },
    { id: 3, name: "Michael K. Driver", category: "TAXI", badgeColor: "rgba(34,197,94,0.35)", textColor: "#86efac", lastMsg: "I've arrived at the pickup location." },
    { id: 4, name: "Sarah Miller", category: "MARKETPLACE", badgeColor: "rgba(147,51,234,0.35)", textColor: "#d8b4fe", lastMsg: "Can you do $45 for the lamp?" },
  ];

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 shrink-0 flex flex-col border-r border-[#30363d]" style={{ backgroundColor: '#161b22' }}>
        <div className="p-4 border-b border-[#30363d] flex justify-between items-center">
          <h3 className="font-semibold text-white">All Messages</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8b949e]">
            <MoreVertical size={16} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => (
            <div 
              key={contact.id} 
              className={`p-4 flex flex-col gap-1 cursor-pointer border-b border-[#30363d]/50 hover:bg-white/5 transition-colors ${contact.id === 1 ? 'bg-white/5' : ''}`}
            >
              <div className="flex justify-between items-start">
                <span className="font-medium text-white text-sm">{contact.name}</span>
                {contact.unread && (
                  <span className="bg-[#1d4ed8] text-white text-[10px] font-bold px-1.5 h-4 flex items-center justify-center rounded-full">
                    {contact.unread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span 
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: contact.badgeColor, color: contact.textColor }}
                >
                  {contact.category}
                </span>
                <span className="text-[#8b949e] text-xs truncate">{contact.lastMsg}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Panel - Empty State */}
      <div className="flex-1 flex flex-col items-center justify-center p-8" style={{ backgroundColor: '#0d1117' }}>
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
          <MessageCircle size={32} className="text-[#8b949e]" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Your Messages</h3>
        <p className="text-[#8b949e] text-center max-w-sm">
          Select a conversation from the sidebar to view messages or start a new chat with sellers and service providers.
        </p>
        <Button className="mt-6 bg-[#1d4ed8] hover:bg-[#1e40af] text-white">
          New Message
        </Button>
      </div>
    </div>
  );
}
