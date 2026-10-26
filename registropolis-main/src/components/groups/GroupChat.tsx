
import React from 'react';
import { Users } from 'lucide-react';

export interface GroupChatProps {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  lastMessage?: string;
  time: string;
  unread?: number;
  imageUrl?: string;
  onClick: () => void;
  isSelected?: boolean;
}

const GroupChat: React.FC<GroupChatProps> = ({
  name,
  memberCount,
  lastMessage,
  time,
  unread = 0,
  imageUrl,
  onClick,
  isSelected = false
}) => {
  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors duration-200 ${isSelected ? 'bg-accent' : ''}`}
      onClick={onClick}
    >
      <div className="relative">
        {imageUrl ? (
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className={`font-medium truncate ${unread > 0 ? 'font-semibold' : ''}`}>{name}</h3>
          <span className={`text-xs ${unread > 0 ? 'text-primary font-medium' : 'text-muted-foreground'} ml-2 whitespace-nowrap`}>
            {time}
          </span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <span>{memberCount} members</span>
        </div>
        {lastMessage && (
          <p className={`text-sm ${unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'} truncate`}>
            {lastMessage}
          </p>
        )}
      </div>
      
      {unread > 0 && (
        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <span className="text-xs text-primary-foreground">{unread}</span>
        </div>
      )}
    </div>
  );
};

export default GroupChat;
