
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export function useChatSelection() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<string | null>(chatId || null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeTab, setActiveTab] = useState<'personal' | 'groups'>('personal');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);

  // Effect to sync URL params with selected chat
  useEffect(() => {
    if (chatId && chatId !== selectedChat) {
      console.log("Setting selected chat from URL param:", chatId);
      setSelectedChat(chatId);
    }
  }, [chatId, selectedChat]);

  const selectChat = (chatId: string, isGroup = false) => {
    console.log("Selecting chat:", chatId);
    
    // Update state immediately
    setSelectedChat(chatId);
    
    if (isGroup) {
      setActiveTab('groups');
    } else {
      setActiveTab('personal');
    }
    
    // Check if we're already on the chat page to avoid redundant navigation
    const currentPath = window.location.pathname;
    const targetPath = `/messages/${chatId}`;
    
    console.log("Current path:", currentPath);
    console.log("Target path:", targetPath);
    
    if (currentPath !== targetPath) {
      console.log("Navigating to chat:", targetPath);
      
      // Clear any leftover event handlers that might interfere with navigation
      setTimeout(() => {
        navigate(targetPath);
      }, 10);
    }
    
    // Return the chatId for chaining
    return chatId;
  };

  return {
    selectedChat,
    setSelectedChat,
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    showCreateGroup,
    setShowCreateGroup,
    showJoinGroup,
    setShowJoinGroup,
    selectChat
  };
}
