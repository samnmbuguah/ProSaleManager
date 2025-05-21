import { StrictMode, useEffect } from "react";
import React from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route, useLocation } from "wouter";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import PosPage from "./pages/PosPage";
import InventoryPage from "./pages/InventoryPage";
import CustomersPage from "./pages/CustomersPage";
import ReportsPage from "./pages/ReportsPage";
import AuthPage from "./pages/AuthPage";
import { SalesPage } from "./pages/SalesPage";
import ExpensesPage from "./pages/ExpensesPage";
import MainNav from "./components/layout/MainNav";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useToast } from "./hooks/use-toast";
import RoleBasedRoute from "./components/auth/RoleBasedRoute";
import { CartProvider } from "@/contexts/CartContext";
import ProfilePage from "./pages/ProfilePage";

// Custom error boundary for CartProvider
class CartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Cart error:", error, errorInfo);
    // Clean up potentially corrupted cart data
    localStorage.removeItem('pos_cart_v2');
    localStorage.removeItem('pos_cart_v2_timestamp');
  }

  render() {
    if (this.state.hasError) {
      // Reset state and render app without the error
      setTimeout(() => this.setState({ hasError: false }), 100);
      return this.props.fallback || this.props.children;
    }
    return this.props.children;
  }
}

function App() {
  const { checkSession, isLoading } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    checkSession();
  }, []);

  if (isLoading && location !== '/auth') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <CartErrorBoundary>
        <CartProvider>
          <Router />
          <Toaster />
        </CartProvider>
      </CartErrorBoundary>
    </QueryClientProvider>
  );
}

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType, roles?: ('admin' | 'user')[] }) {
  return (
    <RoleBasedRoute allowedRoles={roles || ['admin', 'user']}>
      <div className="min-h-screen bg-background flex flex-col">
        <MainNav />
        <main className="flex-1 overflow-hidden">
          <Component />
        </main>
      </div>
    </RoleBasedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={() => <ProtectedRoute component={PosPage} roles={['admin', 'user']} />} />
      <Route path="/pos" component={() => <ProtectedRoute component={PosPage} roles={['admin', 'user']} />} />
      <Route path="/inventory" component={() => <ProtectedRoute component={InventoryPage} roles={['admin', 'user']} />} />
      <Route path="/customers" component={() => <ProtectedRoute component={CustomersPage} roles={['admin']} />} />
      <Route path="/sales" component={() => <ProtectedRoute component={SalesPage} roles={['admin']} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={ReportsPage} roles={['admin']} />} />
      <Route path="/expenses" component={() => <ProtectedRoute component={ExpensesPage} roles={['admin', 'user']} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} roles={['admin', 'user']} />} />
      <Route>404 Page Not Found</Route>
    </Switch>
  );
}

const root = document.getElementById("root") as HTMLElement;
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
