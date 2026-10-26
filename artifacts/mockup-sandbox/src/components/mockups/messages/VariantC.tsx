import React, { useState, useEffect, useRef } from "react";
import { Search, Send, MoreVertical, Phone, Video, Paperclip, Smile, ShieldCheck, ShoppingBag, Utensils, Car, LifeBuoy, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface Contact {
  id: number;
  name: string;
  category: string;
  status: string;
  unread: number;
  lastMessage: string;
  initials: string;
}

const CONTACTS_DATA: Contact[] = [
  { id: 1, name: "Alex Johnson", category: "Marketplace", status: "online", unread: 3, lastMessage: "Is the mountain bike still available?", initials: "AJ" },
  { id: 2, name: "Tasty Bites", category: "Food", status: "online", unread: 1, lastMessage: "Your order is being prepared!", initials: "TB" },
  { id: 3, name: "Michael K. Driver", category: "Taxi", status: "online", unread: 0, lastMessage: "I'm 5 minutes away", initials: "MD" },
  { id: 4, name: "Sarah Miller", category: "Marketplace", status: "offline", unread: 0, lastMessage: "The coffee table is already sold, sorry!", initials: "SM" },
  { id: 5, name: "Spice Garden", category: "Food", status: "online", unread: 0, lastMessage: "We have a lunch special — 20% off!", initials: "SG" },
  { id: 6, name: "David Chen", category: "Marketplace", status: "offline", unread: 0, lastMessage: "I can do $800, final offer", initials: "DC" },
  { id: 7, name: "Support Team", category: "Support", status: "online", unread: 0, lastMessage: "Is there anything else we can help with?", initials: "ST" },
];

const INITIAL_MESSAGES: Record<number, Message[]> = {
  1: [
    { id: "m1", sender: "them", text: "Hey! I saw your listing for the mountain bike.", timestamp: "10:30 AM" },
    { id: "m2", sender: "me", text: "Yes it is! Would you like to come see it?", timestamp: "10:32 AM" },
    { id: "m3", sender: "them", text: "Is the mountain bike still available?", timestamp: "10:35 AM" },
  ],
};

const CATEGORY_COLORS: Record<string, string> = {
  Marketplace: "purple",
  Food: "orange",
  Taxi: "green",
  Support: "blue",
};

const CATEGORY_ICONS = {
  Marketplace: ShoppingBag,
  Food: Utensils,
  Taxi: Car,
  Support: LifeBuoy,
};

export function VariantC() {
  const [selectedContact, setSelectedContact] = useState(CONTACTS_DATA[0]);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedContact, messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    const newMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: "me",
      text: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), newMessage]
    }));
    setInputValue("");
  };

  const getCategoryColor = (cat: string) => {
    const colors = {
      purple: "rgba(168, 85, 247, 0.2)",
      orange: "rgba(249, 115, 22, 0.2)",
      green: "rgba(34, 197, 94, 0.2)",
      blue: "rgba(59, 130, 246, 0.2)",
    };
    return colors[CATEGORY_COLORS[cat] as keyof typeof colors] || "rgba(255,255,255,0.2)";
  };

  return (
    <div 
      className="min-h-screen flex text-white overflow-hidden" 
      style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f64f59 100%)',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* Sidebar */}
      <div 
        className="flex flex-col h-screen"
        style={{ 
          background: 'rgba(255,255,255,0.12)', 
          backdropFilter: 'blur(20px)', 
          borderRight: '1px solid rgba(255,255,255,0.2)',
          width: '300px',
          flexShrink: 0
        }}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6 tracking-tight">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <Input 
              placeholder="Search chats..." 
              className="pl-10 h-10 rounded-full"
              style={{ 
                background: 'rgba(255,255,255,0.15)', 
                border: '1px solid rgba(255,255,255,0.3)', 
                color: 'white' 
              }}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 pb-6">
            {CONTACTS_DATA.map((contact) => (
              <div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className="p-3 rounded-2xl cursor-pointer transition-all duration-200 group flex items-center gap-3"
                style={{
                  background: selectedContact.id === contact.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (selectedContact.id !== contact.id) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedContact.id !== contact.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12 rounded-2xl border-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <AvatarFallback className="text-white font-bold bg-transparent">
                      {contact.initials}
                    </AvatarFallback>
                  </Avatar>
                  {contact.status === "online" && (
                    <div 
                      className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white/20"
                      style={{ 
                        background: '#86efac',
                        boxShadow: '0 0 8px #86efac'
                      }}
                    />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="font-semibold truncate">{contact.name}</span>
                    {contact.unread > 0 && (
                      <Badge 
                        className="rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center border-0 text-[10px]"
                        style={{ background: 'rgba(255,255,255,0.9)', color: '#7c3aed' }}
                      >
                        {contact.unread}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="text-[10px] px-1.5 py-0.5 rounded-md border border-white/30 truncate"
                      style={{ background: 'rgba(255,255,255,0.2)' }}
                    >
                      {contact.category}
                    </div>
                    <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {contact.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Panel */}
      <div 
        className="flex-1 flex flex-col h-screen"
        style={{ 
          background: 'rgba(255,255,255,0.08)', 
          backdropFilter: 'blur(20px)' 
        }}
      >
        {/* Chat Header */}
        <header 
          className="h-[72px] px-6 flex items-center justify-between"
          style={{ 
            background: 'rgba(255,255,255,0.08)', 
            backdropFilter: 'blur(20px)', 
            borderBottom: '1px solid rgba(255,255,255,0.15)' 
          }}
        >
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 rounded-xl" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <AvatarFallback className="text-white font-bold bg-transparent">
                {selectedContact.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-bold leading-none">{selectedContact.name}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                {selectedContact.status === "online" ? (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#86efac' }} />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>Online</span>
                  </>
                ) : (
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>Offline</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white">
              <Video className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {(messages[selectedContact.id] || []).map((msg) => (
            <div 
              key={msg.id}
              className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${msg.sender === 'me' ? 'order-2' : ''}`}>
                <div 
                  className={`p-4 rounded-2xl ${
                    msg.sender === 'me' 
                    ? 'rounded-tr-none' 
                    : 'rounded-tl-none'
                  }`}
                  style={msg.sender === 'me' 
                    ? { background: 'rgba(255,255,255,0.9)', color: '#4c1d95', fontWeight: 600 }
                    : { background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }
                  }
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
                <p 
                  className={`text-[10px] mt-1.5 ${msg.sender === 'me' ? 'text-right' : 'text-left'}`}
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                >
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <footer 
          className="p-4"
          style={{ 
            background: 'rgba(255,255,255,0.1)', 
            backdropFilter: 'blur(20px)', 
            borderTop: '1px solid rgba(255,255,255,0.15)' 
          }}
        >
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white shrink-0">
              <Paperclip className="w-5 h-5" />
            </Button>
            <div className="flex-1 relative">
              <Input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="h-12 rounded-full pl-6 pr-12 border-0"
                style={{ 
                  background: 'rgba(255,255,255,0.15)', 
                  border: '1px solid rgba(255,255,255,0.3)', 
                  color: 'white' 
                }}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full hover:bg-white/10 text-white/60"
              >
                <Smile className="w-5 h-5" />
              </Button>
            </div>
            <Button 
              onClick={handleSend}
              className="h-12 w-12 rounded-full shrink-0 flex items-center justify-center p-0 border-0"
              style={{ background: 'rgba(255,255,255,0.9)', color: '#7c3aed' }}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.65)' }} />
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
              End-to-end encrypted
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
