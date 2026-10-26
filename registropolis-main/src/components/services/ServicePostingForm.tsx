
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
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Wrench, 
  MapPin,
  DollarSign,
  Clock,
  Calendar,
  FileCheck,
  Loader2,
  User,
  Phone,
  Mail,
  Globe,
  Image as ImageIcon
} from 'lucide-react';

interface ServicePostingFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const ServicePostingForm: React.FC<ServicePostingFormProps> = ({ isOpen, onClose }) => {
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
    availability: '',
    experience: '',
    qualifications: '',
    images: [] as string[],
    providerName: user?.name || '',
    contactPhone: user?.phoneNumber || '',
    contactEmail: user?.email || '',
    website: ''
  });

  const categories = [
    "Cleaning",
    "Electrical",
    "Plumbing",
    "Landscaping",
    "Carpentry",
    "Painting",
    "Events",
    "Tutoring",
    "IT Support",
    "Moving",
    "Other"
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

    // Generate unique ID for this service
    const serviceId = `service-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Simulate service posting with a slight delay
    setTimeout(() => {
      // Success notification
      toast({
        title: "Service Posted Successfully",
        description: "Your service has been published and is now visible to users",
      });
      
      // Store service details in localStorage (in a real app this would go to a database)
      const services = JSON.parse(localStorage.getItem('services') || '[]');
      services.push({
        id: serviceId,
        ...formData,
        provider: formData.providerName,
        rating: 0,
        reviews: 0,
        distance: "New",
        postedBy: user?.id,
        postedAt: new Date().toISOString(),
        contactId: serviceId,
        contactName: formData.providerName,
        followers: 0,
        verified: false
      });
      localStorage.setItem('services', JSON.stringify(services));
      
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
          <SheetTitle>Post a Service</SheetTitle>
          <SheetDescription>
            Advertise your professional services to potential clients
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
                placeholder="e.g. Professional House Cleaning"
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
                placeholder="Describe your service in detail"
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
                  placeholder="e.g. $25/hour or $100-$200"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Service Area</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g. Downtown, 5 mile radius"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Input
                  id="availability"
                  name="availability"
                  placeholder="e.g. Mon-Fri 9AM-5PM"
                  value={formData.availability}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Experience</Label>
                <Input
                  id="experience"
                  name="experience"
                  placeholder="e.g. 5+ years"
                  value={formData.experience}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualifications">Qualifications & Certifications</Label>
              <Textarea
                id="qualifications"
                name="qualifications"
                placeholder="List relevant qualifications, licenses, or certifications"
                value={formData.qualifications}
                onChange={handleChange}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Service Images</Label>
              <div className="border border-input rounded-md p-4 text-center">
                <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Upload images showcasing your services</p>
                <Button type="button" variant="outline" size="sm">
                  Add Images
                </Button>
              </div>
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
                <div className="space-y-2">
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    name="website"
                    placeholder="e.g. yourwebsite.com"
                    value={formData.website}
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
                'Post Service'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default ServicePostingForm;
