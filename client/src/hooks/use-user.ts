import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, InsertUser } from "@db/schema";
import { useToast } from '@/hooks/use-toast';

type RequestResult = {
  ok: true;
} | {
  ok: false;
  message: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: InsertUser
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status >= 500) {
        return { ok: false, message: response.statusText };
      }

      const message = await response.text();
      return { ok: false, message };
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e.toString() };
  }
}

export function useUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, error, isLoading } = useQuery<User | null, Error>({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        // Return null for 401 without throwing error
        if (response.status === 401) {
          return null;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${response.statusText}`);
        }

        return response.json();
      } catch (error) {
        console.error('Error fetching user:', error);
        return null; // Return null instead of throwing
      }
    },
    retry: false,
    staleTime: Infinity, // Never consider data stale
    gcTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false
  });

  const loginMutation = useMutation({
    mutationFn: (userData: InsertUser) => handleRequest('/api/login', 'POST', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => handleRequest('/api/logout', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: InsertUser) => handleRequest('/api/register', 'POST', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}
