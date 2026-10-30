
import React from 'react';
import { Button, ButtonProps } from "@/components/ui/button";
import { MessageCircle } from 'lucide-react';
import { useChatContext } from '@/context/ChatContext';

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
}

const ContactButton: React.FC<ContactButtonProps> = ({
  contactId,
  contactName,
  variant = "default",
  size = "default",
  className,
  productInfo,
  ...props
}) => {
  const { openChatWithListing } = useChatContext();

  const handleContact = () => {
    openChatWithListing({
      sellerId: contactId,
      sellerName: contactName,
      listingId: String(productInfo?.id ?? contactId),
      listingTitle: productInfo?.title ?? contactName,
      listingPrice: productInfo?.price ?? '',
      listingImage: productInfo?.image,
      listingCategory: 'Real Estate',
    });
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
