import type { Product } from '@/types/schema'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface InventoryStatusProps {
  products: Product[]
  onSearch: (query: string) => void
}

export default function InventoryStatus({
  products,
  onSearch
}: InventoryStatusProps) {
  // Ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : []

  if (!Array.isArray(products)) {
    return <div className="text-center text-red-500 py-12">Failed to load products data.</div>
  }

  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) return { label: 'Out of Stock', variant: 'destructive' }
    if (quantity < 10) return { label: 'Low Stock', variant: 'warning' }
    return { label: 'In Stock', variant: 'success' }
  }

  const totalValue = safeProducts.reduce(
    (sum, product) => sum + (product.price || 0) * (product.quantity || 0),
    0
  )

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'KSh 0.00'
    return `KSh ${Number(amount).toFixed(2)}`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Inventory Status</h2>
          <p className="text-muted-foreground">
            Showing {safeProducts.length} products
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg">
            Total Value:{' '}
            <span className="font-bold">{formatCurrency(totalValue)}</span>
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search products..."
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Product Code</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeProducts.length === 0
            ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No products found. Add products to see inventory status.
                </TableCell>
              </TableRow>
            )
            : (
              safeProducts.map((product) => {
                const status = getStockStatus(product.quantity || 0)
                const value = (product.price || 0) * (product.quantity || 0)
                return (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell className="text-right">{product.quantity || 0}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant as "default" | "destructive" | "outline" | "secondary"}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(value)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
        </TableBody>
      </Table>
    </div>
  )
}
