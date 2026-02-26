
import { useEffect, useMemo, useState, useCallback } from "react";
import { Search, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useStoreContext } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import type { Product as FullProduct } from "@/types/product";

// Local subset type
type Product = Pick<FullProduct, "id" | "name" | "sku" | "quantity" | "Category" | "piece_buying_price" | "piece_selling_price">;

interface ReceiveStockItem {
    id: string; // Temporary ID for the row
    productId: number;
    productName: string;
    sku: string;
    currentQuantity: number;

    // Input fields
    quantity: string;
    unitType: "piece" | "pack" | "dozen";
    buyingPrice: string;
    sellingPrice: string;
    notes: string;
}

export default function ReceiveStock() {
    const { toast } = useToast();
    const { currentStore } = useStoreContext();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [receiveItems, setReceiveItems] = useState<ReceiveStockItem[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};
            const response = await api.get("/products?limit=1000", { headers });
            const data = response.data?.data || response.data?.products || [];
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load products",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast, currentStore?.id]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();
        return products.filter((product) =>
            product.name.toLowerCase().includes(query) ||
            product.sku.toLowerCase().includes(query)
        ).slice(0, 5); // Limit suggestions
    }, [products, searchQuery]);

    const handleAddProduct = (product: Product) => {
        // Check if already added? Maybe allow multiple rows for same product if receiving different batches?
        // Let's allow multiple for now, or just focus on one. 
        // Usually stock receive is unique per product per session, but valid arguments for split.

        const newItem: ReceiveStockItem = {
            id: Math.random().toString(36).substr(2, 9),
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            currentQuantity: product.quantity,
            quantity: "",
            unitType: "piece",
            buyingPrice: product.piece_buying_price?.toString() || "",
            sellingPrice: product.piece_selling_price?.toString() || "",
            notes: ""
        };

        setReceiveItems(prev => [...prev, newItem]);
        setSearchQuery(""); // Clear search after adding
    };

    const handleRemoveItem = (id: string) => {
        setReceiveItems(prev => prev.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof ReceiveStockItem, value: string) => {
        setReceiveItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleSubmit = async () => {
        if (receiveItems.length === 0) {
            toast({ title: "No items", description: "Add items to receive stock.", variant: "destructive" });
            return;
        }

        // Validate
        const invalidItems = receiveItems.filter(item =>
            !item.quantity || Number(item.quantity) <= 0 ||
            !item.buyingPrice || Number(item.buyingPrice) < 0 ||
            !item.sellingPrice // Selling price 0 allows? Maybe.
        );

        if (invalidItems.length > 0) {
            toast({ title: "Validation Error", description: "Please check quantities and prices.", variant: "destructive" });
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                items: receiveItems.map(item => ({
                    product_id: item.productId,
                    quantity: parseFloat(item.quantity),
                    unit_type: item.unitType,
                    buying_price: parseFloat(item.buyingPrice),
                    selling_price: parseFloat(item.sellingPrice),
                    notes: item.notes
                }))
            };

            const headers = currentStore?.id ? { "x-store-id": currentStore.id.toString() } : {};

            // Use relative path to avoid double /api prefix with axios instance
            await api.post("/stock/receive-bulk", payload, { headers });

            toast({
                title: "Success",
                description: `Successfully received stock for ${receiveItems.length} items.`,
            });

            setReceiveItems([]);
            fetchProducts(); // Refresh quantities
        } catch (error: any) {
            console.error("Bulk receive error", error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to receive stock",
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
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
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Receive Stock</h2>
                    <p className="text-muted-foreground">Add new inventory items in bulk.</p>
                </div>
                <div className="flex gap-2">
                    {receiveItems.length > 0 && (
                        <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => setReceiveItems([])}>
                            Clear All
                        </Button>
                    )}
                    <Button onClick={handleSubmit} disabled={submitting || receiveItems.length === 0}>
                        {submitting ? "Processing..." : "Process Receipt"}
                    </Button>
                </div>
            </div>

            {/* Search Area */}
            <Card className="overflow-visible z-10">
                <CardContent className="pt-6">
                    <div className="relative max-w-xl">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search product to add..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                        {/* Suggestions Dropdown */}
                        {searchQuery.trim() && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-60 overflow-auto">
                                {searchResults.length === 0 ? (
                                    <div className="p-3 text-sm text-gray-500 text-center">No products found</div>
                                ) : (
                                    searchResults.map(product => (
                                        <div
                                            key={product.id}
                                            className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b last:border-0"
                                            onClick={() => handleAddProduct(product)}
                                        >
                                            <div>
                                                <div className="font-medium text-sm">{product.name}</div>
                                                <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                                            </div>
                                            <div className="text-xs font-semibold">Qty: {product.quantity}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Items Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[20%]">Product</TableHead>
                                <TableHead className="w-[10%]">Count</TableHead>
                                <TableHead className="w-[12%]">Unit Type</TableHead>
                                <TableHead className="w-[12%]">Buying Price</TableHead>
                                <TableHead className="w-[12%]">Selling Price</TableHead>
                                <TableHead className="w-[15%]">Notes</TableHead>
                                <TableHead className="w-[5%]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {receiveItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                        Search and add products above to start receiving stock.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                receiveItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium text-sm">{item.productName}</div>
                                            <div className="text-xs text-muted-foreground">Current: {item.currentQuantity}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                                                className="h-8"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={item.unitType}
                                                onValueChange={(val: any) => updateItem(item.id, "unitType", val)}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="piece">Piece</SelectItem>
                                                    <SelectItem value="pack">Pack</SelectItem>
                                                    <SelectItem value="dozen">Dozen</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                placeholder="Buy Price"
                                                value={item.buyingPrice}
                                                onChange={(e) => updateItem(item.id, "buyingPrice", e.target.value)}
                                                className="h-8"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                placeholder="Sell Price"
                                                value={item.sellingPrice}
                                                onChange={(e) => updateItem(item.id, "sellingPrice", e.target.value)}
                                                className="h-8"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                placeholder="Optional notes"
                                                value={item.notes}
                                                onChange={(e) => updateItem(item.id, "notes", e.target.value)}
                                                className="h-8"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleRemoveItem(item.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
