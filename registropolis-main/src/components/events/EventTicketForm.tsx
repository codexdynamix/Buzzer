
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
  Ticket, 
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Users,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';

interface EventTicketFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const EventTicketForm: React.FC<EventTicketFormProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    venue: '',
    date: '',
    time: '',
    endDate: '',
    endTime: '',
    price: '',
    capacity: '',
    ticketTypes: '',
    images: [] as string[],
    organizer: user?.name || '',
    contactPhone: user?.phoneNumber || '',
    contactEmail: user?.email || '',
    website: ''
  });

  const categories = [
    "Music",
    "Sports",
    "Business",
    "Entertainment",
    "Food",
    "Arts",
    "Education",
    "Community",
    "Charity",
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
    if (!formData.title || !formData.category || !formData.date || !formData.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    // Generate unique ID for this event
    const eventId = `event-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Simulate event posting with a slight delay
    setTimeout(() => {
      // Success notification
      toast({
        title: "Event Listed Successfully",
        description: "Your event has been published and tickets are now available",
      });
      
      // Store event details in localStorage (in a real app this would go to a database)
      const events = JSON.parse(localStorage.getItem('events') || '[]');
      events.push({
        id: eventId,
        ...formData,
        rating: 0,
        reviews: 0,
        postedBy: user?.id,
        postedAt: new Date().toISOString(),
        contactId: eventId,
        contactName: formData.organizer,
        followers: 0,
        verified: false
      });
      localStorage.setItem('events', JSON.stringify(events));
      
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
          <SheetTitle>List an Event</SheetTitle>
          <SheetDescription>
            Create and sell tickets for your upcoming event
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Summer Music Festival"
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
              <Label htmlFor="description">Event Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your event in detail"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                name="location"
                placeholder="e.g. City, State"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Venue *</Label>
              <Input
                id="venue"
                name="venue"
                placeholder="e.g. City Park Amphitheater"
                value={formData.venue}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Start Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Start Time *</Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Ticket Price(s) *</Label>
                <Input
                  id="price"
                  name="price"
                  placeholder="e.g. $25 or $15-$50"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  placeholder="e.g. 500 attendees"
                  value={formData.capacity}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticketTypes">Ticket Types & Details</Label>
              <Textarea
                id="ticketTypes"
                name="ticketTypes"
                placeholder="Describe different ticket types, e.g. VIP, General Admission, etc."
                value={formData.ticketTypes}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Event Images</Label>
              <div className="border border-input rounded-md p-4 text-center">
                <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Upload images of your event, venue, or promotional materials</p>
                <Button type="button" variant="outline" size="sm">
                  Add Images
                </Button>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Organizer Information</p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="organizer">Organizer Name *</Label>
                  <Input
                    id="organizer"
                    name="organizer"
                    value={formData.organizer}
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
                  <Label htmlFor="website">Event Website</Label>
                  <Input
                    id="website"
                    name="website"
                    placeholder="e.g. myevent.com"
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
                'List Event'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EventTicketForm;
