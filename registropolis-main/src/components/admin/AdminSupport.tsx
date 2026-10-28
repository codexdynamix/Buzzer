
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supportService, SupportTicket } from '@/services/supportService';
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
import { MessageSquare, Send, UserCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
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
  const { user } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState('');

  const { data: tickets, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => supportService.getTickets(),
  });

  const getPriorityColor = (priority: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500';
      case 'in-progress':
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
      const updated = (await supportService.getTickets()).find(ticket => ticket.ticketId === ticketId);
      if (updated) setSelectedTicket(updated);
      toast({
        title: "Status Updated",
        description: `Ticket status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update ticket status",
        variant: "destructive",
      });
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    try {
      await supportService.addResponse({
        ticketId: selectedTicket.ticketId,
        userId: user?.id || '',
        message: reply.trim(),
      });
      setReply('');
      await queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      const updated = (await supportService.getTickets()).find(ticket => ticket.ticketId === selectedTicket.ticketId);
      if (updated) setSelectedTicket(updated);
      toast({ title: 'Reply sent', description: 'The response is now part of the ticket history.' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send reply',
        variant: 'destructive',
      });
    }
  };

  const handleAssignToMe = async () => {
    if (!selectedTicket || !user?.id) return;
    try {
      await supportService.updateTicket(selectedTicket.ticketId, { assignedTo: user.id });
      await queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      const updated = (await supportService.getTickets()).find(ticket => ticket.ticketId === selectedTicket.ticketId);
      if (updated) setSelectedTicket(updated);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign ticket',
        variant: 'destructive',
      });
    }
  };

  const handleEscalate = async () => {
    if (!selectedTicket) return;
    try {
      await supportService.escalateTicket(selectedTicket.ticketId);
      await queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      const updated = (await supportService.getTickets()).find(ticket => ticket.ticketId === selectedTicket.ticketId);
      if (updated) setSelectedTicket(updated);
      toast({ title: 'Ticket escalated', description: 'Priority has been raised to urgent.' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to escalate ticket',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div>Loading support tickets...</div>;
  }

  if (isError) {
    return (
      <div role="alert" className="space-y-3 rounded-lg border border-destructive/30 p-4">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Failed to load support tickets'}
        </p>
        <Button variant="outline" onClick={() => void refetch()}>Try again</Button>
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
            <TableHead>SLA</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets?.length ? tickets.map((ticket) => (
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
                <div className="space-y-1">
                  <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                  {ticket.assignedTo && <div className="text-xs text-muted-foreground">Assigned</div>}
                </div>
              </TableCell>
              <TableCell>
                {ticket.slaDueAt ? (
                  <span className={new Date(ticket.slaDueAt).getTime() < Date.now() && !['resolved', 'closed'].includes(ticket.status)
                    ? 'font-semibold text-red-600'
                    : 'text-muted-foreground'}>
                    {new Date(ticket.slaDueAt).toLocaleString()}
                  </span>
                ) : <span className="text-muted-foreground">Not set</span>}
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
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span>Assigned to: {selectedTicket?.assignedTo === user?.id ? 'You' : selectedTicket?.assignedTo || 'Unassigned'}</span>
                        <Button variant="outline" size="sm" onClick={() => void handleAssignToMe()}>
                          <UserCheck className="mr-2 h-4 w-4" /> Assign to me
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Reply history</h3>
                        <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
                          {(selectedTicket?.responses || []).map(response => (
                            <div key={response.responseId} className="rounded-md bg-muted p-2 text-sm">
                              <p>{response.message}</p>
                              <time className="text-xs text-muted-foreground">
                                {new Date(response.createdAt).toLocaleString()}
                              </time>
                            </div>
                            ))}
                          {!selectedTicket?.responses?.length && <p className="text-sm text-muted-foreground">No replies yet.</p>}
                        </div>
                        <select
                          aria-label="Insert canned reply"
                          className="w-full rounded-md border bg-background p-2 text-sm"
                          value=""
                          onChange={event => {
                            if (event.target.value) setReply(event.target.value);
                          }}
                        >
                          <option value="">Insert a saved response…</option>
                          <option value="Thanks for contacting Buzzer Support. We are reviewing your request and will follow up shortly.">We’re reviewing this</option>
                          <option value="Your request has been resolved. Please reply to this ticket if you still need help.">Resolved follow-up</option>
                          <option value="We need a little more information to investigate. Please reply with the relevant details.">Request more information</option>
                        </select>
                        <Textarea value={reply} onChange={event => setReply(event.target.value)} maxLength={5000} placeholder="Write a reply..." />
                        <Button disabled={!reply.trim()} onClick={() => void handleReply()}>
                          <Send className="mr-2 h-4 w-4" /> Send reply
                        </Button>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={() => void handleEscalate()}>
                          <AlertTriangle className="mr-2 h-4 w-4" /> Escalate
                        </Button>
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
          )) : (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                No support tickets to display.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminSupport;
