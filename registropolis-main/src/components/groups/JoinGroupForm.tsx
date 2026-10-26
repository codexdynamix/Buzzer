
import React, { useState } from 'react';
import { LogIn, UserPlus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface JoinGroupFormProps {
  onGroupJoined: (groupId: string) => void;
  onCancel: () => void;
}

const JoinGroupForm: React.FC<JoinGroupFormProps> = ({ onGroupJoined, onCancel }) => {
  const { toast } = useToast();
  const [groupCode, setGroupCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupCode.trim()) {
      toast({
        title: "Group code required",
        description: "Please enter a valid group code",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // In a real app, this would be an API call to join the group
    setTimeout(() => {
      // Simple validation - in a real app, this would check against the database
      if (groupCode.length < 5) {
        toast({
          title: "Invalid code",
          description: "The group code you entered is invalid",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      toast({
        title: "Group joined",
        description: "You've successfully joined the group!",
      });
      onGroupJoined(groupCode);
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="p-4 bg-card border rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Join a Group
        </h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-code">Group Code</Label>
            <Input
              id="group-code"
              placeholder="Enter group invite code"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              Enter the group invite code shared with you
            </p>
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Joining..." : "Join Group"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default JoinGroupForm;
