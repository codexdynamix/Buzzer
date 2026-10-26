
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Truck, 
  MapPin,
  DollarSign,
  Users,
  Calendar,
  Loader2,
  Phone,
  Mail,
  Image as ImageIcon
} from 'lucide-react';

interface TransportListingFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const TransportListingForm: React.FC<TransportListingFormProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    location: '',
    capacity: '',
    availability: '',
    images: [] as string[],
    providerName: user?.name || '',
    contactPhone: user?.phoneNumber || '',
    contactEmail: user?.email || '',
    additionalInfo: ''
  });

  const categories = [
    "Moving",
    "Delivery",
    "Events",
    "Personal Transport",
    "Freight",
    "Courier",
    "Specialized"
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
    if (!formData.title || !formData.category || !formData.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    // Generate unique ID for this listing
    const transportId = `transport-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Simulate service posting with a slight delay
    setTimeout(() => {
      // Success notification
      toast({
        title: "Transport Service Listed Successfully",
        description: "Your transport service has been published and is now visible to users",
      });
      
      // Store service details in localStorage (in a real app this would go to a database)
      const transportServices = JSON.parse(localStorage.getItem('transportServices') || '[]');
      transportServices.push({
        id: transportId,
        ...formData,
        provider: formData.providerName,
        rating: 0,
        reviews: 0,
        postedBy: user?.id,
        postedAt: new Date().toISOString(),
        contactId: transportId,
        contactName: formData.providerName,
        followers: 0,
        verified: false
      });
      localStorage.setItem('transportServices', JSON.stringify(transportServices));
      
      setIsSubmitting(false);
      onClose();
      
      // Redirect to messages section
      navigate('/messages');
    }, 1500);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full md:max-w-md overflow-y-auto">
        <SheetHeader className="mb-5">
          <SheetTitle>List Transport Service</SheetTitle>
          <SheetDescription>
            Advertise your transport or delivery services to potential clients
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="title">Service Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Moving Truck with Driver"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                onValueChange={(value) => handleSelectChange('category', value)}
                value={formData.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Service Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your transport service in detail"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  name="price"
                  placeholder="e.g. $75/hour or $100 fixed"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Service Area *</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g. City-wide, 25 mile radius"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Vehicle/Capacity</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  placeholder="e.g. 2-ton truck, 14-passenger van"
                  value={formData.capacity}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Input
                  id="availability"
                  name="availability"
                  placeholder="e.g. 7 days a week, 24/7"
                  value={formData.availability}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vehicle Images</Label>
              <div className="border border-input rounded-md p-4 text-center">
                <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Upload images of your vehicles</p>
                <Button type="button" variant="outline" size="sm">
                  Add Images
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                name="additionalInfo"
                placeholder="Any additional details about your service, insurance coverage, etc."
                value={formData.additionalInfo}
                onChange={handleChange}
                rows={2}
              />
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Contact Information</p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="providerName">Service Provider Name *</Label>
                  <Input
                    id="providerName"
                    name="providerName"
                    value={formData.providerName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone Number *</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    required
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'List Service'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default TransportListingForm;
