import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const RoleBasedRoute = ({ children, allowedRoles }: RoleBasedRouteProps) => {
  const { user, isAuthenticated, isLoading, checkSession } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Check session on mount and when authentication state changes
    if (!isAuthenticated && !isLoading) {
      checkSession();
    }
  }, [isAuthenticated, isLoading, checkSession]);

  useEffect(() => {
    // Redirect to auth page if not authenticated and not already on auth page
    if (!isLoading && !isAuthenticated && location !== "/auth") {
      setLocation("/auth");
      return;
    }

    // Redirect to home if authenticated but not authorized
    if (
      !isLoading &&
      isAuthenticated &&
      user &&
      !allowedRoles.includes(user.role)
    ) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, setLocation, location]);

  // Show loading indicator only during initial load
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Don't render if user doesn't have required role
  if (!allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
