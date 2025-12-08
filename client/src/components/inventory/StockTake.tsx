import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, Minus, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Product {
    id: number;
    name: string;
    sku: string;
    quantity: number;
    Category?: { name: string };
}

interface StockTakeItem {
    productId: number;
    productName: string;
    sku: string;
    category: string;
    systemQuantity: number;
    countedQuantity: number | null;
    variance: number;
}

export default function StockTake() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [stockTakeItems, setStockTakeItems] = useState<Map<number, StockTakeItem>>(new Map());
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [applying, setApplying] = useState(false);
    const [showOnlyWithCounts, setShowOnlyWithCounts] = useState(false);

    // Fetch products on mount
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get("/products?limit=1000");
            const data = response.data?.data?.products || response.data?.products || response.data || [];
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching products:", error);
            toast({
                title: "Error",
                description: "Failed to load products",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Get unique categories
    const categories = useMemo(() => {
        const cats = new Set<string>();
        products.forEach((p) => {
            if (p.Category?.name) cats.add(p.Category.name);
        });
        return Array.from(cats).sort();
    }, [products]);

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch =
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.sku.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory =
                categoryFilter === "all" || product.Category?.name === categoryFilter;
            const hasCount = stockTakeItems.has(product.id);
            const matchesCountFilter = !showOnlyWithCounts || hasCount;
            return matchesSearch && matchesCategory && matchesCountFilter;
        });
    }, [products, searchQuery, categoryFilter, showOnlyWithCounts, stockTakeItems]);

    // Handle counted quantity change
    const handleCountChange = (product: Product, value: string) => {
        const numValue = value === "" ? null : parseInt(value, 10);

        if (numValue === null || isNaN(numValue)) {
            // Remove from stock take if empty/invalid
            const newItems = new Map(stockTakeItems);
            newItems.delete(product.id);
            setStockTakeItems(newItems);
            return;
        }

        const item: StockTakeItem = {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            category: product.Category?.name || "Unknown",
            systemQuantity: product.quantity || 0,
            countedQuantity: numValue,
            variance: numValue - (product.quantity || 0),
        };

        const newItems = new Map(stockTakeItems);
        newItems.set(product.id, item);
        setStockTakeItems(newItems);
    };

    // Get variance stats
    const varianceStats = useMemo(() => {
        const items = Array.from(stockTakeItems.values());
        return {
            total: items.length,
            positive: items.filter((i) => i.variance > 0).length,
            negative: items.filter((i) => i.variance < 0).length,
            zero: items.filter((i) => i.variance === 0).length,
            totalVariance: items.reduce((sum, i) => sum + i.variance, 0),
        };
    }, [stockTakeItems]);

    // Apply updates
    const handleApplyUpdates = async () => {
        try {
            setApplying(true);
            const updates = Array.from(stockTakeItems.values()).map((item) => ({
                productId: item.productId,
                newQuantity: item.countedQuantity,
            }));

            const response = await api.post("/reports/stock-take/apply", { updates });

            if (response.data.success) {
                toast({
                    title: "Stock Take Applied",
                    description: `Updated ${response.data.data.updated} products successfully`,
                });
                setStockTakeItems(new Map());
                setShowConfirmDialog(false);
                fetchProducts(); // Refresh data
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error("Error applying stock take:", error);
            toast({
                title: "Error",
                description: "Failed to apply stock take updates",
                variant: "destructive",
            });
        } finally {
            setApplying(false);
        }
    };

    // Clear all counts
    const handleClearAll = () => {
        setStockTakeItems(new Map());
    };

    const getVarianceBadge = (variance: number) => {
        if (variance > 0) {
            return (
                <Badge variant="default" className="bg-green-100 text-green-800">
                    <TrendingUp className="h-3 w-3 mr-1" />+{variance}
                </Badge>
            );
        } else if (variance < 0) {
            return (
                <Badge variant="destructive">
                    <TrendingDown className="h-3 w-3 mr-1" />{variance}
                </Badge>
            );
        }
        return (
            <Badge variant="secondary">
                <Minus className="h-3 w-3 mr-1" />0
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold">Stock Take</h2>
                    <p className="text-muted-foreground">
                        Enter counted quantities to compare with system inventory
                    </p>
                </div>
                <div className="flex gap-2">
                    {stockTakeItems.size > 0 && (
                        <>
                            <Button variant="outline" onClick={handleClearAll}>
                                Clear All
                            </Button>
                            <Button onClick={() => setShowConfirmDialog(true)}>
                                <Check className="mr-2 h-4 w-4" />
                                Apply Updates ({stockTakeItems.size})
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            {stockTakeItems.size > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium">Items Counted</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                            <div className="text-2xl font-bold">{varianceStats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium text-green-600">Over Stock</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                            <div className="text-2xl font-bold text-green-600">{varianceStats.positive}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium text-red-600">Under Stock</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                            <div className="text-2xl font-bold text-red-600">{varianceStats.negative}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium">No Variance</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                            <div className="text-2xl font-bold">{varianceStats.zero}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium">Net Variance</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                            <div className={`text-2xl font-bold ${varianceStats.totalVariance > 0 ? 'text-green-600' : varianceStats.totalVariance < 0 ? 'text-red-600' : ''}`}>
                                {varianceStats.totalVariance > 0 ? '+' : ''}{varianceStats.totalVariance}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={showOnlyWithCounts}
                        onChange={(e) => setShowOnlyWithCounts(e.target.checked)}
                        className="rounded"
                    />
                    Show only counted items
                </label>
                <span className="text-sm text-muted-foreground">
                    Showing {filteredProducts.length} of {products.length} products
                </span>
            </div>

            {/* Products Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">System Qty</TableHead>
                            <TableHead className="text-right w-32">Counted Qty</TableHead>
                            <TableHead className="text-center">Variance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    No products found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((product) => {
                                const stockItem = stockTakeItems.get(product.id);
                                return (
                                    <TableRow key={product.id} className={stockItem ? 'bg-blue-50' : ''}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{product.sku}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{product.Category?.name || "Unknown"}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{product.quantity || 0}</TableCell>
                                        <TableCell className="text-right">
                                            <Input
                                                type="number"
                                                min="0"
                                                placeholder="—"
                                                value={stockItem?.countedQuantity ?? ""}
                                                onChange={(e) => handleCountChange(product, e.target.value)}
                                                className="w-24 text-right"
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {stockItem ? getVarianceBadge(stockItem.variance) : "—"}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Confirm Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            Confirm Stock Take Updates
                        </DialogTitle>
                        <DialogDescription>
                            You are about to update quantities for {stockTakeItems.size} products.
                            This action will replace the system quantities with your counted values.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <p className="text-sm">Summary:</p>
                        <ul className="text-sm space-y-1 list-disc pl-5">
                            <li><span className="text-green-600">{varianceStats.positive}</span> products with positive variance (over stock)</li>
                            <li><span className="text-red-600">{varianceStats.negative}</span> products with negative variance (under stock)</li>
                            <li>{varianceStats.zero} products with no variance</li>
                            <li>Net variance: <span className={varianceStats.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {varianceStats.totalVariance > 0 ? '+' : ''}{varianceStats.totalVariance}
                            </span></li>
                        </ul>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleApplyUpdates} disabled={applying}>
                            {applying ? "Applying..." : "Confirm & Apply"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
