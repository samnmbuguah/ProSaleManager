import { create } from "zustand";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useLocation } from "wouter";
import axios from "axios";

interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "user";
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
  const [location, setLocation] = useLocation();
  const {
    user,
    isAuthenticated,
    isLoading,
    lastCheck,
    setUser,
    setIsAuthenticated,
    setIsLoading,
    setLastCheck,
  } = useAuthStore();

  const handleAuthError = (error: unknown, redirectToAuth: boolean = true) => {
    console.error("Auth error:", error);
    setUser(null);
    setIsAuthenticated(false);

    // Only show toast for non-401 errors or when explicitly logging out
    if (
      !axios.isAxiosError(error) ||
      error.response?.status !== 401 ||
      !redirectToAuth
    ) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: String(
          axios.isAxiosError(error)
            ? error.response?.data?.message ||
                "Session expired. Please log in again."
            : error instanceof Error
              ? error.message
              : "Session expired. Please log in again.",
        ),
      });
    }

    // Only redirect if we're not already on the auth page and redirection is requested
    if (redirectToAuth && location !== "/auth") {
      setLocation("/auth");
    }
  };

  const checkSession = async () => {
    try {
      console.log('Checking session...', { location, lastCheck, user });
      
      // Skip check if we're on the auth page
      if (location === "/auth") {
        console.log('On auth page, skipping session check');
        setIsLoading(false);
        return;
      }

      // Skip check if we've checked recently (within 5 minutes) and have a user
      const now = Date.now();
      if (now - lastCheck < 5 * 60 * 1000 && user) {
        console.log('Recent check exists, skipping session check');
        setIsLoading(false);
        return;
      }

      // Skip if we're already loading
      if (isLoading) {
        console.log('Already loading, skipping session check');
        return;
      }

      console.log('Making API call to check session');
      setIsLoading(true);
      const response = await api.get("/auth/me");
      console.log('Session check response:', response.data);

      if (response.data.success && response.data.data) {
        setUser(response.data.data);
        setIsAuthenticated(true);
        setLastCheck(now);
      } else {
        console.log('Session invalid, no user data received');
        handleAuthError(new Error("Session invalid"), true);
      }
    } catch (error: unknown) {
      console.error('Session check error:', error);
      handleAuthError(error, true);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.post("/auth/login", { email, password });

      if (!response.data.success) {
        throw new Error(response.data.message || "Invalid credentials");
      }

      if (!response.data.data) {
        throw new Error("No user data received");
      }

      setUser(response.data.data);
      setIsAuthenticated(true);
      setLastCheck(Date.now());
      setLocation("/pos");

      toast({
        title: "Success",
        description: response.data.message || "Logged in successfully",
      });
    } catch (error: unknown) {
      // Don't show error toast for 401 responses as it will be handled by the form
      if (!axios.isAxiosError(error) || error.response?.status !== 401) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: String(
            axios.isAxiosError(error)
              ? error.response?.data?.message ||
                  error.message ||
                  "Failed to log in"
              : error instanceof Error
                ? error.message
                : "Failed to log in",
          ),
        });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await api.post("/auth/logout");
      setUser(null);
      setIsAuthenticated(false);

      if (location !== "/auth") {
        setLocation("/auth");
      }

      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error: unknown) {
      handleAuthError(error, true);
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
