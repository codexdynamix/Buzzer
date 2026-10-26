import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Plus, 
  Smile, 
  Paperclip,
  Check,
  CheckCheck,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CONTACTS = [
  { id: 1, name: "Alex Johnson", category: "Marketplace", online: true, unread: 3, lastMessage: "Is the mountain bike still available?", time: "10:30 AM", avatar: "" },
  { id: 2, name: "Tasty Bites", category: "Food", online: true, unread: 1, lastMessage: "Your order is being prepared!", time: "9:45 AM", avatar: "" },
  { id: 3, name: "Michael K. Driver", category: "Taxi", online: true, unread: 0, lastMessage: "I'm 5 minutes away", time: "Yesterday", avatar: "" },
  { id: 4, name: "Sarah Miller", category: "Marketplace", offline: true, unread: 0, lastMessage: "The coffee table is already sold, sorry!", time: "Yesterday", avatar: "" },
  { id: 5, name: "Spice Garden", category: "Food", online: true, unread: 0, lastMessage: "We have a lunch special — 20% off!", time: "Monday", avatar: "" },
  { id: 6, name: "David Chen", category: "Marketplace", offline: true, unread: 0, lastMessage: "I can do $800, final offer", time: "Monday", avatar: "" },
  { id: 7, name: "Support Team", category: "Support", online: true, unread: 0, lastMessage: "Is there anything else we can help with?", time: "Sunday", avatar: "" },
];

const INITIAL_MESSAGES = [
  { id: "1", sender: "them", text: "Hey! I saw your listing for the mountain bike.", time: "10:25 AM", status: "read" },
  { id: "2", sender: "me", text: "Yes it is! Would you like to come see it?", time: "10:28 AM", status: "read" },
  { id: "3", sender: "them", text: "Is the mountain bike still available?", time: "10:30 AM", status: "received" },
];

export function VariantB() {
  const [selectedContact, setSelectedContact] = useState(CONTACTS[0]);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: "me",
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "sent"
    };

    setMessages([...messages, newMessage]);
    setInputValue("");
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case "Marketplace":
        return { bg: "#fef3c7", text: "#b45309" }; // amber-100 / amber-700
      case "Food":
        return { bg: "#ffedd5", text: "#c2410c" }; // orange-100 / orange-700
      case "Taxi":
        return { bg: "#dcfce7", text: "#15803d" }; // green-100 / green-700
      case "Support":
        return { bg: "#dbeafe", text: "#1d4ed8" }; // blue-100 / blue-700
      default:
        return { bg: "#f3f4f6", text: "#374151" };
    }
  };

  return (
    <div 
      className="flex h-screen min-h-screen overflow-hidden" 
      style={{ 
        backgroundColor: "#faf7f2",
        fontFamily: "'Segoe UI', system-ui, sans-serif"
      }}
    >
      {/* Sidebar */}
      <div 
        className="flex flex-col border-r shrink-0" 
        style={{ 
          width: "320px",
          backgroundColor: "#ffffff",
          borderColor: "#e8e0d5"
        }}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: "#e8e0d5" }}>
          <Avatar className="h-10 w-10 border border-[#e8e0d5]">
            <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop" />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="rounded-full text-[#667781]">
              <Plus className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-[#667781]">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667781] group-focus-within:text-[#25d366]" />
            <Input 
              placeholder="Search or start new chat" 
              className="pl-10 h-9 rounded-lg border-[#e8e0d5] bg-[#ffffff] focus-visible:ring-1 focus-visible:ring-[#25d366]"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {CONTACTS.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={cn(
                "flex items-center gap-3 p-3 cursor-pointer transition-colors relative",
                selectedContact.id === contact.id ? "bg-[#fff3e0]" : "hover:bg-[#fdf5ec]"
              )}
            >
              <div className="relative shrink-0">
                <Avatar className="h-12 w-12 border border-[#e8e0d5]">
                  <AvatarFallback className="bg-[#f0f0f0] text-[#667781]">
                    {contact.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                {contact.online && (
                  <span 
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: "#25d366" }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="font-semibold text-[#1a1a1a] truncate">{contact.name}</h3>
                  <span className="text-[11px]" style={{ color: "#667781" }}>{contact.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm truncate pr-2" style={{ color: "#667781" }}>
                    {contact.lastMessage}
                  </p>
                  {contact.unread > 0 && (
                    <Badge 
                      className="h-5 min-w-[20px] rounded-full px-1.5 flex items-center justify-center border-none"
                      style={{ backgroundColor: "#25d366", color: "#1a1a1a" }}
                    >
                      {contact.unread}
                    </Badge>
                  )}
                </div>
                <div className="mt-1">
                  <Badge 
                    variant="secondary" 
                    className="text-[10px] font-medium px-1.5 py-0 leading-tight uppercase tracking-wide border-none"
                    style={{ 
                      backgroundColor: getCategoryStyles(contact.category).bg,
                      color: getCategoryStyles(contact.category).text
                    }}
                  >
                    {contact.category}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div 
        className="flex-1 flex flex-col relative"
        style={{ backgroundColor: "#ece5dd" }}
      >
        {/* Chat Header */}
        <div 
          className="h-16 shrink-0 flex items-center justify-between px-4 border-b z-10" 
          style={{ backgroundColor: "#ffffff", borderColor: "#e8e0d5" }}
        >
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10 border border-[#e8e0d5]">
              <AvatarFallback className="bg-[#f0f0f0] text-[#667781]">
                {selectedContact.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-[#1a1a1a] leading-tight">{selectedContact.name}</h3>
              <p className="text-[11px]" style={{ color: "#667781" }}>
                {selectedContact.online ? "online" : "offline"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full text-[#667781]">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-[#667781]">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-[#667781]">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-[#667781]">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
          style={{ backgroundImage: "url('https://w0.peakpx.com/wallpaper/580/630/HD-wallpaper-whatsapp-beige-pattern-background-beige-backgrounds-pattern-texture-whatsapp.jpg')", backgroundBlendMode: "overlay", backgroundColor: "#ece5dd" }}
        >
          <div className="flex justify-center mb-6">
            <Badge variant="outline" className="bg-[#fff9f0] border-[#e8e0d5] text-[#667781] font-normal uppercase text-[10px] tracking-widest px-3 py-1">
              Today
            </Badge>
          </div>

          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={cn(
                "flex w-full mb-1",
                msg.sender === "me" ? "justify-end" : "justify-start"
              )}
            >
              <div 
                className={cn(
                  "max-w-[70%] px-3 py-2 shadow-sm relative",
                  msg.sender === "me" 
                    ? "rounded-2xl rounded-tr-sm" 
                    : "rounded-2xl rounded-tl-sm"
                )}
                style={{ 
                  backgroundColor: msg.sender === "me" ? "#dcf8c6" : "#ffffff",
                  color: "#1a1a1a"
                }}
              >
                <p className="text-[14.5px] leading-relaxed break-words pr-12">
                  {msg.text}
                </p>
                <div className="absolute bottom-1 right-2 flex items-center gap-1">
                  <span className="text-[10px]" style={{ color: "#667781" }}>
                    {msg.time}
                  </span>
                  {msg.sender === "me" && (
                    <span style={{ color: msg.status === "read" ? "#34b7f1" : "#667781" }}>
                      {msg.status === "sent" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <CheckCheck className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div 
          className="p-3 flex items-center gap-2 border-t" 
          style={{ backgroundColor: "#f0f0f0", borderColor: "#d1c9be" }}
        >
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="rounded-full text-[#667781]">
              <Smile className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-[#667781]">
              <Paperclip className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex-1">
            <Input 
              placeholder="Type a message" 
              className="bg-white border-none h-11 focus-visible:ring-0 rounded-lg text-[#1a1a1a]"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />
          </div>
          <Button 
            size="icon" 
            className="rounded-full shrink-0" 
            style={{ backgroundColor: "#25d366", color: "#ffffff" }}
            onClick={handleSend}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
