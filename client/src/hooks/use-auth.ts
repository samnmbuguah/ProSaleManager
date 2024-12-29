import { create } from 'zustand';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useLocation } from 'wouter';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastCheck: number;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setLastCheck: (lastCheck: number) => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  lastCheck: 0,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setLastCheck: (lastCheck) => set({ lastCheck }),
}));

export const useAuth = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading, lastCheck, setUser, setIsAuthenticated, setIsLoading, setLastCheck } = useAuthStore();

  const checkSession = async () => {
    try {
      // Skip check if we've checked recently (within 5 minutes) and have a user
      const now = Date.now();
      if (now - lastCheck < 5 * 60 * 1000 && user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const response = await api.get('/auth/me');
      
      if (response.data.success && response.data.data) {
        setUser(response.data.data);
        setLastCheck(now);
      } else {
        setUser(null);
        // Only redirect to auth if we're not already there
        if (window.location.pathname !== '/auth') {
          setLocation('/auth');
        }
      }
    } catch (error: any) {
      console.error('Session check error:', error);
      setUser(null);
      // Only redirect to auth if we're not already there
      if (window.location.pathname !== '/auth') {
        setLocation('/auth');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/login', { email, password });
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Invalid response from server');
      }
      
      setUser(response.data.data);
      setLastCheck(Date.now());
      setLocation('/pos');
      
      toast({
        title: 'Success',
        description: response.data.message || 'Logged in successfully',
      });
    } catch (error: any) {
      console.error('Login error:', error);
      setUser(null);
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Invalid credentials',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await api.post('/auth/logout');
      setUser(null);
      setLastCheck(0);
      setLocation('/auth');
      
      toast({
        title: 'Success',
        description: 'Logged out successfully',
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Error logging out',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    checkSession,
    login,
    logout,
  };
}; 