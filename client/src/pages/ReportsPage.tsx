import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProductPerformance from '../components/reports/ProductPerformance'
import InventoryStatus from '../components/reports/InventoryStatus'
import { useInventoryReport, useProductPerformanceReport } from '@/hooks/use-reports'

// ErrorBoundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-center text-red-500 py-12">Something went wrong in the reports page.</div>
    }
    return this.props.children
  }
}

export default function ReportsPage() {
  const { data: inventoryData, isLoading: inventoryLoading, error: inventoryError } = useInventoryReport()
  const { data: performanceData, isLoading: performanceLoading, error: performanceError } = useProductPerformanceReport()
  const [tab, setTab] = useState('inventory')

  const handleDateRangeChange = () => {
    // This will be implemented to refetch data with date filters
  }

  const handleSortChange = () => {
    // This will be implemented to sort the data
  }

  const handleSearch = async () => {
    // This will be implemented to search products
  }

  const handleFilter = async () => {
    // This will be implemented to filter by category
  }

  if (inventoryLoading || performanceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    )
  }

  if (inventoryError || performanceError) {
    return <div className="text-center text-red-500 py-12">Failed to load reports data.</div>
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4 mt-16">
        <Tabs value={tab} onValueChange={setTab} defaultValue="inventory">
          <TabsList>
            <TabsTrigger value="inventory">Inventory Status</TabsTrigger>
            <TabsTrigger value="performance">Product Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <InventoryStatus
              products={
                (inventoryData?.products || []).map(p => ({
                  ...p,
                  price: p.piece_selling_price
                }))
              }
              onSearch={handleSearch}
              onFilter={handleFilter}
            />
          </TabsContent>

          <TabsContent value="performance">
            <ProductPerformance
              products={performanceData?.products || []}
              summary={performanceData?.summary}
              onDateRangeChange={handleDateRangeChange}
              onSortChange={handleSortChange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  )
}
