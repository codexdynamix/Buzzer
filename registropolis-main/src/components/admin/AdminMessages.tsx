import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { adminAPI } from '@/services/apiService';

interface AdminMessage {
  id: string;
  senderName: string;
  chatId: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface MessageStats {
  totalMessages: number;
  sentMessages: number;
  readMessages: number;
}

const AdminMessages: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getMessages()
      .then(({ messages: records, stats: messageStats }) => {
        setMessages(records ?? []);
        setStats(messageStats ?? null);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const query = searchQuery.toLowerCase();
  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(query) ||
    message.senderName.toLowerCase().includes(query) ||
    message.chatId.toLowerCase().includes(query)
  );

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Message Statistics</CardTitle>
          <CardDescription>Overview of message activity</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Total Messages</span>
            <span className="text-2xl font-bold">{stats?.totalMessages ?? '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Sent Messages</span>
            <span className="text-2xl font-bold">{stats?.sentMessages ?? '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Read Messages</span>
            <span className="text-2xl font-bold">{stats?.readMessages ?? '—'}</span>
          </div>
        </CardContent>
      </Card>

      <div className="max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recent messages..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sender</TableHead>
              <TableHead>Conversation</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMessages.length > 0 ? filteredMessages.map(message => (
              <TableRow key={message.id}>
                <TableCell>{message.senderName}</TableCell>
                <TableCell className="max-w-36 truncate">{message.chatId}</TableCell>
                <TableCell className="max-w-xs truncate">{message.content}</TableCell>
                <TableCell>{new Date(message.timestamp).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={message.status === 'read' ? 'default' : message.status === 'delivered' ? 'secondary' : 'outline'}>
                    {message.status}
                  </Badge>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  {loading ? 'Loading messages…' : loadError ? 'Messages could not be loaded' : 'No messages found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminMessages;
