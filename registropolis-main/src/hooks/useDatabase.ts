import { useState, useEffect } from 'react';

export const useDatabase = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/health');
        const data = await res.json();
        setIsConnected(data.database === 'supabase');
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to connect to database'));
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkConnection();
  }, []);

  return { isConnected, isLoading, error };
};
