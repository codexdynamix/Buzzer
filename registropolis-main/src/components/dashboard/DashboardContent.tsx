import React from 'react';
import DashboardSection from './DashboardSection';

interface DashboardContentProps {
  activeSection: string;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ activeSection }) => {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <DashboardSection activeSection={activeSection} />
    </div>
  );
};

export default DashboardContent;
