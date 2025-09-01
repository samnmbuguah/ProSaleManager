import { useEffect } from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";
import { RoleBasedRoute } from "@/components/auth/RoleBasedRoute";
import MainNav from "@/components/layout/MainNav";

// Import your pages
import AuthPage from "@/pages/AuthPage";
import InventoryPage from "@/pages/InventoryPage";
import ExpensesPage from "@/pages/ExpensesPage";
import { SalesPage } from "@/pages/SalesPage";
import CustomersPage from "@/pages/CustomersPage";
import POSPage from "@/pages/PosPage";
import ProfilePage from "@/pages/ProfilePage";
import ReportsPage from "@/pages/ReportsPage";
import ShopPage from "@/pages/ShopPage";
import UserManagementPage from "@/pages/UserManagementPage";
import { useAuthContext } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

type AppRole = "admin" | "manager" | "user" | "super_admin" | "sales";

type ProtectedRouteProps = {
  component: React.ComponentType;
  roles?: AppRole[];
};

function ProtectedRoute({ component: Component, roles }: ProtectedRouteProps) {
  return (
    <RoleBasedRoute allowedRoles={roles || ["admin", "user"]}>
      <div className="min-h-screen bg-background flex flex-col">
        <MainNav />
        <main className="flex-1">
          <Component />
        </main>
      </div>
    </RoleBasedRoute>
  );
}

function RootRedirect() {
  const { user } = useAuthContext();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (user?.role === "super_admin") {
      setLocation("/users");
    } else if (user?.role === "admin" || user?.role === "sales") {
      setLocation("/pos");
    } else if (user?.role === "manager") {
      setLocation("/shop");
    } else {
      setLocation("/auth");
    }
  }, [user, setLocation]);
  return null;
}

function App() {
  const { checkSession } = useAuth();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <>
      <Switch>
        <Route path="/auth" component={AuthPage} />

        <Route path="/shop">
          <ProtectedRoute component={ShopPage} roles={["admin", "user", "sales", "super_admin", "manager"]} />
        </Route>

        <Route path="/pos">
          <ProtectedRoute component={POSPage} roles={["admin", "sales", "super_admin", "manager"]} />
        </Route>

        <Route path="/inventory">
          <ProtectedRoute component={InventoryPage} roles={["admin", "sales", "super_admin", "manager"]} />
        </Route>

        <Route path="/expenses">
          <ProtectedRoute component={ExpensesPage} roles={["admin", "sales", "super_admin", "manager"]} />
        </Route>

        <Route path="/sales">
          <ProtectedRoute component={SalesPage} roles={["admin", "sales", "super_admin", "manager"]} />
        </Route>

        <Route path="/customers">
          <ProtectedRoute component={CustomersPage} roles={["admin", "super_admin", "manager"]} />
        </Route>

        <Route path="/reports">
          <ProtectedRoute component={ReportsPage} roles={["admin", "super_admin", "manager"]} />
        </Route>

        <Route path="/profile">
          <ProtectedRoute component={ProfilePage} roles={["admin", "sales", "user", "super_admin", "manager"]} />
        </Route>

        <Route path="/users">
          <ProtectedRoute component={UserManagementPage} roles={["super_admin"]} />
        </Route>

        <Route path="/" component={RootRedirect} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
