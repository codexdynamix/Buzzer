
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supportService } from '@/services/supportService';
import { SupportTicket } from '@/types/supportTypes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const AdminSupport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState('');

  const { data: tickets, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => supportService.getTickets(),
  });

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'resolved':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: SupportTicket['status']) => {
    try {
      await supportService.updateTicket(ticketId, { status: newStatus });
      await queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setSelectedTicket(current => current?.ticketId === ticketId ? { ...current, status: newStatus } : current);
      toast({
        title: "Status Updated",
        description: `Ticket status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    try {
      const response = await supportService.addResponse({
        ticketId: selectedTicket.ticketId,
        message: reply.trim(),
      });
      setSelectedTicket(current => current?.ticketId === selectedTicket.ticketId
        ? { ...current, responses: [...(current.responses ?? []), response] }
        : current);
      setReply('');
      await queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast({ title: 'Response sent', description: 'Your reply was added to the support ticket.' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send support response',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div>Loading support tickets...</div>;
  }

  if (isError) {
    return (
      <div role="alert" className="space-y-3 py-8">
        <p>Could not load support tickets: {error instanceof Error ? error.message : 'Unknown error'}</p>
        <Button variant="outline" onClick={() => void refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Support Tickets</h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets?.map((ticket) => (
            <TableRow key={ticket.ticketId}>
              <TableCell>{ticket.ticketId.slice(0, 8)}</TableCell>
              <TableCell>{ticket.subject}</TableCell>
              <TableCell>
                <Badge>{ticket.category}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={getPriorityColor(ticket.priority)}>
                  {ticket.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(ticket.status)}>
                  {ticket.status}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(ticket.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Ticket Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold">Subject</h3>
                        <p>{selectedTicket?.subject}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold">Description</h3>
                        <p>{selectedTicket?.description}</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Conversation</h3>
                        {selectedTicket?.responses?.map(response => (
                          <div key={response.responseId} className="rounded-md border p-3">
                            <p>{response.message}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {response.isAdminResponse ? 'Staff' : 'Customer'} · {new Date(response.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                        {tickets?.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                              No support tickets have been submitted.
                            </TableCell>
                          </TableRow>
                        )}
                        <Textarea
                          value={reply}
                          onChange={event => setReply(event.target.value)}
                          placeholder="Write a reply to the customer"
                          maxLength={4000}
                        />
                        <Button onClick={handleReply} disabled={!reply.trim()}>
                          <Send className="mr-2 h-4 w-4" />
                          Send reply
                        </Button>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => selectedTicket && handleStatusChange(selectedTicket.ticketId, 'in_progress')}
                        >
                          Mark In Progress
                        </Button>
                        <Button
                          onClick={() => selectedTicket && handleStatusChange(selectedTicket.ticketId, 'resolved')}
                        >
                          Mark Resolved
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminSupport;
