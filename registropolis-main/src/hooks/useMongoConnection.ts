import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export const useMongoConnection = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch('/health');
        const data = await res.json();
        if (data.database === 'connected') {
          setIsConnected(true);
          setRetryCount(0);
        } else {
          throw new Error('Database not connected');
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to connect to database'));
        setIsConnected(false);
        toast.error(`Database connection failed`);
      } finally {
        setIsLoading(false);
      }
    };
    checkConnection();
  }, [retryCount]);

  const retryConnection = () => setRetryCount(prev => prev + 1);

  return { isConnected, isLoading, error, retryConnection };
};
