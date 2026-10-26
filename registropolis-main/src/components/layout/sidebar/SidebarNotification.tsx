
import React from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarNotificationProps {
  isCollapsed?: boolean;
}

const SidebarNotification: React.FC<SidebarNotificationProps> = ({ isCollapsed = false }) => {
  return (
    <div className={cn("px-4 py-2", isCollapsed && "px-2")}>
      <div className={cn(
        "flex items-center gap-2 bg-primary/10 text-primary rounded-lg px-3 py-2",
        isCollapsed && "justify-center px-1"
      )}>
        <Bell size={16} />
        {!isCollapsed && <span className="text-sm font-medium">5 new notifications</span>}
      </div>
    </div>
  );
};

export default SidebarNotification;
