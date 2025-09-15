import type { Product } from "@/types/product";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { ReportFilters, InventoryFilters } from "./ReportFilters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import VarianceAnalysis from "./VarianceAnalysis";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FilterPresets } from "./FilterPresets";
import { ExportOptions } from "./ExportOptions";

interface InventoryStatusProps {
  products: Product[];
  onFiltersChange: (filters: InventoryFilters) => void;
}

export default function InventoryStatus({ products, onFiltersChange }: InventoryStatusProps) {
  // Ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : [];

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [csvExportType, setCsvExportType] = useState<"inventory" | "stock-take">("inventory");

  // Filter state
  const [filters, setFilters] = useState<InventoryFilters>({
    search: "",
    category: "all",
    stockStatus: "all",
    priceRange: { min: null, max: null },
    dateRange: { start: null, end: null },
  });

  const handleFiltersChange = (newFilters: InventoryFilters) => {
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: InventoryFilters = {
      search: "",
      category: "all",
      stockStatus: "all",
      priceRange: { min: null, max: null },
      dateRange: { start: null, end: null },
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf' | 'image') => {
    try {

      // Build query parameters from current filters
      const params: Record<string, string> = {};
      if (filters.search) params.search = filters.search;
      if (filters.category && filters.category !== "all") params.category = filters.category;
      if (filters.stockStatus && filters.stockStatus !== "all") params.stockStatus = filters.stockStatus;
      if (filters.priceRange?.min) params.minPrice = filters.priceRange.min.toString();
      if (filters.priceRange?.max) params.maxPrice = filters.priceRange.max.toString();
      if (filters.dateRange?.start) params.startDate = filters.dateRange.start.toISOString();
      if (filters.dateRange?.end) params.endDate = filters.dateRange.end.toISOString();

      const endpoint = `/reports/export/${csvExportType}/${format}`;

      const response = await api.get(endpoint, {
        params,
        responseType: "blob",
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from response headers
      const contentDisposition = response.headers["content-disposition"];
      let filename = `${csvExportType}-export.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error exporting:", error);
      throw error; // Re-throw to be handled by ExportOptions component
    }
  };

  const sortedProducts = [...safeProducts].sort((a, b) => {
    let aValue = a[sortColumn as keyof typeof a];
    let bValue = b[sortColumn as keyof typeof b];
    // For value column, calculate buying price * quantity
    if (sortColumn === "value") {
      aValue = (a.piece_buying_price || 0) * (a.quantity || 0);
      bValue = (b.piece_buying_price || 0) * (b.quantity || 0);
    }
    // Numeric sort for numbers
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
    // Alphanumeric sort for strings
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return 0;
  });

  if (!Array.isArray(products)) {
    return <div className="text-center text-red-500 py-12">Failed to load products data.</div>;
  }

  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) return { label: "Out of Stock", variant: "destructive" };
    if (quantity < 10) return { label: "Low Stock", variant: "warning" };
    return { label: "In Stock", variant: "success" };
  };

  const totalValue = safeProducts.reduce(
    (sum, product) => sum + (product.piece_buying_price || 0) * (product.quantity || 0),
    0
  );

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "KSh 0.00";
    return `KSh ${Number(amount).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Inventory Status</h2>
          <p className="text-muted-foreground">Showing {safeProducts.length} products</p>
        </div>
        <div className="text-right">
          <p className="text-lg">
            Total Value: <span className="font-bold">{formatCurrency(totalValue)}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Filter Presets */}
        <FilterPresets
          type="inventory"
          onApplyPreset={handleFiltersChange}
          currentFilters={filters}
        />
        
        {/* Main Filters and Export Controls */}
        <div className="flex justify-between items-center">
          <ReportFilters
            type="inventory"
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
          <div className="flex items-center gap-2">
            <Select value={csvExportType} onValueChange={(value: "inventory" | "stock-take") => setCsvExportType(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select export type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inventory">Inventory Export</SelectItem>
                <SelectItem value="stock-take">Stock Take Template</SelectItem>
              </SelectContent>
            </Select>
            <ExportOptions
              onExport={handleExport}
              disabled={safeProducts.length === 0}
              exportType={csvExportType}
            />
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Variance Analysis
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Stock Take Variance Analysis</DialogTitle>
                </DialogHeader>
                <VarianceAnalysis onClose={() => {}} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort("name")} className="cursor-pointer select-none">
              Product {sortColumn === "name" && (sortDirection === "asc" ? "▲" : "▼")}
            </TableHead>
            <TableHead onClick={() => handleSort("sku")} className="cursor-pointer select-none">
              Product Code {sortColumn === "sku" && (sortDirection === "asc" ? "▲" : "▼")}
            </TableHead>
            <TableHead
              onClick={() => handleSort("price")}
              className="text-right cursor-pointer select-none"
            >
              Price {sortColumn === "price" && (sortDirection === "asc" ? "▲" : "▼")}
            </TableHead>
            <TableHead
              onClick={() => handleSort("quantity")}
              className="text-right cursor-pointer select-none"
            >
              Quantity {sortColumn === "quantity" && (sortDirection === "asc" ? "▲" : "▼")}
            </TableHead>
            <TableHead onClick={() => handleSort("status")} className="cursor-pointer select-none">
              Status {sortColumn === "status" && (sortDirection === "asc" ? "▲" : "▼")}
            </TableHead>
            <TableHead
              onClick={() => handleSort("value")}
              className="text-right cursor-pointer select-none"
            >
              Value {sortColumn === "value" && (sortDirection === "asc" ? "▲" : "▼")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProducts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No products found. Add products to see inventory status.
              </TableCell>
            </TableRow>
          ) : (
            sortedProducts.map((product) => {
              const status = getStockStatus(product.quantity || 0);
              const value = (product.piece_buying_price || 0) * (product.quantity || 0);
              return (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.piece_selling_price)}
                  </TableCell>
                  <TableCell className="text-right">{product.quantity || 0}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        status.variant as "default" | "destructive" | "outline" | "secondary"
                      }
                    >
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(value)}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
