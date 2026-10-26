
import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import UserProfile from './UserProfile';

interface UserProfileDialogProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileDialog: React.FC<UserProfileDialogProps> = ({ 
  userId, 
  isOpen, 
  onClose 
}) => {
  // Clean up any side effects when the dialog closes
  useEffect(() => {
    return () => {
      // This ensures any event listeners or state changes are cleaned up
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = () => {
    // Ensure proper cleanup before closing
    document.body.style.overflow = '';
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            View detailed information about this user
          </DialogDescription>
        </DialogHeader>
        <UserProfile id={userId} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;
