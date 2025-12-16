import { useEffect } from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";
import { RoleBasedRoute } from "@/components/auth/RoleBasedRoute";
import MainNav from "@/components/layout/MainNav";
import StoreNav from "@/components/layout/StoreNav";
// Import your pages
import AuthPage from "@/pages/AuthPage";
import InventoryPage from "@/pages/InventoryPage";
import ExpensesPage from "@/pages/ExpensesPage";
import { SalesPage } from "@/pages/SalesPage";
import CustomersPage from "@/pages/CustomersPage";
import POSPage from "@/pages/PosPage";
import ProfilePage from "@/pages/ProfilePage";
import ReportsPage from "@/pages/ReportsPage";
import HomePage from "@/pages/HomePage";
import UserManagementPage from "@/pages/UserManagementPage";
import FavoritesPage from "@/pages/FavoritesPage";
import OrdersPage from "@/pages/OrdersPage";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStoreContext } from "@/contexts/StoreContext";
import { useLocation } from "wouter";

type AppRole = "admin" | "manager" | "user" | "super_admin" | "sales" | "client";

type ProtectedRouteProps = {
  component: React.ComponentType;
  roles?: AppRole[];
};

function ProtectedRoute({ component: Component, roles }: ProtectedRouteProps) {
  return (
    <RoleBasedRoute allowedRoles={roles || ["admin", "user", "client"]}>
      <div className="min-h-screen bg-background flex flex-col">
        <NavigationWrapper />
        <main className="flex-1">
          <Component />
        </main>
      </div>
    </RoleBasedRoute>
  );
}

function NavigationWrapper() {
  const { user } = useAuthContext();

  if (!user) return null;

  if (user.role === "client") {
    return <StoreNav showSearch={false} />;
  }

  return <MainNav />;
}


function RootRedirect() {
  const { user } = useAuthContext();
  const { currentStore } = useStoreContext();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && currentStore) {
      if (user.role === "super_admin") {
        setLocation(`/${encodeURIComponent(currentStore.name)}/users`);
      } else if (user.role === "admin" || user.role === "sales" || user.role === "manager") {
        setLocation(`/${encodeURIComponent(currentStore.name)}/pos`);
      } else if (user.role === "client") {
        setLocation(`/${encodeURIComponent(currentStore.name)}`);
      }
    } else if (user && !currentStore) {
      // If user is logged in but no store context, redirect to direct routes
      if (user.role === "super_admin") {
        setLocation("/users");
      } else if (user.role === "admin" || user.role === "sales" || user.role === "manager") {
        setLocation("/pos");
      }
    }
  }, [user, currentStore, setLocation]);

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

        <Route path="/" component={HomePage} />

        <Route path="/pos">
          <ProtectedRoute
            component={POSPage}
            roles={["admin", "sales", "super_admin", "manager"]}
          />
        </Route>

        <Route path="/inventory">
          <ProtectedRoute
            component={InventoryPage}
            roles={["admin", "sales", "super_admin", "manager"]}
          />
        </Route>

        <Route path="/users">
          <ProtectedRoute component={UserManagementPage} roles={["super_admin"]} />
        </Route>

        <Route path="/:store/pos">
          <ProtectedRoute
            component={POSPage}
            roles={["admin", "sales", "super_admin", "manager"]}
          />
        </Route>

        <Route path="/:store/inventory">
          <ProtectedRoute
            component={InventoryPage}
            roles={["admin", "sales", "super_admin", "manager"]}
          />
        </Route>

        <Route path="/:store/expenses">
          <ProtectedRoute
            component={ExpensesPage}
            roles={["admin", "sales", "super_admin", "manager"]}
          />
        </Route>

        <Route path="/:store/sales">
          <ProtectedRoute
            component={SalesPage}
            roles={["admin", "sales", "super_admin", "manager"]}
          />
        </Route>

        <Route path="/:store/customers">
          <ProtectedRoute component={CustomersPage} roles={["admin", "super_admin", "manager"]} />
        </Route>

        <Route path="/:store/reports">
          <ProtectedRoute component={ReportsPage} roles={["admin", "super_admin", "manager"]} />
        </Route>

        <Route path="/:store/profile">
          <ProtectedRoute
            component={ProfilePage}
            roles={["admin", "sales", "user", "super_admin", "manager", "client"]}
          />
        </Route>

        <Route path="/:store/favorites">
          <ProtectedRoute
            component={FavoritesPage}
            roles={["admin", "sales", "user", "super_admin", "manager", "client"]}
          />
        </Route>

        <Route path="/:store/orders">
          <ProtectedRoute
            component={OrdersPage}
            roles={["admin", "sales", "user", "super_admin", "manager", "client"]}
          />
        </Route>

        <Route path="/profile">
          <ProtectedRoute
            component={ProfilePage}
            roles={["admin", "sales", "user", "super_admin", "manager", "client"]}
          />
        </Route>

        <Route path="/favorites">
          <ProtectedRoute
            component={FavoritesPage}
            roles={["admin", "sales", "user", "super_admin", "manager", "client"]}
          />
        </Route>

        <Route path="/orders">
          <ProtectedRoute
            component={OrdersPage}
            roles={["admin", "sales", "user", "super_admin", "manager", "client"]}
          />
        </Route>

        <Route path="/:store/users">
          <ProtectedRoute component={UserManagementPage} roles={["super_admin"]} />
        </Route>

        <Route path="/:store" component={HomePage} />

        <Route path="/admin" component={RootRedirect} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
