
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { 
  HelpCircle, 
  FileQuestion, 
  MessageSquare, 
  Book, 
  ShieldCheck, 
  AlertCircle, 
  Send 
} from 'lucide-react';
import { supportService, type SupportTicket } from '@/services/supportService';
import { useAuth } from '@/context/AuthContext';

const HelpSettings: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'general' | 'technical' | 'report'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const loadTickets = async () => {
    if (!user) return;
    try {
      setTickets(await supportService.getTickets());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load your support requests');
    }
  };

  useEffect(() => {
    void loadTickets();
  }, [user?.id]);

  const submitTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      toast.error('Sign in before contacting support');
      return;
    }
    if (!subject.trim() || !description.trim()) {
      toast.error('Enter a subject and describe the issue');
      return;
    }
    setIsSubmitting(true);
    try {
      await supportService.createTicket({
        userId: user.id,
        subject: subject.trim(),
        description: description.trim(),
        priority: 'medium',
        category,
      });
      setSubject('');
      setDescription('');
      setIsContactOpen(false);
      await loadTickets();
      toast.success('Support request submitted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit your support request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Help & Support</CardTitle>
        <CardDescription>Find answers to common questions and get help</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-start gap-2"
            onClick={() => { setCategory('general'); setIsContactOpen(true); }}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Contact Support</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-start gap-2"
            onClick={() => setIsGuideOpen(true)}
          >
            <Book className="h-4 w-4" />
            <span>User Guide</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-start gap-2"
            onClick={() => { setCategory('report'); setIsContactOpen(true); }}
          >
            <AlertCircle className="h-4 w-4" />
            <span>Report an Issue</span>
          </Button>
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">My support requests</h3>
            <Button variant="outline" size="sm" onClick={() => void loadTickets()}>Refresh</Button>
          </div>
          {tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have not submitted any support requests.</p>
          ) : tickets.map(ticket => (
            <div key={ticket.ticketId} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{ticket.subject}</p>
                <span className="text-xs capitalize text-muted-foreground">{ticket.status.replace('_', ' ')}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{ticket.description}</p>
              {ticket.responses?.map(response => (
                <div key={response.responseId} className="mt-3 rounded-md bg-muted p-3">
                  <p className="text-xs font-medium">Support response</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{response.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(response.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <FileQuestion className="h-5 w-5" /> Frequently Asked Questions
          </h3>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I reset my password?</AccordionTrigger>
              <AccordionContent>
                To reset your password, go to the login screen and tap on "Forgot Password". 
                You will receive a verification code on your registered phone number. 
                Enter the code and create a new password.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>How do I delete my account?</AccordionTrigger>
              <AccordionContent>
                To delete your account, go to Settings &gt; Privacy &gt; Account Information &gt; Delete My Account. 
                Please note that this action is irreversible and all your data will be permanently deleted.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>How do I block a user?</AccordionTrigger>
              <AccordionContent>
                To block a user, open the chat with the user you want to block. 
                Tap on their name at the top of the screen to view their profile. 
                Scroll down and tap on "Block".
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>How do I change my notification settings?</AccordionTrigger>
              <AccordionContent>
                Go to Settings &gt; Notifications to customize how and when you receive notifications. 
                You can set different preferences for messages, groups, calls, and other types of notifications.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>How do I backup my chats?</AccordionTrigger>
              <AccordionContent>
                Go to Settings &gt; Chat &gt; Chat Backup to enable automatic backups. 
                You can choose how often you want to back up your chats and whether to include media files.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <div className="pt-4 border-t">
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Privacy & Security
          </h3>
          
          <p className="text-sm text-muted-foreground mb-3">
            We take your privacy and security seriously. Here are some resources to help you understand how we protect your information.
          </p>
          
          <div className="space-y-2">
            <Button variant="link" className="flex items-center gap-2 p-0 h-auto">
              <ShieldCheck className="h-4 w-4" />
              <span>Privacy Policy</span>
            </Button>
            
            <Button variant="link" className="flex items-center gap-2 p-0 h-auto">
              <FileQuestion className="h-4 w-4" />
              <span>Terms of Service</span>
            </Button>
            
            <Button variant="link" className="flex items-center gap-2 p-0 h-auto">
              <HelpCircle className="h-4 w-4" />
              <span>Security Tips</span>
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="w-full p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Send Feedback</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Help us improve by sharing your experience and suggestions
          </p>
          <Button className="w-full" onClick={() => { setCategory('general'); setIsContactOpen(true); }}>
            <Send className="h-4 w-4 mr-2" />
            Send Feedback
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          App Version: 1.0.0
        </div>
      </CardFooter>
      <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
            <DialogDescription>Tell us what happened. Replies appear under My support requests.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitTicket} className="space-y-4">
            <Input
              value={subject}
              onChange={event => setSubject(event.target.value)}
              placeholder="Subject"
              maxLength={160}
              required
            />
            <Textarea
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Describe your question or issue"
              maxLength={4000}
              required
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buzzer User Guide</DialogTitle>
            <DialogDescription>Quick steps for common tasks.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p><strong>Browse:</strong> Choose a category from the main navigation and use search or filters to find listings.</p>
            <p><strong>Post:</strong> Open your profile or the relevant category, choose Create Listing, and submit it. New posts may wait for review.</p>
            <p><strong>Get help:</strong> Use Contact Support or Report an Issue here. Replies appear under My support requests.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsGuideOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default HelpSettings;
