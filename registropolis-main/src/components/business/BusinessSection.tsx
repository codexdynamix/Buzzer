
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  MapPin, 
  Star, 
  Filter, 
  Phone, 
  Mail, 
  Globe,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import RatingDisplay from '../common/RatingDisplay';
import SaveButton from '../common/SaveButton';
import VerificationBadge from '../common/VerificationBadge';
import FilterPanel from '../common/FilterPanel';

const businessData = [
  {
    id: "business-1",
    name: "Cafe Deluxe",
    category: "Restaurants",
    rating: 4.5,
    reviews: 127,
    location: "123 Main St, City",
    distance: "0.5 miles",
    image: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=500&auto=format&fit=crop",
    description: "A cozy cafe with excellent coffee and pastries. Perfect for breakfast meetings or casual lunches.",
    phone: "+1 555-123-4567",
    email: "info@cafedeluxe.com",
    website: "cafedeluxe.com",
    hours: "Mon-Fri: 7AM-6PM, Sat-Sun: 8AM-5PM",
    verified: true
  },
  {
    id: "business-2", // Changed from number to string to be consistent
    name: "Tech Solutions Inc",
    category: "Technology",
    rating: 4.2,
    reviews: 85,
    location: "456 Tech Ave, City",
    distance: "1.2 miles",
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=500&auto=format&fit=crop",
    description: "Professional IT services for small to medium businesses. Hardware support, software solutions, and cloud migration.",
    phone: "+1 555-987-6543",
    email: "support@techsolutions.com",
    website: "techsolutions.com",
    hours: "Mon-Fri: 9AM-5PM"
  },
  {
    id: "business-3", // Changed from number to string to be consistent
    name: "Green Gardens",
    category: "Home & Garden",
    rating: 4.8,
    reviews: 210,
    location: "789 Garden Rd, City",
    distance: "0.8 miles",
    image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=500&auto=format&fit=crop",
    description: "Landscaping services and garden center with a wide selection of plants, tools, and outdoor furniture.",
    phone: "+1 555-234-5678",
    email: "hello@greengardens.com",
    website: "greengardens.com",
    hours: "Mon-Sat: 8AM-7PM, Sun: 9AM-5PM"
  },
  {
    id: "business-4", // Changed from number to string to be consistent
    name: "Fitness First Gym",
    category: "Health & Fitness",
    rating: 4.3,
    reviews: 156,
    location: "101 Fitness Blvd, City",
    distance: "1.5 miles",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=500&auto=format&fit=crop",
    description: "Modern gym with state-of-the-art equipment, group classes, and personal training options.",
    phone: "+1 555-876-5432",
    email: "join@fitnessfirst.com",
    website: "fitnessfirst.com",
    hours: "Mon-Fri: 5AM-10PM, Sat-Sun: 7AM-8PM"
  },
  {
    id: "business-5", // Changed from number to string to be consistent
    name: "Legal Eagles Law Firm",
    category: "Professional Services",
    rating: 4.7,
    reviews: 92,
    location: "222 Legal Ave, City",
    distance: "2.1 miles",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=500&auto=format&fit=crop",
    description: "Full-service law firm specializing in business law, real estate, and family law matters.",
    phone: "+1 555-345-6789",
    email: "consult@legaleagles.com",
    website: "legaleagles.com",
    hours: "Mon-Fri: 9AM-6PM"
  }
];

const categories = [
  "All Categories",
  "Restaurants",
  "Technology",
  "Home & Garden",
  "Health & Fitness",
  "Professional Services",
  "Retail",
  "Entertainment"
];

const BusinessSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [isLoading, setIsLoading] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  
  const filterOptions = [
    {
      id: 'distance',
      label: 'Distance',
      type: 'range' as const,
      min: 0,
      max: 10,
      step: 0.5
    },
    {
      id: 'rating',
      label: 'Minimum Rating',
      type: 'select' as const,
      options: [
        { value: '3', label: '3+ Stars' },
        { value: '3.5', label: '3.5+ Stars' },
        { value: '4', label: '4+ Stars' },
        { value: '4.5', label: '4.5+ Stars' }
      ]
    },
    {
      id: 'verified',
      label: 'Verified Businesses Only',
      type: 'checkbox' as const,
      options: [{ value: 'true', label: 'Show verified businesses only' }]
    }
  ];

  const handleFilterChange = (filters: Record<string, any>) => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setSelectedCategory(filters.category || 'All Categories');
      setAppliedFilters(filters);
      setIsLoading(false);
    }, 500);
  };
  
  const filteredBusinesses = businessData.filter(business => {
    const matchesQuery = business.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         business.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All Categories' || business.category === selectedCategory;
    
    // Additional filter logic based on appliedFilters
    const matchesDistance = !appliedFilters.distance || 
      (parseFloat(business.distance) <= appliedFilters.distance[1]);
    
    const matchesRating = !appliedFilters.rating || 
      business.rating >= parseFloat(appliedFilters.rating);
    
    const matchesVerification = !appliedFilters.verified || 
      (!appliedFilters.verified || business.verified);
    
    return matchesQuery && matchesCategory && matchesDistance && matchesRating && matchesVerification;
  });

  const handleViewDetails = (businessId: string) => {
    toast.info("Opening business details");
    // In a real app, you'd navigate to a business details page
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Business Directory</h1>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search businesses..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <FilterPanel 
          categories={categories}
          filters={filterOptions}
          onFilterChange={handleFilterChange}
        />
      </div>
      
      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          {isLoading ? (
            <div className="h-60 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredBusinesses.length > 0 ? (
            filteredBusinesses.map(business => (
              <Card key={business.id} className="overflow-hidden group">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4 h-48 md:h-auto relative">
                    <img 
                      src={business.image} 
                      alt={business.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <SaveButton 
                        itemId={business.id.toString()} 
                        itemType="service"
                      />
                    </div>
                  </div>
                  <div className="md:w-3/4 flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {business.name}
                            {business.verified && (
                              <VerificationBadge isVerified={business.verified} />
                            )}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <div className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                              {business.category}
                            </div>
                            <RatingDisplay rating={business.rating} reviews={business.reviews} />
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {business.distance}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{business.description}</p>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          {business.phone}
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          {business.email}
                        </div>
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                          {business.website}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4">
                      <div className="text-sm">
                        <span className="font-medium">Hours:</span> {business.hours}
                      </div>
                      <Button 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => handleViewDetails(business.id.toString())}
                      >
                        View Details <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-lg text-muted-foreground">No businesses found matching your search criteria.</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="map">
          <Card className="h-[600px] flex items-center justify-center">
            <CardContent className="text-center p-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl font-medium mb-2">Map View</p>
              <p className="text-muted-foreground">Map integration will show businesses on an interactive map here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessSection;
