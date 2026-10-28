
import React from 'react';
import { APP_FEATURES, FEATURE_DESCRIPTIONS } from '@/config/features';
import { FeatureControls } from './AdminFeatureControls';
import { initializeFeatureControls } from '@/lib/adminFeatureControls';

const AdminFeatures: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');

  React.useEffect(() => {
    let active = true;
    initializeFeatureControls()
      .catch(error => {
        console.error('Failed to initialize feature controls:', error);
        if (active) setLoadError(error instanceof Error ? error.message : 'Could not load feature settings');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  if (isLoading) return <div className="p-6">Loading feature settings...</div>;
  if (loadError) {
    return <div role="alert" className="p-6 text-destructive">Feature settings could not be loaded: {loadError}</div>;
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Feature Management</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(APP_FEATURES).map(([key, feature]) => (
          <FeatureControls
            key={feature}
            featureId={feature}
            featureName={key}
            description={FEATURE_DESCRIPTIONS[feature]}
          />
        ))}
      </div>
    </div>
  );
};

export default AdminFeatures;
