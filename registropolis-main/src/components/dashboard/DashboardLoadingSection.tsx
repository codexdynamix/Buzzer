
import React from 'react';
import { Loader2 } from 'lucide-react';

const DashboardLoadingSection: React.FC = () => {
  return (
    <div className="w-full h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading content...</p>
      </div>
    </div>
  );
};

export default DashboardLoadingSection;
