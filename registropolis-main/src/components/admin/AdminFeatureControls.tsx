
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  const [loadError, setLoadError] = React.useState('');

  React.useEffect(() => {
    let active = true;
    const loadControls = async () => {
      try {
        const fetchedControls = await getFeatureControls(featureId);
        if (active) setControls(fetchedControls);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Could not load feature settings';
        setLoadError(message);
        console.error(`Failed to load controls for ${featureName}:`, error);
      }
    };
    void loadControls();
    return () => { active = false; };
  }, [featureId, featureName]);

  const handleControlUpdate = async (updates: Partial<AdminFeatureControl>) => {
    if (!controls) return;
    const previousControls = controls;
    setControls({ ...controls, ...updates });
    try {
      await updateFeatureControls(featureId, updates);
      toast.success(`Updated controls for ${featureName}`);
    } catch (error) {
      setControls(previousControls);
      const message = error instanceof Error ? error.message : `Failed to update ${featureName} controls`;
      toast.error(message);
      console.error(`Failed to update controls for ${featureName}:`, error);
    }
  };

  if (loadError) return <div role="alert" className="text-sm text-destructive">{loadError}</div>;
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
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};
