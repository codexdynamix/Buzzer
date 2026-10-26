
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const ChatSettings: React.FC = () => {
  const [fontSize, setFontSize] = useState("medium");
  
  // Load saved font size on component mount
  useEffect(() => {
    const savedFontSize = localStorage.getItem("chatFontSize");
    if (savedFontSize) {
      setFontSize(savedFontSize);
    }
  }, []);

  const handleSave = () => {
    // Save font size settings
    localStorage.setItem("chatFontSize", fontSize);
    toast({
      title: "Settings saved",
      description: "Your chat font size preference has been updated",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat Settings</CardTitle>
        <CardDescription>Customize your chat experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="font-size">Font Size</Label>
          <Select value={fontSize} onValueChange={setFontSize}>
            <SelectTrigger id="font-size" className="w-full">
              <SelectValue placeholder="Select font size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave}>Save Settings</Button>
      </CardContent>
    </Card>
  );
};

export default ChatSettings;
