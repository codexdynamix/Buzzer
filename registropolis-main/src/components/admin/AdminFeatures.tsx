
import React from 'react';
import { APP_FEATURES, FEATURE_DESCRIPTIONS } from '@/config/features';
import { toast } from 'sonner';
import { FeatureControls } from './AdminFeatureControls';

const AdminFeatures: React.FC = () => {
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
