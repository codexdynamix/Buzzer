import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';

export type NotificationType = 'message' | 'marketplace' | 'job' | 'event';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: Date;
  read: boolean;
  avatar?: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  unreadMessages: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'time' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  unreadMessages: 0,
  addNotification: () => {},
  markRead: () => {},
  markAllRead: () => {},
  dismiss: () => {},
  clearAll: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

/* ── Rich message push toast ───────────────────────────────── */
interface MessageToastProps {
  toastId: string | number;
  title: string;
  body: string;
  avatar?: string;
  onOpen: () => void;
}

const MessageToast: React.FC<MessageToastProps> = ({ toastId, title, body, avatar, onOpen }) => {
  const initials = title.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 16,
        backgroundColor: '#ffffff',
        boxShadow: '0 8px 32px rgba(15,25,35,0.14), 0 2px 8px rgba(15,25,35,0.08)',
        border: '1px solid #E8E2D8',
        width: 320,
        maxWidth: '100%',
        cursor: 'pointer',
        position: 'relative',
      }}
      onClick={() => {
        onOpen();
        toast.dismiss(toastId);
      }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {avatar ? (
          <img
            src={avatar}
            alt={title}
            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E8E2D8' }}
          />
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            backgroundColor: '#1A3353', color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700,
          }}>
            {initials}
          </div>
        )}
        {/* Green dot */}
        <span style={{
          position: 'absolute', bottom: 1, right: 1,
          width: 11, height: 11, borderRadius: '50%',
          backgroundColor: '#16A34A', border: '2px solid #ffffff',
        }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#C9A96E', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            💬 New Message
          </span>
          <span style={{ fontSize: 10, color: '#9CA3AF' }}>now</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0F1923', lineHeight: 1.3, marginBottom: 3 }}>
          {title}
        </p>
        <p style={{
          margin: 0, fontSize: 12, color: '#6E7A8A', lineHeight: 1.4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {body}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        style={{
          position: 'absolute', top: 10, right: 10,
          width: 20, height: 20, borderRadius: '50%',
          backgroundColor: '#F5F2EC', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: '#6E7A8A', lineHeight: 1,
          flexShrink: 0,
        }}
        onClick={e => { e.stopPropagation(); toast.dismiss(toastId); }}
      >
        ✕
      </button>
    </div>
  );
};

/* ── Provider ───────────────────────────────────────────────── */
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  const isOnMessages = location.pathname === '/dashboard/messages';

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
    const notification: AppNotification = {
      ...n,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      time: new Date(),
      read: false,
    };
    setNotifications(prev => [notification, ...prev].slice(0, 50));

    if (n.type === 'message') {
      if (isOnMessages) return;
      const toastId = notification.id;
      toast.custom(
        (id) => (
          <MessageToast
            toastId={id}
            title={n.title}
            body={n.body}
            avatar={n.avatar}
            onOpen={() => navigate('/dashboard/messages')}
          />
        ),
        {
          id: toastId,
          duration: 6000,
          position: 'top-right',
        }
      );
    } else {
      const icon = n.type === 'marketplace' ? '🛍️' : n.type === 'job' ? '💼' : '📅';
      toast(n.title, {
        description: n.body,
        icon,
        duration: 4000,
        position: 'top-right',
      });
    }
  }, [isOnMessages, navigate]);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadMessages = notifications.filter(n => !n.read && n.type === 'message').length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, unreadMessages, addNotification, markRead, markAllRead, dismiss, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};
