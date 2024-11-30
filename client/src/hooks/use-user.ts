import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, InsertUser } from "@db/schema";
import { useToast } from '@/hooks/use-toast';

export function useUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery<User | null>({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (response.status === 401) {
          return null;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }

        return response.json();
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    },
    enabled: true, // Only run once when component mounts
    staleTime: Infinity, // Never mark cache as stale
    gcTime: Infinity, // Never delete from cache
    retry: 0, // Don't retry on failure
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.user);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.user);
      toast({
        title: "Success",
        description: "Account created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['user'], null);
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  return {
    user: query.data,
    ...query,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isAuthenticating: loginMutation.isPending || registerMutation.isPending,
  };
}
