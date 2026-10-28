import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Database, RefreshCw } from 'lucide-react';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const DatabaseStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [collectionStats, setCollectionStats] = useState<{[key: string]: number}>({});
  const { toast } = useToast();

  useEffect(() => {
    loadCollectionStats();
  }, []);

  const loadCollectionStats = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/db-stats', {
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setCollectionStats(data.stats || {});
      setIsConnected(true);
    } catch (err) {
      console.error('Error loading collection stats:', err);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadCollectionStats();
      toast({ title: "Database Refreshed", description: "Collection statistics have been updated." });
    } catch {
      toast({ title: "Refresh Failed", description: "Failed to refresh database stats.", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Status
        </CardTitle>
        <CardDescription>Supabase Postgres Connection</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          {isLoading ? (
            <><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /><span>Checking connection...</span></>
          ) : isConnected ? (
            <><CheckCircle className="h-5 w-5 text-green-500" /><span className="font-medium text-green-500">Connected to Supabase</span></>
          ) : (
            <><XCircle className="h-5 w-5 text-destructive" /><span className="font-medium text-destructive">Database unavailable</span></>
          )}
        </div>
        {isConnected && !isLoading && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Collection Statistics:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(collectionStats).map(([collection, count]) => (
                <div key={collection} className="flex justify-between border rounded p-2">
                  <span className="capitalize">{collection}:</span>
                  <span className="font-mono">{count} items</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh Stats
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DatabaseStatus;
