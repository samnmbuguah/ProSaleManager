import { useEffect } from 'react'
import { Route, Switch } from 'wouter'
import { Toaster } from '@/components/ui/toaster'
import { useAuth } from '@/hooks/use-auth'
import { RoleBasedRoute } from '@/components/auth/RoleBasedRoute'
import MainNav from '@/components/layout/MainNav'

// Import your pages
import AuthPage from '@/pages/AuthPage'
import InventoryPage from '@/pages/InventoryPage'
import ExpensesPage from '@/pages/ExpensesPage'
import { SalesPage } from '@/pages/SalesPage'
import CustomersPage from '@/pages/CustomersPage'
import POSPage from '@/pages/PosPage'
import ProfilePage from '@/pages/ProfilePage'
import ReportsPage from '@/pages/ReportsPage'
import ShopPage from '@/pages/ShopPage'

function ProtectedRoute ({
  component: Component,
  roles
}: {
  component: React.ComponentType
  roles?: ('admin' | 'user')[]
}) {
  return (
    <RoleBasedRoute allowedRoles={roles || ['admin', 'user']}>
      <div className="min-h-screen bg-background flex flex-col">
        <MainNav />
        <main className="flex-1">
          <Component />
        </main>
      </div>
    </RoleBasedRoute>
  )
}

function App () {
  const { checkSession } = useAuth()

  useEffect(() => {
    checkSession()
  }, [checkSession])

  return (
    <>
      <Switch>
        <Route path="/auth" component={AuthPage} />

        <Route path="/shop" component={ShopPage} />

        <Route path="/">
          <ProtectedRoute component={POSPage} roles={['admin', 'user']} />
        </Route>

        <Route path="/pos">
          <ProtectedRoute component={POSPage} roles={['admin', 'user']} />
        </Route>

        <Route path="/inventory">
          <ProtectedRoute component={InventoryPage} roles={['admin', 'user']} />
        </Route>

        <Route path="/expenses">
          <ProtectedRoute component={ExpensesPage} roles={['admin', 'user']} />
        </Route>

        <Route path="/sales">
          <ProtectedRoute component={SalesPage} roles={['admin']} />
        </Route>

        <Route path="/customers">
          <ProtectedRoute component={CustomersPage} roles={['admin']} />
        </Route>

        <Route path="/reports">
          <ProtectedRoute component={ReportsPage} roles={['admin']} />
        </Route>

        <Route path="/profile">
          <ProtectedRoute component={ProfilePage} roles={['admin', 'user']} />
        </Route>
      </Switch>
      <Toaster />
    </>
  )
}

export default App
