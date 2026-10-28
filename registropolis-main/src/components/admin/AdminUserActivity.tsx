
import React, { useState, useEffect } from 'react';
import { userManagementService } from '@/services/admin';
import { toast } from 'sonner';
import { UserActivity } from '@/types/adminTypes';
import { adminAnalyticsService, type AnalyticsData } from '@/services/adminAnalyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw, Search, Filter, Download, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const AdminUserActivity: React.FC = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<UserActivity | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const [userActivities, analyticsRecords] = await Promise.all([
        userManagementService.getUserActivities(undefined, 200),
        adminAnalyticsService.getAnalytics(),
      ]);
      setActivities(userActivities);
      setAnalytics(analyticsRecords);
    } catch (error) {
      toast.error('Failed to fetch user activities');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleExportActivities = () => {
    try {
      const jsonString = JSON.stringify(activities, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-activities-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('User activities exported successfully');
    } catch (error) {
      toast.error('Failed to export user activities');
      console.error(error);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.ip && activity.ip.includes(searchQuery));
      
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && activity.action.includes(filterType);
  });

  const actionTypes = Array.from(new Set(activities.map(a => a.action)));
  const latestMetrics = analytics[0]?.metrics;
  const totals = analytics.reduce((result, record) => ({
    newUsers: result.newUsers + record.metrics.newUsers,
    messagesSent: result.messagesSent + record.metrics.messagesSent,
    pageViews: result.pageViews + Object.values(record.pageViews || {}).reduce((sum, count) => sum + count, 0),
  }), { newUsers: 0, messagesSent: 0, pageViews: 0 });

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
        <h2 className="text-2xl font-bold">Audit & Analytics</h2>
        <div className="flex flex-wrap gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[200px]"
            />
          </div>
          
          <Button onClick={fetchActivities} variant="outline" size="icon" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button onClick={handleExportActivities} variant="outline" title="Export activities">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Active users (latest)</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{latestMetrics?.activeUsers ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">New users (recorded)</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{totals.newUsers}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Messages (recorded)</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{totals.messagesSent}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Page views (recorded)</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{totals.pageViews}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Recent Staff Audit Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor or Target</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((activity) => (
                    <TableRow key={`${activity.userId}-${activity.timestamp.toString()}`}>
                      <TableCell className="font-mono text-xs">
                        {new Date(activity.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium truncate max-w-[180px]">
                        {activity.userId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{activity.action}</Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedActivity(activity)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Staff Audit Details</DialogTitle>
                              <DialogDescription>
                                Details recorded for this administrative action
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4 space-y-4">
                              <div>
                                <h4 className="font-medium mb-1">User ID</h4>
                                <code className="bg-muted p-2 rounded block">{selectedActivity?.userId}</code>
                              </div>
                              <div>
                                <h4 className="font-medium mb-1">Action</h4>
                                <Badge>{selectedActivity?.action}</Badge>
                              </div>
                              <div>
                                <h4 className="font-medium mb-1">Timestamp</h4>
                                <p>{selectedActivity?.timestamp && new Date(selectedActivity?.timestamp).toLocaleString()}</p>
                              </div>
                              <div>
                                <h4 className="font-medium mb-1">Details</h4>
                                <ScrollArea className="h-[200px] rounded-md border p-4">
                                  <pre className="text-xs whitespace-pre-wrap">
                                    {JSON.stringify(selectedActivity?.details, null, 2)}
                                  </pre>
                                </ScrollArea>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      {searchQuery ? 'No matching audit entries found' : 'No staff actions recorded yet'}
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

export default AdminUserActivity;
