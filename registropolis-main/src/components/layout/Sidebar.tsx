import React from 'react';
import { useSidebar } from '@/context/SidebarContext';
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarMenu from './sidebar/SidebarMenu';
import SidebarFooter from './sidebar/SidebarFooter';
import SidebarToggle from './sidebar/SidebarToggle';
import { useAuth } from '@/context/AuthContext';
import { mainMenuItems } from './sidebar/SidebarData';

const Sidebar: React.FC = () => {
  const { isCollapsed, toggleSidebar, sidebarWidth, sidebarTransitionClass } = useSidebar();
  const { signOut } = useAuth();

  const handleItemClick = () => {
    if (window.innerWidth < 1024) toggleSidebar();
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-50 h-full bg-white border-r border-slate-100 shadow-[1px_0_0_0_#f1f5f9] ${sidebarTransitionClass}`}
      style={{ width: `${sidebarWidth}px` }}
      data-testid="sidebar"
    >
      <div className="h-full flex flex-col">
        <SidebarHeader isCollapsed={isCollapsed} />
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 scrollbar-hide">
          <SidebarMenu
            menuItems={mainMenuItems}
            isCollapsed={isCollapsed}
            onItemClick={handleItemClick}
          />
        </div>
        <SidebarFooter
          isCollapsed={isCollapsed}
          onItemClick={handleItemClick}
          signOut={signOut}
        />
        <div className="absolute right-0 top-[46px] transform translate-x-1/2 z-10">
          <SidebarToggle />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
