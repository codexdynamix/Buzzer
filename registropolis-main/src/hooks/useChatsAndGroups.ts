import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ChatItemProps } from '@/components/messages/ChatItem';
import { GroupChatProps } from '@/components/groups/GroupChat';

// Define a more detailed user type with business roles
interface BusinessUser {
  id: string;
  name: string;
  role?: string;
  business?: {
    type: 'restaurant' | 'taxi' | 'event' | 'job' | 'marketplace' | 'realestate' | 'service';
    name: string;
    description: string;
    details: Record<string, any>; // Additional business-specific details
  };
}

const businessUsers: BusinessUser[] = [];
const initialChats: ChatItemProps[] = [];
const initialGroups: GroupChatProps[] = [];

export const getBusinessDetails = (userId: string, businessType?: string) =>
  businessUsers.find(user => user.id === userId && (!businessType || user.business?.type === businessType));

export const getBusinessesByType = (type: string) =>
  businessUsers.filter(user => user.business?.type === type);

export function useChatsAndGroups(onChatSelect: (chatId: string, isGroup: boolean) => void) {
  const { toast } = useToast();
  const [chats, setChats] = useState<ChatItemProps[]>(() => 
    initialChats.map(chat => ({
      ...chat,
      onClick: () => onChatSelect(chat.id, false)
    }))
  );
  
  const [groups, setGroups] = useState<GroupChatProps[]>(() => 
    initialGroups.map(group => ({
      ...group,
      onClick: () => onChatSelect(group.id, true)
    }))
  );

  const handleCreateGroup = (groupId: string, name: string = "New Group") => {
    const newGroup: GroupChatProps = {
      id: groupId,
      name: name,
      memberCount: 1,
      time: "Just now",
      unread: 0,
      onClick: () => onChatSelect(groupId, true)
    };

    setGroups(prev => [newGroup, ...prev]);
    
    toast({
      title: "Group created",
      description: `${name} has been created successfully`,
    });
    
    return groupId;
  };

  const handleJoinGroup = (groupId: string, name: string = "Joined Group") => {
    const newGroup: GroupChatProps = {
      id: groupId,
      name: name,
      memberCount: 1,
      time: "Just now",
      unread: 0,
      onClick: () => onChatSelect(groupId, true)
    };

    setGroups(prev => [newGroup, ...prev]);
    
    toast({
      title: "Group joined",
      description: `You've joined ${name} successfully`,
    });
    
    return groupId;
  };
  
  // Add a new business user/contact to the chat list
  const addBusinessContact = (
    businessId: string, 
    name: string, 
    businessInfo: string, 
    businessType: string
  ) => {
    const newContact: ChatItemProps = {
      id: businessId,
      name: name,
      businessInfo: businessInfo,
      businessType: businessType as any,
      verified: false,
      message: "",
      time: "Just now",
      unread: 0,
      isOnline: false,
      imageUrl: "",
      onClick: () => onChatSelect(businessId, false)
    };
    
    // Check if this contact already exists
    const existingContact = chats.find(chat => chat.id === businessId);
    
    if (!existingContact) {
      setChats(prev => [newContact, ...prev]);
      
      toast({
        title: "New business contact",
        description: `${name} has been added to your chats`,
      });
    }
    
    return businessId;
  };

  return {
    chats,
    groups,
    businessUsers,
    getBusinessDetails,
    getBusinessesByType,
    handleCreateGroup,
    handleJoinGroup,
    addBusinessContact
  };
}
