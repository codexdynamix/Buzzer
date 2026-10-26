
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  sidebarWidth: number;
  contentMargin: number;
  sidebarTransitionClass: string;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize to collapsed on mobile by default (screen width less than 1024px)
    return window.innerWidth < 1024;
  });
  const location = useLocation();

  // Calculate sidebar width based on collapsed state (in pixels for exact calculations)
  const sidebarWidth = isCollapsed ? 64 : 256;
  const contentMargin = sidebarWidth; // Content should be offset by sidebar width
  const sidebarTransitionClass = 'transition-all duration-300 ease-in-out';

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    
    // Dispatch custom event for other components to listen
    const event = new CustomEvent('sidebarToggle', { 
      detail: { isCollapsed: !isCollapsed } 
    });
    window.dispatchEvent(event);
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    
    // Dispatch custom event
    const event = new CustomEvent('sidebarToggle', { 
      detail: { isCollapsed: collapsed } 
    });
    window.dispatchEvent(event);
  };

  // Auto-collapse sidebar on mobile when location changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  }, [location.pathname]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Collapse sidebar on mobile, but only if it's currently expanded
      if (window.innerWidth < 1024 && !isCollapsed) {
        setIsCollapsed(true);
        
        // Dispatch custom event
        const event = new CustomEvent('sidebarToggle', { 
          detail: { isCollapsed: true } 
        });
        window.dispatchEvent(event);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

  return (
    <SidebarContext.Provider value={{ 
      isCollapsed, 
      toggleSidebar, 
      setSidebarCollapsed,
      sidebarWidth,
      contentMargin,
      sidebarTransitionClass 
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
