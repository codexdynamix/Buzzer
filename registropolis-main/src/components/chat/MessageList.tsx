import React from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'contact';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'audio' | 'location';
  media?: string;
}

interface MessageListProps {
  messages: Message[];
}

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={cn('flex w-full mb-1.5', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[78%] rounded-2xl px-3.5 py-2 relative',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        )}
      >
        {message.type === 'text' && (
          <p className="text-sm leading-relaxed break-words">{message.content}</p>
        )}
        {message.type === 'image' && message.media && (
          <img
            src={message.media}
            alt="Shared"
            className="rounded-xl max-w-full max-h-52 object-cover mb-1"
          />
        )}
        {message.type === 'location' && (
          <div className="flex items-center gap-2 py-0.5">
            <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="text-sm">Shared a location</span>
          </div>
        )}
        <div
          className={cn(
            'flex items-center justify-end gap-1 mt-0.5',
            isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'
          )}
        >
          <span className="text-[10px]">{format(message.timestamp, 'HH:mm')}</span>
          {isUser &&
            (message.status === 'read' ? (
              <CheckCheck className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            ))}
        </div>
      </div>
    </div>
  );
};

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="flex flex-col">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
};

export default MessageList;
