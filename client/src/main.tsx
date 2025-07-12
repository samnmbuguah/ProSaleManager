import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Switch, Route } from 'wouter'
import './index.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import PosPage from './pages/PosPage'
import InventoryPage from './pages/InventoryPage'
import CustomersPage from './pages/CustomersPage'
import ReportsPage from './pages/ReportsPage'
import AuthPage from './pages/AuthPage'
import { SalesPage } from './pages/SalesPage'
import ExpensesPage from './pages/ExpensesPage'
import MainNav from './components/layout/MainNav'
import { RoleBasedRoute } from './components/auth/RoleBasedRoute'
import { CartProvider } from '@/contexts/CartContext'
import ProfilePage from './pages/ProfilePage'
import { Provider } from 'react-redux'
import { store } from './store'
import { AuthProvider } from '@/contexts/AuthContext'

// Force light mode by removing the 'dark' class from html and body
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('dark')
  document.body.classList.remove('dark')
}

function App () {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <Router />
        </CartProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

function ProtectedRoute ({
  component: Component,
  roles
}: {
  component: React.ComponentType;
  roles?: ('admin' | 'user')[];
}) {
  return (
    <RoleBasedRoute allowedRoles={roles || ['admin', 'user']}>
      <div className="min-h-screen bg-background flex flex-col">
        <MainNav />
        <main className="flex-1 ">
          <Component />
        </main>
      </div>
    </RoleBasedRoute>
  )
}

function Router () {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route
        path="/"
        component={() => (
          <ProtectedRoute component={PosPage} roles={['admin', 'user']} />
        )}
      />
      <Route
        path="/pos"
        component={() => (
          <ProtectedRoute component={PosPage} roles={['admin', 'user']} />
        )}
      />
      <Route
        path="/inventory"
        component={() => (
          <ProtectedRoute component={InventoryPage} roles={['admin', 'user']} />
        )}
      />
      <Route
        path="/customers"
        component={() => (
          <ProtectedRoute component={CustomersPage} roles={['admin']} />
        )}
      />
      <Route
        path="/sales"
        component={() => (
          <ProtectedRoute component={SalesPage} roles={['admin']} />
        )}
      />
      <Route
        path="/reports"
        component={() => (
          <ProtectedRoute component={ReportsPage} roles={['admin']} />
        )}
      />
      <Route
        path="/expenses"
        component={() => (
          <ProtectedRoute component={ExpensesPage} roles={['admin', 'user']} />
        )}
      />
      <Route
        path="/profile"
        component={() => (
          <ProtectedRoute component={ProfilePage} roles={['admin', 'user']} />
        )}
      />
      <Route>404 Page Not Found</Route>
    </Switch>
  )
}

const root = document.getElementById('root') as HTMLElement
createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
)
