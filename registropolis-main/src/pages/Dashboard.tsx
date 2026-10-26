import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import DashboardContentWrapper from '@/components/dashboard/DashboardContentWrapper';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Dashboard: React.FC = () => {
  const { section } = useParams<{ section?: string }>();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isLoading } = useAuth();

  const state = location.state as { section?: string } | null;
  const activeSection = section || state?.section || 'home';

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout
      withSidebar={true}
      fullWidth={activeSection === 'messages' || isMobile}
      maxWidth={isMobile ? 'full' : '2xl'}
      noAnimation={activeSection === 'messages'}
    >
      <DashboardContentWrapper initialSection={activeSection} />
    </AppLayout>
  );
};

export default Dashboard;
