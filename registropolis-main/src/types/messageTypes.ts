
// Message types for the messages feature

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'contact';
  status: 'sent' | 'delivered' | 'read' | 'error';
  senderName?: string;
  senderAvatar?: string;
  repliedToMessage?: {
    id: string;
    content: string;
    sender: 'user' | 'contact';
    senderName?: string;
  };
  reactions?: { emoji: string; count: number; users?: {id: string, name: string, avatar?: string}[] }[];
  isStarred?: boolean;
  attachments?: string[];
  scheduledFor?: string;
}

// Messages state by chat ID
export interface MessagesState {
  [chatId: string]: Message[];
}

// MessageProps type for compatibility with MessagesSection.tsx
export interface MessageProps extends Message {}

export interface ScheduledMessage {
  chatId: string;
  message: Message;
  scheduledTime: Date;
}

export type MessageHandler = (chatId: string, content: string) => Promise<void>;
export type MessageEditHandler = (chatId: string, messageId: string, newContent: string) => void;
export type MessageDeleteHandler = (chatId: string, messageId: string) => void;
export type MessageReplyHandler = (chatId: string, messageId: string) => void;
export type MessageScheduleHandler = (chatId: string, content: string, scheduledTime: Date) => void;
