
import React, { useState, useEffect } from 'react';
import { userManagementService } from '@/services/admin';
import { toast } from 'sonner';
import { UserRestriction } from '@/types/adminTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw, Search, Calendar, Ban, User, UserX, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const restrictionSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required" }),
  type: z.enum(["ban", "suspend", "restrict"], { 
    required_error: "Type of restriction is required" 
  }),
  reason: z.string().min(10, { message: "Reason must be at least 10 characters" }),
  endDate: z.string().optional(),
});

type RestrictionFormValues = z.infer<typeof restrictionSchema>;

const AdminRestrictions: React.FC = () => {
  const [restrictions, setRestrictions] = useState<UserRestriction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const { user } = useAuth();

  const form = useForm<RestrictionFormValues>({
    resolver: zodResolver(restrictionSchema),
    defaultValues: {
      userId: '',
      type: 'suspend',
      reason: '',
      endDate: undefined,
    },
  });

  const fetchRestrictions = async () => {
    try {
      setIsLoading(true);
      const userRestrictions = await userManagementService.getUserRestrictions();
      setRestrictions(userRestrictions);
    } catch (error) {
      toast.error('Failed to fetch user restrictions');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestrictions();
  }, []);

  const onSubmit = async (values: RestrictionFormValues) => {
    try {
      const restriction = {
        type: values.type,
        reason: values.reason,
        startDate: new Date(),
        ...(values.endDate ? { endDate: new Date(values.endDate) } : {}),
        createdBy: user?.id || 'admin',
      };

      await userManagementService.restrictUser(values.userId, restriction);
      toast.success('User restricted successfully');
      setDialogOpen(false);
      form.reset();
      await fetchRestrictions();
    } catch (error) {
      toast.error('Failed to restrict user');
      console.error(error);
    }
  };

  const getRestrictionColor = (type: string) => {
    switch (type) {
      case 'ban': return 'bg-destructive text-destructive-foreground';
      case 'suspend': return 'bg-amber-500 text-amber-50';
      case 'restrict': return 'bg-blue-500 text-blue-50';
      default: return 'bg-gray-500';
    }
  };

  const getRestrictionIcon = (type: string) => {
    switch (type) {
      case 'ban': return <Ban className="h-3 w-3 mr-1" />;
      case 'suspend': return <Clock className="h-3 w-3 mr-1" />;
      case 'restrict': return <UserX className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  const filteredRestrictions = restrictions.filter(restriction =>
    restriction.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restriction.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restriction.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">User Restrictions</h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search restrictions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[200px]"
            />
          </div>
          
          <Button onClick={fetchRestrictions} variant="outline" size="icon" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Ban className="h-4 w-4 mr-2" />
                <span>New Restriction</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Restrict User</DialogTitle>
                <DialogDescription>
                  Apply restrictions to a user. Fill in the details below.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter user ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restriction Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type of restriction" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ban">Ban (Permanent)</SelectItem>
                            <SelectItem value="suspend">Suspend (Temporary)</SelectItem>
                            <SelectItem value="restrict">Restrict Features</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide a reason for this restriction" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch('type') !== 'ban' && (
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <DialogFooter className="mt-6">
                    <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Apply Restriction</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Active Restrictions</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRestrictions.length > 0 ? (
                  filteredRestrictions.map((restriction) => (
                    <TableRow key={`${restriction.userId}-${restriction.startDate.toString()}`}>
                      <TableCell className="font-medium">
                        {restriction.userId}
                      </TableCell>
                      <TableCell>
                        <Badge className={getRestrictionColor(restriction.type)}>
                          {getRestrictionIcon(restriction.type)}
                          {restriction.type.charAt(0).toUpperCase() + restriction.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {restriction.reason}
                      </TableCell>
                      <TableCell>
                        {new Date(restriction.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {restriction.endDate 
                          ? new Date(restriction.endDate).toLocaleDateString()
                          : <Badge variant="outline">Permanent</Badge>
                        }
                      </TableCell>
                      <TableCell>
                        {restriction.createdBy}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {searchQuery ? 'No matching restrictions found' : 'No active restrictions'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRestrictions;
