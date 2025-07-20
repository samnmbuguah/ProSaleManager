import { Link, useLocation } from 'wouter'
import { useAuthContext } from '@/contexts/AuthContext'
import {
  Store,
  PackageSearch,
  Users,
  BarChart3,
  LogOut,
  User,
  Receipt,
  Menu,
  Wallet,
  ShoppingCart,
  ShoppingBag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { useCart } from '@/contexts/CartContext'
import CartModal from '@/components/pos/CartModal'
import { useStoreContext } from '@/contexts/StoreContext';

const ROLE_ROUTES = {
  user: [
    { path: '/pos', label: 'POS', icon: Store },
    { path: '/inventory', label: 'Inventory', icon: PackageSearch },
    { path: '/expenses', label: 'Expenses', icon: Wallet },
    { path: '/shop', label: 'Shop', icon: ShoppingBag }
  ],
  admin: [
    { path: '/pos', label: 'POS', icon: Store },
    { path: '/inventory', label: 'Inventory', icon: PackageSearch },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/sales', label: 'Sales', icon: Receipt },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/expenses', label: 'Expenses', icon: Wallet },
    { path: '/shop', label: 'Shop', icon: ShoppingBag }
  ]
}

export default function MainNav() {
  const [location] = useLocation()
  const { user, logout } = useAuthContext()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const { cart } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const { currentStore, setCurrentStore, stores } = useStoreContext();

  if (!user) return null

  const routes = ROLE_ROUTES[user.role as keyof typeof ROLE_ROUTES] || ROLE_ROUTES.user

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: 'Success',
        description: 'Logged out successfully'
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Logout failed',
        description: 'Please try again later'
      })
    }
  }

  const NavLinks = () => (
    <>
      {routes.map(({ path, label, icon: Icon }: { path: string; label: string; icon: React.ComponentType<{ className?: string }> }) => (
        <Link key={path} href={path}>
          <Button
            variant={location === path ? 'default' : 'ghost'}
            className="flex items-center space-x-2"
            onClick={() => setIsOpen(false)}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Button>
        </Link>
      ))}
    </>
  )

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b shadow-sm">
      <div className="max-w-7xl mx-auto w-full px-6">
        <div className="h-16 min-h-16 flex items-center justify-between w-full">
          {/* Left placeholder for spacing on mobile */}
          <div className="flex-1 flex items-center md:hidden" />

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-2 mt-4">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-x-4">
            <NavLinks />
          </div>

          <div className="flex items-center gap-x-2">
            {/* Floating Cart Button */}
            <Button variant="ghost" size="icon" onClick={() => setCartOpen(true)} className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cart.items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1">
                  {cart.items.length}
                </span>
              )}
            </Button>
            <CartModal open={cartOpen} onOpenChange={setCartOpen} />
            <div className="hidden md:flex items-center gap-x-2">
              <Link href="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-x-2 hover:bg-accent"
                >
                  <User className="h-4 w-4" />
                  <span className="truncate align-middle">{user.name}</span>
                </Button>
              </Link>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          {user?.role === 'super_admin' && stores.length > 0 && (
            <div className="ml-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Store:</span>
              <select
                className="border rounded px-2 py-1"
                value={currentStore?.id || ''}
                onChange={e => {
                  const store = stores.find(s => s.id === Number(e.target.value));
                  if (store) setCurrentStore(store);
                }}
              >
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
