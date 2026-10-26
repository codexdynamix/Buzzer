
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileSettings from './ProfileSettings';
import PrivacySettings from './PrivacySettings';
import ChatSettings from './ChatSettings';
import { User, Lock, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";

const SettingsSection: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract active section from URL query parameter - with safety fallback
  const getActiveSection = () => {
    try {
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab');
      if (tab && ['profile', 'privacy', 'chat'].includes(tab)) {
        return tab;
      }
    } catch (error) {
      console.error("Error parsing URL params:", error);
    }
    return 'profile'; // Default tab
  };

  const activeSection = getActiveSection();

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard', { replace: true });
  };

  // Get icon for current section
  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'profile':
        return <User className="h-5 w-5" />;
      case 'privacy':
        return <Lock className="h-5 w-5" />;
      case 'chat':
        return <MessageSquare className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  // Render the appropriate content based on activeSection
  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSettings user={user} />;
      case 'privacy':
        return <PrivacySettings />;
      case 'chat':
        return <ChatSettings />;
      default:
        return <ProfileSettings user={user} />;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto h-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          {getSectionIcon(activeSection)}
          <h1 className="text-2xl font-bold ml-2">{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Settings</h1>
        </div>
        <Button 
          variant="outline"
          onClick={handleBackToDashboard}
        >
          Back to Dashboard
        </Button>
      </div>
      
      <div className="w-full">
        {renderContent()}
      </div>
    </div>
  );
};

export default SettingsSection;
