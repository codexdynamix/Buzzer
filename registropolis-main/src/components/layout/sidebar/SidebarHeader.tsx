import React from 'react';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface SidebarHeaderProps {
  isCollapsed: boolean;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ isCollapsed }) => {
  return (
    <div
      className={cn(
        'flex items-center h-[60px] px-4 border-b border-sidebar-border',
        isCollapsed ? 'justify-center' : 'justify-start gap-3'
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
      {!isCollapsed && (
        <div className="min-w-0">
          <span className="text-[15px] font-bold tracking-tight text-foreground">Buzzer</span>
          <span className="block text-[10px] text-muted-foreground font-medium tracking-widest uppercase leading-none mt-0.5">Community</span>
        </div>
      )}
    </div>
  );
};

export default SidebarHeader;
