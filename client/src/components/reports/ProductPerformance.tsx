import { useState } from 'react'
import type { Product } from '@/types/schema'
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

interface ProductSales {
  productId: number;
  quantity: number;
  revenue: number;
  profit: number;
  lastSold: Date;
}

interface ProductPerformanceProps {
  products: Product[];
  sales: ProductSales[];
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  onSortChange: (sortBy: string) => void;
}

export default function ProductPerformance ({
  products,
  sales,
  onDateRangeChange,
  onSortChange
}: ProductPerformanceProps) {
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const handleDateRangeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (startDate && endDate) {
      onDateRangeChange(new Date(startDate), new Date(endDate))
    }
  }

  const totalRevenue = sales.reduce((sum, s) => sum + s.revenue, 0)
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Product Performance</h2>
          <p className="text-muted-foreground">
            Showing {products.length} products
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg">
            Total Revenue:{' '}
            <span className="font-bold">${totalRevenue.toFixed(2)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Total Profit: ${totalProfit.toFixed(2)}
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
            <TableHead>Last Sold</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const sale = sales.find((s) => s.productId === product.id) || {
              quantity: 0,
              revenue: 0,
              profit: 0,
              lastSold: null
            }
            return (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell className="text-right">{sale.quantity}</TableCell>
                <TableCell className="text-right">
                  ${sale.revenue.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ${sale.profit.toFixed(2)}
                </TableCell>
                <TableCell>
                  {sale.lastSold
                    ? new Date(sale.lastSold).toLocaleDateString()
                    : 'Never'}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
