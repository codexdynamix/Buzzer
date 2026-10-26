
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const AppearanceSettings: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>The application uses light mode for optimal visibility</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Light mode is enabled by default for all users.
        </p>
      </CardContent>
    </Card>
  );
};

export default AppearanceSettings;
