import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  AlertTriangle, 
  Package, 
  Calendar,
  Star,
  Filter
} from "lucide-react";
import { InventoryFilters, PerformanceFilters, ExpenseFilters } from "./ReportFilters";

interface FilterPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  filters: InventoryFilters | PerformanceFilters | ExpenseFilters;
  badge?: string;
}

interface FilterPresetsProps {
  type: "inventory" | "performance" | "expenses";
  onApplyPreset: (filters: any) => void;
  currentFilters: any;
}

export function FilterPresets({ type, onApplyPreset, currentFilters }: FilterPresetsProps) {
  const getInventoryPresets = (): FilterPreset[] => [
    {
      id: "low-stock",
      name: "Low Stock Items",
      description: "Products with quantity below minimum threshold",
      icon: <AlertTriangle className="h-4 w-4" />,
      filters: {
        search: "",
        category: "all",
        stockStatus: "lowstock",
        priceRange: { min: null, max: null },
        dateRange: { start: null, end: null },
      },
      badge: "Alert"
    },
    {
      id: "out-of-stock",
      name: "Out of Stock",
      description: "Products with zero quantity",
      icon: <Package className="h-4 w-4" />,
      filters: {
        search: "",
        category: "all",
        stockStatus: "outofstock",
        priceRange: { min: null, max: null },
        dateRange: { start: null, end: null },
      },
      badge: "Critical"
    },
    {
      id: "this-month",
      name: "Added This Month",
      description: "Products added in the current month",
      icon: <Calendar className="h-4 w-4" />,
      filters: {
        search: "",
        category: "all",
        stockStatus: "all",
        priceRange: { min: null, max: null },
        dateRange: { 
          start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          end: new Date()
        },
      }
    },
    {
      id: "high-value",
      name: "High Value Items",
      description: "Products with selling price above KSh 1000",
      icon: <TrendingUp className="h-4 w-4" />,
      filters: {
        search: "",
        category: "all",
        stockStatus: "all",
        priceRange: { min: 1000, max: null },
        dateRange: { start: null, end: null },
      }
    }
  ];

  const getPerformancePresets = (): FilterPreset[] => [
    {
      id: "top-performers",
      name: "Top Performers",
      description: "Products with highest revenue",
      icon: <Star className="h-4 w-4" />,
      filters: {
        search: "",
        category: "all",
        paymentMethod: "all",
        priceRange: { min: null, max: null },
        dateRange: { start: null, end: null },
      },
      badge: "Popular"
    },
    {
      id: "this-week",
      name: "This Week",
      description: "Sales performance this week",
      icon: <Calendar className="h-4 w-4" />,
      filters: {
        search: "",
        category: "all",
        paymentMethod: "all",
        priceRange: { min: null, max: null },
        dateRange: { 
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
      }
    },
    {
      id: "cash-sales",
      name: "Cash Sales",
      description: "Sales made with cash payments",
      icon: <TrendingUp className="h-4 w-4" />,
      filters: {
        search: "",
        category: "all",
        paymentMethod: "cash",
        priceRange: { min: null, max: null },
        dateRange: { start: null, end: null },
      }
    },
    {
      id: "high-margin",
      name: "High Margin Products",
      description: "Products with high profit margins",
      icon: <Star className="h-4 w-4" />,
      filters: {
        search: "",
        category: "all",
        paymentMethod: "all",
        priceRange: { min: 500, max: null },
        dateRange: { start: null, end: null },
      }
    }
  ];

  const getExpensePresets = (): FilterPreset[] => [
    {
      id: "this-month-expenses",
      name: "This Month",
      description: "Expenses for the current month",
      icon: <Calendar className="h-4 w-4" />,
      filters: {
        category: "all",
        paymentMethod: "all",
        dateRange: { 
          start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          end: new Date()
        },
      }
    },
    {
      id: "high-expenses",
      name: "High Expenses",
      description: "Expenses above KSh 5000",
      icon: <AlertTriangle className="h-4 w-4" />,
      filters: {
        category: "all",
        paymentMethod: "all",
        dateRange: { start: null, end: null },
      }
    },
    {
      id: "marketing-expenses",
      name: "Marketing",
      description: "Marketing related expenses",
      icon: <TrendingUp className="h-4 w-4" />,
      filters: {
        category: "Marketing",
        paymentMethod: "all",
        dateRange: { start: null, end: null },
      }
    },
    {
      id: "cash-expenses",
      name: "Cash Expenses",
      description: "Expenses paid with cash",
      icon: <Package className="h-4 w-4" />,
      filters: {
        category: "all",
        paymentMethod: "cash",
        dateRange: { start: null, end: null },
      }
    }
  ];

  const getPresets = (): FilterPreset[] => {
    switch (type) {
      case "inventory":
        return getInventoryPresets();
      case "performance":
        return getPerformancePresets();
      case "expenses":
        return getExpensePresets();
      default:
        return [];
    }
  };

  const presets = getPresets();

  const isPresetActive = (preset: FilterPreset) => {
    // Simple comparison - in a real app, you'd want more sophisticated comparison
    return JSON.stringify(preset.filters) === JSON.stringify(currentFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4" />
        <h3 className="text-sm font-medium">Quick Filters</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.id}
            variant={isPresetActive(preset) ? "default" : "outline"}
            size="sm"
            onClick={() => onApplyPreset(preset.filters)}
            className="h-auto p-3 justify-start"
          >
            <div className="flex items-center gap-2 w-full">
              {preset.icon}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{preset.name}</span>
                  {preset.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {preset.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{preset.description}</p>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
