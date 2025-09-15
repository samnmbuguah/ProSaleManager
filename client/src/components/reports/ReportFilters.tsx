import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";
import { PRODUCT_CATEGORIES } from "@/constants/categories";

export interface DateRange {
    start: Date | null;
    end: Date | null;
}

export interface InventoryFilters {
    search: string;
    category: string;
    stockStatus: string;
    priceRange: {
        min: number | null;
        max: number | null;
    };
    dateRange: DateRange;
}

export interface PerformanceFilters {
    search: string;
    category: string;
    paymentMethod: string;
    priceRange: {
        min: number | null;
        max: number | null;
    };
    dateRange: DateRange;
}

export interface ExpenseFilters {
    category: string;
    paymentMethod: string;
    dateRange: DateRange;
}

interface ReportFiltersProps {
    type: "inventory" | "performance" | "expenses";
    filters: InventoryFilters | PerformanceFilters | ExpenseFilters;
    onFiltersChange: (filters: any) => void;
    onClearFilters: () => void;
}

const paymentMethods = ["Cash", "Card", "Mobile Money", "Other"];
const stockStatuses = ["All", "In Stock", "Low Stock", "Out of Stock"];

export function ReportFilters({ type, filters, onFiltersChange, onClearFilters }: ReportFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const updateFilter = (key: string, value: any) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    const updateNestedFilter = (parentKey: string, childKey: string, value: any) => {
        onFiltersChange({
            ...filters,
            [parentKey]: {
                ...(filters as any)[parentKey],
                [childKey]: value,
            },
        });
    };

  const getActiveFiltersCount = () => {
    let count = 0;
    if ('search' in filters && filters.search) count++;
    if (filters.category && filters.category !== "all") count++;
    if ('paymentMethod' in filters && filters.paymentMethod && filters.paymentMethod !== "all") count++;
    if ('stockStatus' in filters && filters.stockStatus && filters.stockStatus !== "all") count++;
    if ('priceRange' in filters && (filters.priceRange?.min || filters.priceRange?.max)) count++;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    return count;
  };

    const activeFiltersCount = getActiveFiltersCount();

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        Filters
                        {activeFiltersCount > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {activeFiltersCount}
                            </Badge>
                        )}
                    </Button>
                    {activeFiltersCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={onClearFilters}>
                            <X className="h-4 w-4 mr-1" />
                            Clear All
                        </Button>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
          {/* Search */}
          {'search' in filters && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search products..."
                value={filters.search || ""}
                onChange={(e) => updateFilter("search", e.target.value)}
              />
            </div>
          )}

                    {/* Category */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <Select
                            value={filters.category || "all"}
                            onValueChange={(value) => updateFilter("category", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {PRODUCT_CATEGORIES.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Stock Status (Inventory only) */}
                    {type === "inventory" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Stock Status</label>
                            <Select
                                value={(filters as InventoryFilters).stockStatus || "all"}
                                onValueChange={(value) => updateFilter("stockStatus", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {stockStatuses.map((status) => (
                                        <SelectItem key={status} value={status.toLowerCase().replace(" ", "")}>
                                            {status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

          {/* Payment Method (Performance and Expenses) */}
          {(type === "performance" || type === "expenses") && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select
                value={'paymentMethod' in filters ? filters.paymentMethod || "all" : "all"}
                onValueChange={(value) => updateFilter("paymentMethod", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method.toLowerCase().replace(" ", "")}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Price Range */}
          {(type === "inventory" || type === "performance") && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Price</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={'priceRange' in filters ? filters.priceRange?.min || "" : ""}
                  onChange={(e) =>
                    updateNestedFilter("priceRange", "min", e.target.value ? Number(e.target.value) : null)
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Price</label>
                <Input
                  type="number"
                  placeholder="No limit"
                  value={'priceRange' in filters ? filters.priceRange?.max || "" : ""}
                  onChange={(e) =>
                    updateNestedFilter("priceRange", "max", e.target.value ? Number(e.target.value) : null)
                  }
                />
              </div>
            </>
          )}

                    {/* Date Range */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Start Date</label>
                        <Input
                            type="date"
                            value={filters.dateRange?.start ? filters.dateRange.start.toISOString().split('T')[0] : ""}
                            onChange={(e) =>
                                updateNestedFilter("dateRange", "start", e.target.value ? new Date(e.target.value) : null)
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">End Date</label>
                        <Input
                            type="date"
                            value={filters.dateRange?.end ? filters.dateRange.end.toISOString().split('T')[0] : ""}
                            onChange={(e) =>
                                updateNestedFilter("dateRange", "end", e.target.value ? new Date(e.target.value) : null)
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
