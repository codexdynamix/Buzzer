import React from 'react';
import { ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  contact: {
    id: string;
    name: string;
    imageUrl?: string;
    isOnline: boolean;
    lastSeen?: string;
  };
  onBackClick?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ contact, onBackClick }) => {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
      {onBackClick && (
        <Button variant="ghost" size="icon" onClick={onBackClick} className="md:hidden h-8 w-8">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      <Avatar className="h-9 w-9">
        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
          {contact.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate">{contact.name}</h3>
        <div className="flex items-center gap-1">
          {contact.isOnline ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              <span className="text-xs text-green-600">Online</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">{contact.lastSeen || 'Offline'}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Video className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
