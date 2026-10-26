
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';

const SidebarToggle: React.FC = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  
  return (
    <Button
      variant="outline"
      size="icon"
      className="h-8 w-8 rounded-full bg-background shadow-md border"
      onClick={toggleSidebar}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {isCollapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
    </Button>
  );
};

export default SidebarToggle;
