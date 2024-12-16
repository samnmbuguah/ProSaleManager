import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
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
import { useUser } from "./hooks/use-user";
import { Loader2 } from "lucide-react";

function Router() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container mx-auto p-4 pt-20">
        <Switch>
          <Route path="/" component={PosPage} />
          <Route path="/inventory" component={InventoryPage} />
          <Route path="/customers" component={CustomersPage} />
          <Route path="/sales" component={SalesPage} />
          <Route path="/reports" component={ReportsPage} />
          <Route path="/expenses" component={ExpensesPage} />
          <Route>404 Page Not Found</Route>
        </Switch>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);
