
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateFeatureControls, getFeatureControls, AdminFeatureControl } from '@/lib/adminFeatureControls';
import { toast } from 'sonner';

interface FeatureControlsProps {
  featureId: string;
  featureName: string;
  description: string;
}

export const FeatureControls: React.FC<FeatureControlsProps> = ({
  featureId,
  featureName,
  description
}) => {
  const [controls, setControls] = React.useState<AdminFeatureControl | null>(null);

  React.useEffect(() => {
    const loadControls = async () => {
      const fetchedControls = await getFeatureControls(featureId);
      setControls(fetchedControls);
    };
    loadControls();
  }, [featureId]);

  const handleControlUpdate = async (updates: Partial<AdminFeatureControl>) => {
    try {
      await updateFeatureControls(featureId, updates);
      toast.success(`Updated controls for ${featureName}`);
      
      // Refresh controls
      const updatedControls = await getFeatureControls(featureId);
      setControls(updatedControls);
    } catch (error) {
      toast.error(`Failed to update ${featureName} controls`);
    }
  };

  if (!controls) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{featureName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Enable Feature</Label>
          <Switch
            checked={controls.enabled}
            onCheckedChange={(checked) => handleControlUpdate({ enabled: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Moderation Required</Label>
          <Switch
            checked={controls.moderationEnabled}
            onCheckedChange={(checked) => handleControlUpdate({ moderationEnabled: checked })}
          />
        </div>

        {controls.moderationEnabled && (
          <div className="space-y-2">
            <Label>Max Daily Submissions</Label>
            <Input
              type="number"
              value={controls.moderationRules?.maxDailySubmissions || 0}
              onChange={(e) => handleControlUpdate({
                moderationRules: {
                  ...controls.moderationRules,
                  maxDailySubmissions: parseInt(e.target.value)
                }
              })}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
