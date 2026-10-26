
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const HelpSettings: React.FC = () => {
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
          >
            <MessageSquare className="h-4 w-4" />
            <span>Contact Support</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-start gap-2"
          >
            <Book className="h-4 w-4" />
            <span>User Guide</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-start gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            <span>Report an Issue</span>
          </Button>
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
          <Button className="w-full" onClick={() => toast.success("Feedback form opened")}>
            <Send className="h-4 w-4 mr-2" />
            Send Feedback
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          App Version: 1.0.0
        </div>
      </CardFooter>
    </Card>
  );
};

export default HelpSettings;
