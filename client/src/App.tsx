import { useEffect, Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";

import { RoleBasedRoute } from "@/components/auth/RoleBasedRoute";
import MainNav from "@/components/layout/MainNav";
import StoreNav from "@/components/layout/StoreNav";
import AuthPage from "@/pages/AuthPage";
import HomePage from "@/pages/HomePage";
import { useAuthContext } from "@/contexts/AuthContext";
import { AgentPanel } from "@/components/agent/AgentPanel";

// Lazy-loaded heavy pages for code splitting
const InventoryPage = lazy(() => import("@/pages/InventoryPage"));
const ExpensesPage = lazy(() => import("@/pages/ExpensesPage"));
const SalesPage = lazy(() => import("@/pages/SalesPage").then((m) => ({ default: m.SalesPage })));
const CustomersPage = lazy(() => import("@/pages/CustomersPage"));
const POSPage = lazy(() => import("@/pages/PosPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const UserManagementPage = lazy(() => import("@/pages/UserManagementPage"));
const FavoritesPage = lazy(() => import("@/pages/FavoritesPage"));
const OrdersPage = lazy(() => import("@/pages/OrdersPage"));
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
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
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

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function App() {


  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Suspense fallback={<PageLoader />}>
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

        <Route path="/sales">
          <ProtectedRoute
            component={SalesPage}
            roles={["admin", "sales", "super_admin", "manager"]}
          />
        </Route>

        <Route path="/customers">
          <ProtectedRoute
            component={CustomersPage}
            roles={["admin", "sales", "super_admin", "manager"]}
          />
        </Route>

        <Route path="/reports">
          <ProtectedRoute
            component={ReportsPage}
            roles={["admin", "super_admin", "manager"]}
          />
        </Route>

        <Route path="/expenses">
          <ProtectedRoute
            component={ExpensesPage}
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
          <ProtectedRoute component={CustomersPage} roles={["admin", "sales", "super_admin", "manager"]} />
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
      </Suspense>
      <AgentPanel />
      <Toaster />
    </>
  );
}

export default App;
