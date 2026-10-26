import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Phone, Mail, MapPin, Calendar, Star, MessageCircle, 
  Award, Shield, Briefcase, Users, Clock
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatsAndGroups } from '@/hooks/useChatsAndGroups';
import { useChatSelection } from '@/hooks/useChatSelection';
import { useToast } from '@/hooks/use-toast';
import { useMessages } from '@/hooks/useMessages';

interface BusinessDetails {
  type: string;
  name: string;
  description: string;
  details: Record<string, any>;
}

interface UserProfileProps {
  id?: string;
  onClose?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ id: propId, onClose }) => {
  const { userId } = useParams<{ userId: string }>();
  const id = propId || userId;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getBusinessDetails, businessUsers, addBusinessContact } = useChatsAndGroups(() => {});
  const { selectChat } = useChatSelection();
  const { loadInitialMessages } = useMessages();
  
  if (!id) {
    return <div className="p-4">User not found</div>;
  }
  
  // Find the business user with this ID
  const businessUser = businessUsers.find(user => user.id === id);
  
  if (!businessUser) {
    return <div className="p-4">User profile not found</div>;
  }
  
  const { name, role, business } = businessUser;
  
  // Handle messaging the user
  const handleContactUser = () => {
    // Make sure we clean up first
    if (onClose) onClose();
    
    // Add user to contacts if not already there
    if (business) {
      addBusinessContact(id, name, role || business.name, business.type);
    }
    
    // Load initial messages for this contact
    loadInitialMessages(id);
    
    // Use setTimeout to ensure the dialog is fully closed before navigation
    setTimeout(() => {
      // Navigate to messages
      navigate('/messages');
      // Use another small delay to ensure the above navigation completes
      setTimeout(() => {
        selectChat(id);
        navigate(`/messages/${id}`);
      }, 50);
    }, 50);
    
    toast({
      title: "Chat opened",
      description: `You are now chatting with ${name}`
    });
  };
  
  // Handle adding to favorites with proper cleanup
  const handleAddToFavorites = () => {
    if (onClose) onClose();
    
    toast({
      title: "Added to favorites",
      description: `${name} has been added to your favorites`
    });
  };
  
  // Function to render business details based on type
  const renderBusinessDetails = (business: BusinessDetails) => {
    switch (business.type) {
      case 'restaurant':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Cuisine</h3>
              <p>{business.details.cuisine}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Price Range</h3>
              <p>{business.details.priceRange}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
              <p>{business.details.address}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Hours</h3>
              <p>{business.details.hours}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Specialties</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {business.details.specialties.map((specialty: string, index: number) => (
                  <Badge key={index} variant="outline">{specialty}</Badge>
                ))}
              </div>
            </div>
          </div>
        );
      case 'taxi':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Vehicle</h3>
              <p>{business.details.vehicleYear} {business.details.vehicleModel}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">License Plate</h3>
              <p>{business.details.licensePlate}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Experience</h3>
              <p>{business.details.experience}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Rate</h3>
              <p>{business.details.perMileRate} per mile</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Service Areas</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {business.details.areas.map((area: string, index: number) => (
                  <Badge key={index} variant="outline">{area}</Badge>
                ))}
              </div>
            </div>
          </div>
        );
      case 'job':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Industry</h3>
              <p>{business.details.industry}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Open Positions</h3>
              <div className="space-y-2 mt-1">
                {business.details.openPositions.map((position: any, index: number) => (
                  <Card key={index} className="p-3">
                    <div className="font-medium">{position.title}</div>
                    <div className="text-sm text-muted-foreground">{position.salary}</div>
                    <div className="text-sm mt-1">{position.description}</div>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Benefits</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {business.details.benefits.map((benefit: string, index: number) => (
                  <Badge key={index} variant="outline">{benefit}</Badge>
                ))}
              </div>
            </div>
          </div>
        );
      case 'event':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Event Types</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {business.details.eventTypes.map((type: string, index: number) => (
                  <Badge key={index} variant="outline">{type}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Upcoming Events</h3>
              <div className="space-y-2 mt-1">
                {business.details.upcomingEvents.map((event: any, index: number) => (
                  <Card key={index} className="p-3">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-muted-foreground">{event.date} - {event.location}</div>
                    <div className="text-sm mt-1">{event.description}</div>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Experience</h3>
              <p>{business.details.experience}</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-sm text-muted-foreground">
            No detailed information available for this business type.
          </div>
        );
    }
  };

  // Business-specific background color
  const businessTypeColors: Record<string, string> = {
    restaurant: 'bg-orange-50',
    taxi: 'bg-yellow-50',
    event: 'bg-purple-50',
    job: 'bg-blue-50',
    marketplace: 'bg-green-50',
    realestate: 'bg-red-50',
    service: 'bg-indigo-50',
    default: 'bg-gray-50'
  };
  
  const bgColor = business ? businessTypeColors[business.type] || businessTypeColors.default : '';
  
  return (
    <div className={`max-w-2xl mx-auto p-4 ${bgColor}`}>
      <Card>
        <CardHeader className="relative pb-0">
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={`https://i.pravatar.cc/150?img=${parseInt(id) * 5}`} alt={name} />
              <AvatarFallback className="text-2xl bg-primary/10">{name.charAt(0)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-center">{name}</CardTitle>
            
            {role && (
              <Badge className="mt-2" variant="outline">
                {role}
              </Badge>
            )}
            
            {business && (
              <div className="mt-2 text-center">
                <Badge className="mb-2" variant="secondary">
                  {business.type.charAt(0).toUpperCase() + business.type.slice(1)} Business
                </Badge>
                <p className="text-sm text-muted-foreground">{business.description}</p>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="flex justify-center gap-2 mb-6">
            <Button onClick={handleContactUser} className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Message
            </Button>
            <Button onClick={handleAddToFavorites} variant="outline" className="gap-2">
              <Star className="h-4 w-4" />
              Add to Favorites
            </Button>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>+1 (555) {id}00-{id}000</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{name.toLowerCase().replace(' ', '.')}@example.com</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Member since January 2023</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-primary">Verified Account</span>
            </div>
          </div>
          
          {business && (
            <>
              <Separator className="my-4" />
              <h2 className="text-lg font-semibold mb-4">Business Information</h2>
              {renderBusinessDetails(business)}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
