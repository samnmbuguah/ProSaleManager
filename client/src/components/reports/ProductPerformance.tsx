import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportFilters, PerformanceFilters } from "./ReportFilters";
import { api } from "@/lib/api";
import { ExportOptions } from "./ExportOptions";

interface ProductPerformanceData {
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  revenue: number;
  profit: number;
  lastSold: string | null;
  averagePrice: number;
  totalSales: number;
}

interface ProductPerformanceSummary {
  totalRevenue: number;
  totalProfit: number;
  totalQuantity: number;
  totalProducts: number;
  averageRevenue: number;
  averageProfit: number;
}

interface ProductPerformanceProps {
  products: ProductPerformanceData[];
  summary?: ProductPerformanceSummary;
  onFiltersChange: (filters: PerformanceFilters) => void;
}

export default function ProductPerformance({
  products,
  summary,
  onFiltersChange,
}: ProductPerformanceProps) {
  // Ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : [];

  // Filter state
  const [filters, setFilters] = useState<PerformanceFilters>({
    search: "",
    category: "all",
    paymentMethod: "all",
    priceRange: { min: null, max: null },
    dateRange: { start: null, end: null },
  });

  const handleFiltersChange = (newFilters: PerformanceFilters) => {
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: PerformanceFilters = {
      search: "",
      category: "all",
      paymentMethod: "all",
      priceRange: { min: null, max: null },
      dateRange: { start: null, end: null },
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  if (!Array.isArray(products)) {
    return <div className="text-center text-red-500 py-12">Failed to load products data.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Product Performance</h2>
          <p className="text-muted-foreground">Showing {safeProducts.length} products</p>
        </div>
        <div className="flex items-center gap-4">
          <ExportOptions
            onExport={async (format) => {
              const params: Record<string, string> = {};
              if (filters.search) params.search = filters.search;
              if (filters.category && filters.category !== "all") params.category = filters.category;
              if (filters.dateRange?.start) params.startDate = filters.dateRange.start.toISOString();
              if (filters.dateRange?.end) params.endDate = filters.dateRange.end.toISOString();

              const response = await api.get(`/reports/export/sales/${format}`, {
                params,
                responseType: "blob",
              });

              const url = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement("a");
              link.href = url;
              const contentDisposition = response.headers["content-disposition"];
              let filename = `sales-export.${format}`;
              if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) filename = filenameMatch[1];
              }
              link.setAttribute("download", filename);
              document.body.appendChild(link);
              link.click();
              link.remove();
              window.URL.revokeObjectURL(url);
            }}
            disabled={safeProducts.length === 0}
            exportType="sales"
          />
          <div className="text-right">
            <p className="text-lg">
              Total Revenue:{" "}
              <span className="font-bold">
                KSh{" "}
                {(summary?.totalRevenue || 0).toLocaleString("en-KE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Total Profit: KSh{" "}
              {(summary?.totalProfit || 0).toLocaleString("en-KE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </div>

      <ReportFilters
        type="performance"
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

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
          {safeProducts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No products found. Add products and sales to see performance.
              </TableCell>
            </TableRow>
          ) : (
            safeProducts.map((product) => (
              <TableRow key={product.productId}>
                <TableCell>{product.productName}</TableCell>
                <TableCell>{product.productSku}</TableCell>
                <TableCell className="text-right">{product.quantity}</TableCell>
                <TableCell className="text-right">
                  KSh{" "}
                  {product.revenue.toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  KSh{" "}
                  {product.profit.toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  KSh{" "}
                  {product.averagePrice.toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell>
                  {product.lastSold ? new Date(product.lastSold).toLocaleDateString() : "Never"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
