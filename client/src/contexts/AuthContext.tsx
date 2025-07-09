import React, { createContext, useContext, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
    user: ReturnType<typeof useAuth>["user"];
    isAuthenticated: ReturnType<typeof useAuth>["isAuthenticated"];
    isLoading: ReturnType<typeof useAuth>["isLoading"];
    login: ReturnType<typeof useAuth>["login"];
    logout: ReturnType<typeof useAuth>["logout"];
    register: ReturnType<typeof useAuth>["register"];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated, isLoading, checkSession, login, logout, register, setUser } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    useEffect(() => {
        checkSession().catch((error) => {
            // If 401/403, clear state and redirect
            setUser(null);
            setLocation("/auth");
            toast({
                variant: "destructive",
                title: "Session expired",
                description: "Please log in again.",
            });
        });
        // eslint-disable-next-line
    }, []);

    const value = { user, isAuthenticated, isLoading, login, logout, register };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuthContext() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
    return ctx;
} 