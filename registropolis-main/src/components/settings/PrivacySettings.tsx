
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Lock, Eye, Users, Clock, Save } from 'lucide-react';

const PrivacySettings: React.FC = () => {
  const [settings, setSettings] = useState({
    profileVisibility: "everyone",
    lastSeen: true,
    readReceipts: true,
    onlineStatus: true,
    groupsPermission: "everyone",
    blockList: ["user123", "user456"]
  });

  const handleSwitchChange = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleSelectChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    toast.success("Privacy settings updated successfully");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>Control who can see your information and how it's used</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="profileVisibility">Profile Visibility</Label>
              </div>
              <Select 
                value={settings.profileVisibility} 
                onValueChange={(value) => handleSelectChange('profileVisibility', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="contacts">Contacts Only</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Control who can see your profile information
            </p>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="lastSeen">Last Seen</Label>
              </div>
              <Switch 
                id="lastSeen" 
                checked={settings.lastSeen} 
                onCheckedChange={() => handleSwitchChange('lastSeen')} 
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Allow others to see when you were last online
            </p>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="readReceipts">Read Receipts</Label>
              </div>
              <Switch 
                id="readReceipts" 
                checked={settings.readReceipts} 
                onCheckedChange={() => handleSwitchChange('readReceipts')} 
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Send read receipts when you read messages
            </p>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="onlineStatus">Online Status</Label>
              </div>
              <Switch 
                id="onlineStatus" 
                checked={settings.onlineStatus} 
                onCheckedChange={() => handleSwitchChange('onlineStatus')} 
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Show when you're online to others
            </p>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="groupsPermission">Groups</Label>
              </div>
              <Select 
                value={settings.groupsPermission} 
                onValueChange={(value) => handleSelectChange('groupsPermission', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="contacts">Contacts Only</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Who can add you to groups
            </p>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" /> Blocked Contacts
          </h3>
          
          {settings.blockList.length > 0 ? (
            <div className="space-y-2">
              {settings.blockList.map(user => (
                <div key={user} className="flex items-center justify-between p-3 border rounded-md">
                  <span>{user}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSettings(prev => ({
                        ...prev,
                        blockList: prev.blockList.filter(u => u !== user)
                      }));
                      toast.success(`Unblocked ${user}`);
                    }}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No blocked contacts</p>
          )}
          
          <Button variant="outline" className="mt-4 w-full">
            Manage Blocked Contacts
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Privacy Settings
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PrivacySettings;
