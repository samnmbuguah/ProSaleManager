import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AuthState } from "@/types/user";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "user")[];
}

export const RoleBasedRoute = ({
  children,
  allowedRoles = ["admin", "user"],
}: RoleBasedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setLocation("/auth");
      } else if (user && !allowedRoles.includes(user.role)) {
        setLocation("/unauthorized");
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, setLocation]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || (user && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
};
