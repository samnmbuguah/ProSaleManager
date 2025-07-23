import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface ProductPerformanceData {
  productId: number
  productName: string
  productSku: string
  quantity: number
  revenue: number
  profit: number
  lastSold: string | null
  averagePrice: number
  totalSales: number
}

interface ProductPerformanceSummary {
  totalRevenue: number
  totalProfit: number
  totalQuantity: number
  totalProducts: number
  averageRevenue: number
  averageProfit: number
}

interface ProductPerformanceProps {
  products: ProductPerformanceData[]
  summary?: ProductPerformanceSummary
  onDateRangeChange: (startDate: Date, endDate: Date) => void
  onSortChange: (sortBy: string) => void
}

export default function ProductPerformance ({
  products,
  summary,
  onDateRangeChange,
  onSortChange
}: ProductPerformanceProps) {
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : []

  if (!Array.isArray(products)) {
    return <div className="text-center text-red-500 py-12">Failed to load products data.</div>
  }

  const handleDateRangeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (startDate && endDate) {
      onDateRangeChange(new Date(startDate), new Date(endDate))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Product Performance</h2>
          <p className="text-muted-foreground">
            Showing {safeProducts.length} products
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg">
            Total Revenue:{' '}
            <span className="font-bold">KSh {(summary?.totalRevenue || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Total Profit: KSh {(summary?.totalProfit || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="flex gap-4 items-end">
        <form onSubmit={handleDateRangeSubmit} className="flex gap-4 items-end">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <label htmlFor="startDate">Start Date</label>
            <Input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <label htmlFor="endDate">End Date</label>
            <Input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button type="submit">Filter</Button>
        </form>

        <div className="grid w-full max-w-sm items-center gap-1.5">
          <label htmlFor="sortBy">Sort By</label>
          <Select onValueChange={onSortChange}>
            <SelectTrigger id="sortBy">
              <SelectValue placeholder="Select sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="profit">Profit</SelectItem>
              <SelectItem value="quantity">Quantity</SelectItem>
              <SelectItem value="lastSold">Last Sold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Product Code</TableHead>
            <TableHead className="text-right">Quantity Sold</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Profit</TableHead>
            <TableHead className="text-right">Avg Price</TableHead>
            <TableHead>Last Sold</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeProducts.length === 0
            ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No products found. Add products and sales to see performance.
              </TableCell>
            </TableRow>
              )
            : (
                safeProducts.map((product) => (
              <TableRow key={product.productId}>
                <TableCell>{product.productName}</TableCell>
                <TableCell>{product.productSku}</TableCell>
                <TableCell className="text-right">{product.quantity}</TableCell>
                <TableCell className="text-right">
                  KSh {product.revenue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right">
                  KSh {product.profit.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right">
                  KSh {product.averagePrice.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  {product.lastSold
                    ? new Date(product.lastSold).toLocaleDateString()
                    : 'Never'}
                </TableCell>
              </TableRow>
                ))
              )}
        </TableBody>
      </Table>
    </div>
  )
}
