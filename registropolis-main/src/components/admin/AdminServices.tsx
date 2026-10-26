
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Shield, Users, MessageSquare, FileText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { systemHealthService } from '@/services/systemHealthService';
import type { SystemHealth } from '@/services/systemHealthService';
import { contentModerationService } from '@/services/contentModerationService';
import { bulkOperationsService } from '@/services/bulkOperationsService';
import type { BulkOperation } from '@/services/bulkOperationsService';

const AdminServices: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [moderationStats, setModerationStats] = useState<any | null>(null);
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [isLoading, setIsLoading] = useState({
    health: true,
    moderation: true,
    bulkOps: true
  });

  // Load system health data
  useEffect(() => {
    const loadSystemHealth = async () => {
      try {
        const health = await systemHealthService.getSystemHealth();
        setSystemHealth(health);
      } catch (error) {
        console.error('Error loading system health:', error);
        toast.error('Failed to load system health data');
      } finally {
        setIsLoading(prev => ({ ...prev, health: false }));
      }
    };
    
    loadSystemHealth();
  }, []);
  
  // Load moderation stats
  useEffect(() => {
    const loadModerationStats = async () => {
      try {
        const stats = await contentModerationService.getContentModerationStats();
        setModerationStats(stats);
      } catch (error) {
        console.error('Error loading moderation stats:', error);
      } finally {
        setIsLoading(prev => ({ ...prev, moderation: false }));
      }
    };
    
    loadModerationStats();
  }, []);
  
  // Load bulk operations
  useEffect(() => {
    const loadBulkOperations = async () => {
      try {
        const operations = await bulkOperationsService.getAllBulkOperations();
        setBulkOperations(operations);
      } catch (error) {
        console.error('Error loading bulk operations:', error);
      } finally {
        setIsLoading(prev => ({ ...prev, bulkOps: false }));
      }
    };
    
    loadBulkOperations();
  }, []);

  // Toggle system monitoring
  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      systemHealthService.stopMonitoring();
      setIsMonitoring(false);
      toast.info('System monitoring stopped');
    } else {
      systemHealthService.startMonitoring();
      setIsMonitoring(true);
      toast.success('System monitoring started');
    }
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Admin Services</h2>
      </div>

      <Tabs defaultValue="system-health">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="system-health">System Health</TabsTrigger>
          <TabsTrigger value="content-moderation">Content Moderation</TabsTrigger>
          <TabsTrigger value="bulk-operations">Bulk Operations</TabsTrigger>
        </TabsList>
        
        {/* System Health Tab */}
        <TabsContent value="system-health" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">System Monitoring</h3>
            <div className="flex items-center space-x-2">
              <Switch 
                id="monitoring" 
                checked={isMonitoring} 
                onCheckedChange={handleToggleMonitoring} 
              />
              <Label htmlFor="monitoring">
                {isMonitoring ? 'Monitoring Active' : 'Monitoring Off'}
              </Label>
            </div>
          </div>
          
          {isLoading.health ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : systemHealth ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <Database className="mr-2 h-5 w-5" />
                      Database
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status</span>
                        <Badge 
                          variant={systemHealth.services.database.status === 'online' ? 'default' : 'destructive'}
                        >
                          {systemHealth.services.database.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Response Time</span>
                        <span>{systemHealth.services.database.responseTime} ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Connections</span>
                        <span>{systemHealth.services.database.connectionCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <Activity className="mr-2 h-5 w-5" />
                      API
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status</span>
                        <Badge 
                          variant={systemHealth.services.api.status === 'online' ? 'default' : 'destructive'}
                        >
                          {systemHealth.services.api.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Response Time</span>
                        <span>{systemHealth.services.api.responseTime} ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Error Rate</span>
                        <span>{systemHealth.services.api.errorRate.toFixed(2)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <FileText className="mr-2 h-5 w-5" />
                      Storage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status</span>
                        <Badge 
                          variant={systemHealth.services.fileStorage.status === 'online' ? 'default' : 'destructive'}
                        >
                          {systemHealth.services.fileStorage.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Storage Usage</span>
                        <span>
                          {(systemHealth.services.fileStorage.usedSpace / (1024 * 1024)).toFixed(2)} MB / {(systemHealth.services.fileStorage.totalSpace / (1024 * 1024)).toFixed(0)} MB
                        </span>
                      </div>
                      <div>
                        <Progress
                          value={(systemHealth.services.fileStorage.usedSpace / systemHealth.services.fileStorage.totalSpace) * 100}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                  <CardDescription>Current system resource usage and activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <Label>CPU Usage</Label>
                          <span className="text-muted-foreground">{systemHealth.performance.cpuUsage}%</span>
                        </div>
                        <Progress value={systemHealth.performance.cpuUsage} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <Label>Memory Usage</Label>
                          <span className="text-muted-foreground">{systemHealth.performance.memoryUsage}%</span>
                        </div>
                        <Progress value={systemHealth.performance.memoryUsage} className="h-2" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Active Users</span>
                        <Badge variant="outline">{systemHealth.performance.activeUsers}</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Requests Per Minute</span>
                        <Badge variant="outline">{systemHealth.performance.requestsPerMinute}</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Last Updated</span>
                        <span className="text-muted-foreground text-sm">
                          {new Date(systemHealth.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {systemHealth.lastIncident && (
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive">Last Incident</CardTitle>
                    <CardDescription>
                      {new Date(systemHealth.lastIncident.timestamp).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{systemHealth.lastIncident.description}</p>
                    {systemHealth.lastIncident.resolvedAt ? (
                      <p className="mt-2">Resolved at: {new Date(systemHealth.lastIncident.resolvedAt).toLocaleString()}</p>
                    ) : (
                      <Badge variant="destructive" className="mt-2">Unresolved</Badge>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No system health data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Content Moderation Tab */}
        <TabsContent value="content-moderation" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Content Moderation</h3>
            <Button>
              <Shield className="mr-2 h-4 w-4" />
              Moderation Rules
            </Button>
          </div>
          
          {isLoading.moderation ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : moderationStats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Content Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Content</span>
                        <Badge variant="outline">{moderationStats.totalContent}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Pending Review</span>
                        <Badge variant="secondary">{moderationStats.statusBreakdown.pending}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Approved</span>
                        <Badge variant="default">{moderationStats.statusBreakdown.approved}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Rejected</span>
                        <Badge variant="destructive">{moderationStats.statusBreakdown.rejected}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Content Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Messages</span>
                          <Badge variant="outline">{moderationStats.typeBreakdown.message}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Posts</span>
                          <Badge variant="outline">{moderationStats.typeBreakdown.post}</Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Comments</span>
                          <Badge variant="outline">{moderationStats.typeBreakdown.comment}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Profile Updates</span>
                          <Badge variant="outline">{moderationStats.typeBreakdown.profile}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Images</span>
                          <Badge variant="outline">{moderationStats.typeBreakdown.image}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Content Pending Review</CardTitle>
                  <CardDescription>Content requiring moderator attention</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="relative overflow-x-auto">
                    {moderationStats.statusBreakdown.pending > 0 ? (
                      <div className="py-4">
                        <Button>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          View Pending Items ({moderationStats.statusBreakdown.pending})
                        </Button>
                      </div>
                    ) : (
                      <div className="py-10 text-center">
                        <p className="text-muted-foreground">No content pending moderation</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No moderation data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Bulk Operations Tab */}
        <TabsContent value="bulk-operations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Bulk Operations</h3>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Export Users
              </Button>
              <Button>
                <MessageSquare className="mr-2 h-4 w-4" />
                Bulk Message
              </Button>
            </div>
          </div>
          
          {isLoading.bulkOps ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : bulkOperations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Recent Operations</CardTitle>
                <CardDescription>History of bulk administrative actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bulkOperations.map((op) => (
                    <div key={op._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium capitalize">{op.operationType} Operation</h4>
                        <Badge 
                          variant={
                            op.status === 'completed' ? 'default' : 
                            op.status === 'failed' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {op.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Created: </span>
                          {new Date(op.createdAt).toLocaleString()}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Collection: </span>
                          {op.targetCollection}
                        </div>
                        {op.affectedCount !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Affected: </span>
                            {op.affectedCount} / {op.totalCount || '?'}
                          </div>
                        )}
                      </div>
                      
                      {op.status === 'processing' && (
                        <div className="mt-2">
                          <Progress value={op.progress || 0} className="h-2" />
                          <span className="text-xs text-muted-foreground mt-1 block">
                            {op.progress || 0}% complete
                          </span>
                        </div>
                      )}
                      
                      {op.error && (
                        <div className="mt-2 text-sm text-destructive">
                          {op.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-muted-foreground mb-4">No bulk operations have been performed</p>
                <Button variant="outline">
                  Create Bulk Operation
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminServices;
