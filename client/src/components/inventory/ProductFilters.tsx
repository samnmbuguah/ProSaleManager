import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Filter, RotateCcw } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";
import type { ProductFilters as ProductFiltersType } from "@/store/productsSlice";

interface ProductFiltersProps {
    filters: ProductFiltersType;
    onFiltersChange: (filters: Partial<ProductFiltersType>) => void;
    onClearFilters: () => void;
    onClose?: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
    filters,
    onFiltersChange,
    onClearFilters,
    onClose,
}) => {
    const { data: categories } = useCategories();

    const handleCategoryChange = (value: string) => {
        onFiltersChange({
            categoryId: value === "all" ? null : parseInt(value),
        });
    };

    const handleStockStatusChange = (value: string) => {
        onFiltersChange({
            stockStatus: value as ProductFiltersType["stockStatus"],
        });
    };

    const handleStockUnitChange = (value: string) => {
        onFiltersChange({
            stockUnit: value as ProductFiltersType["stockUnit"],
        });
    };

    const handleIsActiveChange = (value: string) => {
        onFiltersChange({
            isActive: value === "all" ? null : value === "active",
        });
    };

    const handlePriceRangeChange = (field: "min" | "max", value: string) => {
        const numValue = value === "" ? null : parseFloat(value);
        onFiltersChange({
            priceRange: {
                ...filters.priceRange,
                [field]: numValue,
            },
        });
    };

    const handleQuantityRangeChange = (field: "min" | "max", value: string) => {
        const numValue = value === "" ? null : parseInt(value);
        onFiltersChange({
            quantityRange: {
                ...filters.quantityRange,
                [field]: numValue,
            },
        });
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        if (filters.categoryId !== null) count++;
        if (filters.stockStatus !== "all") count++;
        if (filters.stockUnit !== "all") count++;
        if (filters.isActive !== null) count++;
        if (filters.priceRange.min !== null || filters.priceRange.max !== null) count++;
        if (filters.quantityRange.min !== null || filters.quantityRange.max !== null) count++;
        return count;
    };

    const activeFiltersCount = getActiveFiltersCount();

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filters
                        {activeFiltersCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {activeFiltersCount}
                            </Badge>
                        )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {activeFiltersCount > 0 && (
                            <Button variant="outline" size="sm" onClick={onClearFilters} className="text-xs">
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Clear
                            </Button>
                        )}
                        {onClose && (
                            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Category Filter */}
                <div className="space-y-2">
                    <Label htmlFor="category-filter">Category</Label>
                    <Select
                        value={filters.categoryId?.toString() || "all"}
                        onValueChange={handleCategoryChange}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories?.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Stock Status Filter */}
                <div className="space-y-2">
                    <Label htmlFor="stock-status-filter">Stock Status</Label>
                    <Select value={filters.stockStatus} onValueChange={handleStockStatusChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select stock status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Stock Levels</SelectItem>
                            <SelectItem value="in-stock">In Stock</SelectItem>
                            <SelectItem value="low-stock">Low Stock</SelectItem>
                            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Stock Unit Filter */}
                <div className="space-y-2">
                    <Label htmlFor="stock-unit-filter">Stock Unit</Label>
                    <Select value={filters.stockUnit} onValueChange={handleStockUnitChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select stock unit" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Units</SelectItem>
                            <SelectItem value="piece">Piece</SelectItem>
                            <SelectItem value="pack">Pack</SelectItem>
                            <SelectItem value="dozen">Dozen</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Active Status Filter */}
                <div className="space-y-2">
                    <Label htmlFor="active-status-filter">Status</Label>
                    <Select
                        value={filters.isActive === null ? "all" : filters.isActive ? "active" : "inactive"}
                        onValueChange={handleIsActiveChange}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Price Range Filter */}
                <div className="space-y-2">
                    <Label>Price Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="price-min" className="text-xs text-gray-500">
                                Min Price
                            </Label>
                            <Input
                                id="price-min"
                                type="number"
                                placeholder="0.00"
                                value={filters.priceRange.min || ""}
                                onChange={(e) => handlePriceRangeChange("min", e.target.value)}
                                className="text-sm"
                            />
                        </div>
                        <div>
                            <Label htmlFor="price-max" className="text-xs text-gray-500">
                                Max Price
                            </Label>
                            <Input
                                id="price-max"
                                type="number"
                                placeholder="999.99"
                                value={filters.priceRange.max || ""}
                                onChange={(e) => handlePriceRangeChange("max", e.target.value)}
                                className="text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Quantity Range Filter */}
                <div className="space-y-2">
                    <Label>Quantity Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="quantity-min" className="text-xs text-gray-500">
                                Min Quantity
                            </Label>
                            <Input
                                id="quantity-min"
                                type="number"
                                placeholder="0"
                                value={filters.quantityRange.min || ""}
                                onChange={(e) => handleQuantityRangeChange("min", e.target.value)}
                                className="text-sm"
                            />
                        </div>
                        <div>
                            <Label htmlFor="quantity-max" className="text-xs text-gray-500">
                                Max Quantity
                            </Label>
                            <Input
                                id="quantity-max"
                                type="number"
                                placeholder="999"
                                value={filters.quantityRange.max || ""}
                                onChange={(e) => handleQuantityRangeChange("max", e.target.value)}
                                className="text-sm"
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProductFilters;
