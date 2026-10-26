import React from 'react';
import { useLocation } from 'react-router-dom';
import SidebarItem from './SidebarItem';
import { useAuth } from '@/context/AuthContext';
import { useUserListings } from '@/context/UserListingsContext';
import { useChatContext } from '@/context/ChatContext';

interface SidebarItemType {
  title: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  adminOnly?: boolean;
}

interface SidebarMenuProps {
  menuItems: SidebarItemType[];
  isCollapsed: boolean;
  onItemClick: () => void;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ menuItems, isCollapsed, onItemClick }) => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { totalCount } = useUserListings();
  const { totalUnread } = useChatContext();

  const items = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="space-y-0.5">
      {items.map(item => {
        const Icon = item.icon;
        const isActive =
          item.href === '/'
            ? location.pathname === '/'
            : location.pathname === item.href || location.pathname.startsWith(item.href + '/');
        const liveBadge =
          item.href === '/dashboard/messages' && totalUnread > 0
            ? String(totalUnread)
            : item.href === '/dashboard/my-listings' && totalCount > 0
            ? String(totalCount)
            : item.badge;
        return (
          <SidebarItem
            key={item.href}
            icon={<Icon size={18} />}
            title={item.title}
            href={item.href}
            badge={liveBadge}
            isActive={isActive}
            isCollapsed={isCollapsed}
            onClick={onItemClick}
          />
        );
      })}
    </div>
  );
};

export default SidebarMenu;
