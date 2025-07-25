import React, { createContext, useContext, useEffect, useRef } from "react";
import { useAuth as useAuthStore } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types/user";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading, checkSession, login, logout, register, setUser } =
    useAuthStore();
  const { toast } = useToast();
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    if (!hasCheckedSession.current) {
      hasCheckedSession.current = true;
      checkSession().catch(() => {
        // If 401/403, clear state and redirect
        setUser(null);
        toast({
          variant: "destructive",
          title: "Session expired",
          description: "Please log in again.",
        });
      });
    }
  }, []); // Empty dependency array - only run once on mount

  const value = { user, isAuthenticated, isLoading, login, logout, register };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
