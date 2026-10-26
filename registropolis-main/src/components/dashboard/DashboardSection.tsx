import React, { Suspense } from 'react';
import DashboardLoadingSection from './DashboardLoadingSection';

const HomeSection       = React.lazy(() => import('../home/HomeSection'));
const ReelsSection      = React.lazy(() => import('../reels/ReelsSection'));
const MessagesSection   = React.lazy(() => import('../messages/MessagesSection'));
const MarketplaceSection = React.lazy(() => import('../marketplace/MarketplaceSection'));
const JobsSection       = React.lazy(() => import('../jobs/JobsSection'));
const ServicesSection   = React.lazy(() => import('../services/ServicesSection'));
const RealEstateSection = React.lazy(() => import('../real-estate/RealEstateSection'));
const TransportSection  = React.lazy(() => import('../transport/TransportSection'));
const EventsSection     = React.lazy(() => import('../events/EventsSection'));
const MyListingsSection = React.lazy(() => import('../my-listings/MyListingsSection'));
const SettingsSection   = React.lazy(() => import('../settings/SettingsSection'));
const BusinessSection   = React.lazy(() => import('../business/BusinessSection'));

interface DashboardSectionProps {
  activeSection: string;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({ activeSection }) => {
  const isMessages = activeSection === 'messages' || activeSection === 'reels';

  const renderSection = () => {
    switch (activeSection) {
      case 'home':        return <HomeSection />;
      case 'reels':       return <ReelsSection />;
      case 'messages':    return <MessagesSection />;
      case 'marketplace': return <MarketplaceSection />;
      case 'jobs':        return <JobsSection />;
      case 'services':    return <ServicesSection />;
      case 'real-estate': return <RealEstateSection />;
      case 'transport':   return <TransportSection />;
      case 'events':      return <EventsSection />;
      case 'my-listings': return <MyListingsSection />;
      case 'settings':    return <SettingsSection />;
      case 'business':    return <BusinessSection />;
      default:            return <MessagesSection />;
    }
  };

  return (
    <Suspense fallback={<DashboardLoadingSection />}>
      {/*
       * Messages: flex-1 flex flex-col overflow-hidden
       *   — the section fills all remaining flex space; MessagesSection
       *     manages its own internal scroll (header fixed, messages scroll,
       *     input fixed). No bottom padding — nav is the draggable FAB.
       *
       * All other sections: flex-1 overflow-y-auto pb-20
       *   — section fills remaining flex space and scrolls vertically.
       *     pb-20 keeps the last item above the floating nav FAB.
       */}
      <div
        className={
          isMessages
            ? 'flex-1 min-h-0 flex flex-col overflow-hidden'
            : 'flex-1 overflow-y-auto pb-20'
        }
      >
        {renderSection()}
      </div>
    </Suspense>
  );
};

export default DashboardSection;
