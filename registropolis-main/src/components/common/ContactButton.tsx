
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ButtonProps } from "@/components/ui/button";
import { MessageCircle } from 'lucide-react';
import { useChatSelection } from '@/hooks/useChatSelection';
import { useToast } from '@/hooks/use-toast';
import { useMessages } from '@/hooks/useMessages';
import { BusinessMessageProps } from '../messages/business/BusinessMessageTemplate';
import { useGuestGate } from '@/context/GuestGateContext';

interface ContactButtonProps extends ButtonProps {
  contactId: string;
  contactName: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  productInfo?: {
    title: string;
    price: string;
    image?: string;
    id: string | number;
  };
  businessMessage?: Omit<BusinessMessageProps, 'onButtonClick'>;
}

const ContactButton: React.FC<ContactButtonProps> = ({
  contactId,
  contactName,
  variant = "default",
  size = "default",
  className,
  productInfo,
  businessMessage,
  ...props
}) => {
  const navigate = useNavigate();
  const { selectChat } = useChatSelection();
  const { loadInitialMessages, simulateProductInquiry } = useMessages();
  const { toast } = useToast();
  const { requireAuth } = useGuestGate();

  const handleContact = () => {
    if (!requireAuth()) return;
    console.log("Contact button clicked for:", contactName, "ID:", contactId);
    
    // If product info is available, prepare the product inquiry
    if (productInfo) {
      simulateProductInquiry(contactId, productInfo.title, productInfo.price);
    }
    
    // If business message template is available, it would be handled here
    // (This would integrate with the backend in a real implementation)
    if (businessMessage) {
      toast({
        title: "Business message prepared",
        description: `Business message about ${businessMessage.title} ready to send`,
      });
    }
    
    // Load initial messages for this contact
    loadInitialMessages(contactId);
    
    // Show a toast to confirm the action
    toast({
      title: "Opening chat",
      description: `Connecting with ${contactName}`,
    });
    
    // Force navigation to messages route first
    navigate('/messages');
    
    // Use a delay to ensure navigation completes and MessagesSection is mounted
    setTimeout(() => {
      // Update the selected chat
      selectChat(contactId);
      
      // Now navigate to the specific chat
      setTimeout(() => {
        navigate(`/messages/${contactId}`);
      }, 50);
    }, 150);
  };

  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={handleContact}
      className={className}
      {...props}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      Contact
    </Button>
  );
};

export default ContactButton;
