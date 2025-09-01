import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthContext } from "@/contexts/AuthContext";

type AppRole = "admin" | "manager" | "user" | "super_admin" | "sales" | "client";
interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export const RoleBasedRoute = ({
  children,
  allowedRoles = ["admin", "manager", "user", "super_admin", "sales", "client"],
}: RoleBasedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuthContext();
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
