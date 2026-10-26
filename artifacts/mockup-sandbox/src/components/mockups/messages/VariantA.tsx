import React, { useState } from "react";
import { 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Info, 
  PlusCircle, 
  Smile, 
  Paperclip,
  Check,
  CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const CONTACTS = [
  {
    id: "1",
    name: "Alex Johnson",
    category: "Marketplace",
    status: "online",
    unreadCount: 3,
    lastMessage: "Is the mountain bike still available?",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop",
    messages: [
      { id: "m1", sender: "them", text: "Hey! I saw your listing for the mountain bike.", timestamp: "10:30 AM" },
      { id: "m2", sender: "me", text: "Yes it is! Would you like to come see it?", timestamp: "10:32 AM" },
      { id: "m3", sender: "them", text: "Is the mountain bike still available?", timestamp: "10:35 AM" },
    ]
  },
  {
    id: "2",
    name: "Tasty Bites",
    category: "Food",
    status: "online",
    unreadCount: 1,
    lastMessage: "Your order is being prepared!",
    avatar: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=100&auto=format&fit=crop",
    messages: []
  },
  {
    id: "3",
    name: "Michael K. Driver",
    category: "Taxi",
    status: "online",
    unreadCount: 0,
    lastMessage: "I'm 5 minutes away",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop",
    messages: []
  },
  {
    id: "4",
    name: "Sarah Miller",
    category: "Marketplace",
    status: "offline",
    unreadCount: 0,
    lastMessage: "The coffee table is already sold, sorry!",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop",
    messages: []
  },
  {
    id: "5",
    name: "Spice Garden",
    category: "Food",
    status: "online",
    unreadCount: 0,
    lastMessage: "We have a lunch special — 20% off!",
    avatar: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=100&auto=format&fit=crop",
    messages: []
  },
  {
    id: "6",
    name: "David Chen",
    category: "Marketplace",
    status: "offline",
    unreadCount: 0,
    lastMessage: "I can do $800, final offer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop",
    messages: []
  },
  {
    id: "7",
    name: "Support Team",
    category: "Support",
    status: "online",
    unreadCount: 0,
    lastMessage: "Is there anything else we can help with?",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=100&auto=format&fit=crop",
    messages: []
  }
];

const categoryColors: Record<string, { bg: string, text: string }> = {
  Marketplace: { bg: "rgba(147, 51, 234, 0.4)", text: "#d8b4fe" }, // Purple
  Food: { bg: "rgba(249, 115, 22, 0.4)", text: "#fdba74" }, // Orange
  Taxi: { bg: "rgba(34, 197, 94, 0.4)", text: "#86efac" }, // Green
  Support: { bg: "rgba(59, 130, 246, 0.4)", text: "#93c5fd" }, // Blue
};

export function VariantA() {
  const [selectedContactId, setSelectedContactId] = useState("1");
  const [messageText, setMessageText] = useState("");
  const [contacts, setContacts] = useState(CONTACTS);

  const selectedContact = contacts.find(c => c.id === selectedContactId) || contacts[0];

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const newMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: "me",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setContacts(prev => prev.map(c => {
      if (c.id === selectedContactId) {
        return {
          ...c,
          messages: [...c.messages, newMessage],
          lastMessage: messageText
        };
      }
      return c;
    }));

    setMessageText("");
  };

  return (
    <div 
      className="flex min-h-screen h-screen overflow-hidden text-[#f0f6fc]"
      style={{ 
        backgroundColor: "#0d1117",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif" 
      }}
    >
      {/* Sidebar */}
      <div 
        className="flex flex-col border-r shrink-0 overflow-hidden"
        style={{ 
          width: "300px", 
          backgroundColor: "#161b22",
          borderColor: "#30363d"
        }}
      >
        <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: "#30363d" }}>
          <h1 className="text-xl font-bold">Messages</h1>
          <Button variant="ghost" size="icon" className="text-[#8b949e] hover:text-white">
            <PlusCircle size={20} />
          </Button>
        </div>

        <div className="p-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e] w-4 h-4 group-focus-within:text-white transition-colors" />
            <Input 
              placeholder="Search conversations..." 
              className="pl-10 h-10 border-none rounded-xl placeholder:text-[#8b949e] text-sm"
              style={{ backgroundColor: "#0d1117" }}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-2 pb-4 space-y-0.5">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => setSelectedContactId(contact.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors group relative ${
                  selectedContactId === contact.id ? "bg-[#1e3a5f]" : "hover:bg-[#1f2937]"
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-transparent">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback className="bg-[#30363d] text-white">
                      {contact.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {contact.status === "online" && (
                    <div 
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#161b22]"
                      style={{ backgroundColor: "#3fb950" }}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-sm truncate">{contact.name}</span>
                    {contact.unreadCount > 0 && (
                      <Badge 
                        className="h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full text-[10px] font-bold border-none"
                        style={{ backgroundColor: "#1d4ed8", color: "white" }}
                      >
                        {contact.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider"
                      style={{ 
                        backgroundColor: categoryColors[contact.category]?.bg, 
                        color: categoryColors[contact.category]?.text 
                      }}
                    >
                      {contact.category}
                    </span>
                    <p className="text-[#8b949e] text-xs truncate">
                      {contact.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div 
        className="flex flex-col flex-1 min-w-0"
        style={{ backgroundColor: "#0d1117" }}
      >
        {/* Chat Header */}
        <header 
          className="h-[72px] shrink-0 flex items-center justify-between px-6 border-b z-10"
          style={{ borderColor: "#30363d", backgroundColor: "#0d1117" }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedContact.avatar} />
                <AvatarFallback className="bg-[#30363d] text-white">
                  {selectedContact.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {selectedContact.status === "online" && (
                <div 
                  className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0d1117]"
                  style={{ backgroundColor: "#3fb950" }}
                />
              )}
            </div>
            <div>
              <h2 className="font-bold text-base leading-none mb-1">{selectedContact.name}</h2>
              <div className="flex items-center gap-1.5">
                <span className="text-[#8b949e] text-xs">
                  {selectedContact.status === "online" ? "Active now" : "Offline"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-[#8b949e] hover:text-white hover:bg-[#1f2937]">
              <Phone size={20} />
            </Button>
            <Button variant="ghost" size="icon" className="text-[#8b949e] hover:text-white hover:bg-[#1f2937]">
              <Video size={20} />
            </Button>
            <Button variant="ghost" size="icon" className="text-[#8b949e] hover:text-white hover:bg-[#1f2937]">
              <Info size={20} />
            </Button>
            <Button variant="ghost" size="icon" className="text-[#8b949e] hover:text-white hover:bg-[#1f2937]">
              <MoreVertical size={20} />
            </Button>
          </div>
        </header>

        {/* Message List */}
        <ScrollArea className="flex-1 p-6">
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center py-10">
              <Avatar className="h-24 w-24 mb-4 border-4 border-[#161b22]">
                <AvatarImage src={selectedContact.avatar} />
                <AvatarFallback className="text-2xl bg-[#30363d]">
                  {selectedContact.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-2xl font-bold">{selectedContact.name}</h3>
              <p className="text-[#8b949e] mt-1 italic">Start of your conversation with {selectedContact.name}</p>
              <Badge 
                className="mt-4 border-none"
                style={{ 
                  backgroundColor: categoryColors[selectedContact.category]?.bg, 
                  color: categoryColors[selectedContact.category]?.text 
                }}
              >
                {selectedContact.category}
              </Badge>
            </div>

            {selectedContact.messages.map((msg, idx) => (
              <div 
                key={msg.id}
                className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[70%] px-4 py-3 rounded-2xl relative group ${
                    msg.sender === "me" 
                      ? "bg-[#1d4ed8] text-white rounded-tr-none" 
                      : "bg-[#21262d] text-[#f0f6fc] rounded-tl-none"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div className={`flex items-center gap-1.5 mt-1.5 ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                    <span className={`text-[10px] ${msg.sender === "me" ? "text-blue-100/70" : "text-[#8b949e]"}`}>
                      {msg.timestamp}
                    </span>
                    {msg.sender === "me" && (
                      <CheckCheck size={12} className="text-blue-100/70" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div 
          className="p-4 px-6 shrink-0"
          style={{ backgroundColor: "#0d1117" }}
        >
          <div 
            className="flex items-center gap-3 p-2 px-4 rounded-xl border transition-shadow focus-within:shadow-[0_0_0_1px_#1d4ed8]"
            style={{ 
              backgroundColor: "#161b22",
              borderColor: "#30363d"
            }}
          >
            <Button variant="ghost" size="icon" className="text-[#8b949e] hover:text-white shrink-0">
              <PlusCircle size={22} />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex text-[#8b949e] hover:text-white shrink-0">
              <Paperclip size={20} />
            </Button>
            
            <Input 
              placeholder={`Message ${selectedContact.name}...`}
              className="border-none bg-transparent h-10 px-0 focus-visible:ring-0 text-white placeholder:text-[#8b949e]"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
            />

            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="hidden sm:flex text-[#8b949e] hover:text-white">
                <Smile size={20} />
              </Button>
              <Button 
                size="icon" 
                className={`rounded-full transition-all duration-300 ${
                  messageText.trim() ? "bg-[#1d4ed8] hover:bg-[#1e40af] text-white scale-110" : "bg-transparent text-[#8b949e]"
                }`}
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
              >
                <Send size={18} className={messageText.trim() ? "translate-x-0.5" : ""} />
              </Button>
            </div>
          </div>
          <p className="text-center text-[10px] text-[#8b949e] mt-2">
            Messages are end-to-end encrypted. No one outside of this chat can read them.
          </p>
        </div>
      </div>
    </div>
  );
}
