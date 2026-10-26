
import React from 'react';
import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ContactButton from '../common/ContactButton';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Maximize, 
  Heart,
  Share2,
  Calendar
} from 'lucide-react';

export type PropertyType = 'all' | 'hotel' | 'motel' | 'lodge' | 'apartment' | 'house' | 'villa' | 'room' | 'condo' | 'commercial' | 'townhouse';

export interface PropertyListing {
  id: string;
  title: string;
  price: string;
  listingType: 'rent' | 'sale' | 'daily';
  propertyType: PropertyType | string;
  location: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  yearBuilt: number;
  description: string;
  amenities: string;
  listedDate: string;
  images: string[];
  contactId: string;
  contactName: string;
  dailyRate?: number;
  minStay?: number;
  maxStay?: number;
  instantBook?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicy?: string;
  isFavorite?: boolean;
}

interface PropertyCardProps {
  property: PropertyListing;
  onFavorite?: (id: string) => void;
  onShare?: (id: string) => void;
  onContact?: (contactId: string, propertyId: string) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ 
  property,
  onFavorite = () => {},
  onShare = () => {},
  onContact
}) => {
  const handleContact = () => {
    if (onContact) {
      onContact(property.contactId, property.id);
    }
  };

  return (
    <Card key={property.id} className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="relative">
        {property.images && property.images.length > 0 && (
          <div className="aspect-video">
            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
            <Badge 
              className="absolute top-2 left-2"
              variant={
                property.listingType === 'rent' ? 'secondary' : 
                property.listingType === 'daily' ? 'outline' : 'default'
              }
            >
              {property.listingType === 'rent' ? 'For Rent' : 
               property.listingType === 'daily' ? 'Daily Rental' : 'For Sale'}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`absolute top-2 right-2 bg-white/80 hover:bg-white/90 rounded-full h-8 w-8 ${
                property.isFavorite ? 'text-red-500' : ''
              }`}
              onClick={() => onFavorite(property.id)}
            >
              <Heart className={`h-4 w-4 ${property.isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">{property.title}</CardTitle>
          <span className="font-bold text-lg">{property.price}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <MapPin className="h-3.5 w-3.5 mr-1" /> 
          {property.location}
        </div>
      </CardHeader>
      
      <CardContent className="pb-2 flex-1">
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            <Bed className="h-4 w-4 mr-1" />
            <span className="text-sm">{property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
          </div>
          <div className="flex items-center">
            <Bath className="h-4 w-4 mr-1" />
            <span className="text-sm">{property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
          </div>
          <div className="flex items-center">
            <Maximize className="h-4 w-4 mr-1" />
            <span className="text-sm">{property.area} ft²</span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2">{property.description}</p>
        
        {property.listingType === 'daily' && property.checkInTime && (
          <div className="mt-2 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <span>Check-in: {property.checkInTime}, Check-out: {property.checkOutTime}</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Listed {property.listedDate}</span>
          <span>{property.yearBuilt ? `Built ${property.yearBuilt}` : ''}</span>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 mt-auto border-t">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={() => onShare(property.id)}
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <ContactButton 
          contactId={property.contactId} 
          contactName={property.contactName} 
          size="sm"
          onClick={handleContact}
        />
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;
