import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStoreContext } from "@/contexts/StoreContext";

type AppRole = "admin" | "manager" | "user" | "super_admin" | "sales" | "client";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export const RoleBasedRoute = ({
  children,
  allowedRoles = ["admin", "manager", "user", "super_admin", "sales", "client"],
}: RoleBasedRouteProps) => {
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuthContext();
  const { currentStore, isLoading: isStoreLoading } = useStoreContext();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Wait for both auth and store context to load
    if (isAuthLoading || isStoreLoading) {
      return;
    }

    // Handle authentication
    if (!isAuthenticated) {
      setLocation("/auth");
      return;
    }

    // Handle role-based access
    if (user && !allowedRoles.includes(user.role)) {
      setLocation("/unauthorized");
      return;
    }

    // Redirect to store-prefixed URL if:
    // 1. User is authenticated
    // 2. Store context is loaded and we have a current store
    // 3. Current URL doesn't have a store prefix
    if (user && currentStore) {
      const pathParts = location.split("/").filter(Boolean);
      const firstSegment = pathParts[0];

      // Check if the URL already has the store prefix
      const hasStorePrefix = firstSegment === encodeURIComponent(currentStore.name) ||
        firstSegment === currentStore.name;

      // Only redirect if:
      // - No store prefix in URL
      // - Not on special routes like /auth, /unauthorized
      // - Has at least one path segment (not just /)
      if (!hasStorePrefix && pathParts.length > 0 &&
        !["auth", "unauthorized"].includes(firstSegment)) {
        const newPath = `/${encodeURIComponent(currentStore.name)}/${pathParts.join("/")}`;
        console.log("[RoleBasedRoute] Redirecting to store-prefixed URL:", newPath);
        setLocation(newPath);
      }
    }
  }, [isAuthLoading, isStoreLoading, isAuthenticated, user, allowedRoles, setLocation, location, currentStore]);

  // Show loading state while auth or store context is loading
  if (isAuthLoading || isStoreLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if not authenticated or role not allowed
  if (!isAuthenticated || (user && !allowedRoles.includes(user.role))) {
    return null;
  }

  // Don't render if we need to redirect to store-prefixed URL
  if (user && currentStore) {
    const pathParts = location.split("/").filter(Boolean);
    const firstSegment = pathParts[0];
    const hasStorePrefix = firstSegment === encodeURIComponent(currentStore.name) ||
      firstSegment === currentStore.name;

    if (!hasStorePrefix && pathParts.length > 0 &&
      !["auth", "unauthorized"].includes(firstSegment)) {
      // Still waiting for redirect
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
