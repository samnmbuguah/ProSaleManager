import { useEffect } from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";
import RoleBasedRoute from "@/components/auth/RoleBasedRoute";

// Import your pages
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import ProductsPage from "@/pages/ProductsPage";
import ExpensesPage from "@/pages/ExpensesPage";
import { SalesPage } from "@/pages/SalesPage";
import CustomersPage from "@/pages/CustomersPage";
import SuppliersPage from "@/pages/SuppliersPage";
import POSPage from "@/pages/POSPage";
import ProfilePage from "@/pages/ProfilePage";

function App() {
  const { checkSession } = useAuth();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <>
      <Switch>
        <Route path="/auth" component={AuthPage} />

        <Route path="/">
          <RoleBasedRoute allowedRoles={["admin", "user"]}>
            <DashboardPage />
          </RoleBasedRoute>
        </Route>

        <Route path="/pos">
          <RoleBasedRoute allowedRoles={["admin", "user"]}>
            <POSPage />
          </RoleBasedRoute>
        </Route>

        <Route path="/inventory">
          <RoleBasedRoute allowedRoles={["admin", "user"]}>
            <ProductsPage />
          </RoleBasedRoute>
        </Route>

        <Route path="/expenses">
          <RoleBasedRoute allowedRoles={["admin", "user"]}>
            <ExpensesPage />
          </RoleBasedRoute>
        </Route>

        <Route path="/sales">
          <RoleBasedRoute allowedRoles={["admin"]}>
            <SalesPage />
          </RoleBasedRoute>
        </Route>

        <Route path="/customers">
          <RoleBasedRoute allowedRoles={["admin"]}>
            <CustomersPage />
          </RoleBasedRoute>
        </Route>

        <Route path="/suppliers">
          <RoleBasedRoute allowedRoles={["admin"]}>
            <SuppliersPage />
          </RoleBasedRoute>
        </Route>

        <Route path="/profile">
          <RoleBasedRoute allowedRoles={["admin", "user"]}>
            <ProfilePage />
          </RoleBasedRoute>
        </Route>
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
