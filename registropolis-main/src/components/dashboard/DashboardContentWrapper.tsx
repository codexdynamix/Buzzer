import React from 'react';
import DashboardContent from './DashboardContent';

interface DashboardContentWrapperProps {
  initialSection?: string;
}

const DashboardContentWrapper: React.FC<DashboardContentWrapperProps> = ({
  initialSection = 'messages',
}) => {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <DashboardContent activeSection={initialSection} />
    </div>
  );
};

export default DashboardContentWrapper;
