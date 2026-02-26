import { useState, useMemo, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge"; // Removed unused
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { useSuppliers } from "@/hooks/use-suppliers";
import type { Product } from "@/types/product";
interface CreatePurchaseOrderProps {
    onCancel: () => void;
    onSuccess: () => void;
}

interface OrderItem {
    productId: number;
    quantity: number;
    productName: string;
    sku: string;
    buyingPrice: number;
    unitType: string;
}

export function CreatePurchaseOrder({ onCancel, onSuccess }: CreatePurchaseOrderProps) {
    const { toast } = useToast();
    const { suppliers, isLoading: suppliersLoading } = useSuppliers();

    // Helper to get next Saturday
    const getNextSaturday = () => {
        const d = new Date();
        const resultDate = new Date(d.setDate(d.getDate() + (6 + 7 - d.getDay()) % 7));
        // If today is Saturday, formatting it might give today. 
        // If the intention is always a future date (e.g. for delivery), let's ensure it's at least tomorrow?
        // But "usually delivered on friday" implies we are ordering FOR friday? 
        // User said "Auto pick ... to the next saturday".
        // Let's stick to the nearest upcoming Saturday (including today if it is Saturday? No, "next" usually implies future).
        // If today IS Saturday, `(6 + 7 - 6) % 7` is 0. 
        // Let's assume if today is Saturday, they want NEXT Saturday (7 days later).
        if (d.getDate() === new Date().getDate()) {
            resultDate.setDate(resultDate.getDate() + 7);
        }
        return resultDate.toISOString().split('T')[0];
    };

    // Step 1: Order Details
    const [supplierId, setSupplierId] = useState<string>("");
    // Default to next Saturday
    const [expectedDate, setExpectedDate] = useState<string>(getNextSaturday());
    const [notes, setNotes] = useState("");

    // Auto-select first supplier
    useEffect(() => {
        if (suppliers && suppliers.length > 0 && !supplierId) {
            setSupplierId(suppliers[0].id.toString());
        }
    }, [suppliers, supplierId]);

    // Step 2: Product Selection
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [showOnlyOrdered, setShowOnlyOrdered] = useState(false);
    const [orderItems, setOrderItems] = useState<Map<number, OrderItem>>(new Map());

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch products on mount
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoadingProducts(true);
                const response = await api.get("/products?limit=1000");
                const data = response.data?.data || response.data?.products || [];
                setProducts(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching products:", error);
                toast({
                    title: "Error",
                    description: "Failed to load products",
                    variant: "destructive",
                });
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchProducts();
    }, [toast]);

    // Derived state
    const categories = useMemo(() => {
        const cats = new Set<string>();
        products.forEach((p) => {
            if (p.Category?.name) cats.add(p.Category.name);
        });
        return Array.from(cats).sort();
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch =
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory =
                categoryFilter === "all" || product.Category?.name === categoryFilter;
            const hasOrder = orderItems.has(product.id);
            const matchesOrderedFilter = !showOnlyOrdered || hasOrder;

            return matchesSearch && matchesCategory && matchesOrderedFilter;
        });
    }, [products, searchQuery, categoryFilter, showOnlyOrdered, orderItems]);

    const handleQuantityChange = (product: Product, value: string) => {
        const numValue = value === "" ? null : parseInt(value, 10);

        if (numValue === null || isNaN(numValue) || numValue <= 0) {
            const newItems = new Map(orderItems);
            newItems.delete(product.id);
            setOrderItems(newItems);
            return;
        }

        const item: OrderItem = {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: numValue,
            buyingPrice: product.piece_buying_price || 0, // Default to piece price
            unitType: product.stock_unit || 'piece', // Default unit
        };

        const newItems = new Map(orderItems);
        newItems.set(product.id, item);
        setOrderItems(newItems);
    };

    const handleSubmit = async () => {
        if (!supplierId) {
            toast({ title: "Error", description: "Please select a supplier", variant: "destructive" });
            return;
        }
        if (!expectedDate) {
            toast({ title: "Error", description: "Please select expected delivery date", variant: "destructive" });
            return;
        }
        if (orderItems.size === 0) {
            toast({ title: "Error", description: "Please add at least one item", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const itemsPayload = Array.from(orderItems.values()).map(item => ({
                product_id: item.productId,
                quantity: item.quantity,
                buying_price: item.buyingPrice,
                unit_type: item.unitType,
                unit_price: item.buyingPrice // Backend expects 'unit_price' usually
            }));

            await api.post(API_ENDPOINTS.purchaseOrders.create, {
                supplier_id: parseInt(supplierId),
                expected_delivery_date: expectedDate,
                notes,
                items: itemsPayload
            });

            toast({ title: "Success", description: "Purchase Order created successfully" });
            onSuccess();
        } catch (error) {
            console.error("Error creating PO:", error);
            toast({
                title: "Error",
                description: "Failed to create purchase order",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Create Purchase Order</h2>
                    <p className="text-muted-foreground">Select supplier and valid products to order.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Order ({orderItems.size} Items)
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Order Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Supplier</Label>
                        <Select value={supplierId} onValueChange={setSupplierId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliersLoading ? (
                                    <div className="p-2 text-center text-sm text-muted-foreground">Loading...</div>
                                ) : (
                                    suppliers?.map((s: { id: number; name: string }) => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Expected Delivery Date</Label>
                        <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            placeholder="Optional notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="min-h-[38px] h-[38px] resize-none overflow-hidden hover:overflow-auto focus:h-20 transition-all"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <CardTitle>Product Selection</CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <label className="flex items-center gap-2 text-sm cursor-pointer border px-3 py-2 rounded hover:bg-muted/50">
                                <input
                                    type="checkbox"
                                    checked={showOnlyOrdered}
                                    onChange={(e) => setShowOnlyOrdered(e.target.checked)}
                                    className="rounded"
                                />
                                show selected only
                            </label>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loadingProducts ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="border rounded-md max-h-[600px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="w-32">Order Qty</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                                No products found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredProducts.map(product => {
                                            const item = orderItems.get(product.id);
                                            return (
                                                <TableRow key={product.id} className={item ? "bg-blue-50/50" : ""}>
                                                    <TableCell className="font-medium">{product.name}</TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={item?.quantity || ""}
                                                            onChange={(e) => handleQuantityChange(product, e.target.value)}
                                                            className={`text-right ${item ? "border-blue-500 font-semibold" : ""}`}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Bottom Action Bar for Mobile/Convenience */}
            {orderItems.size > 0 && (
                <div className="fixed bottom-6 right-6 z-50">
                    <Button size="lg" className="shadow-lg" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Submit Order ({orderItems.size} Items)
                    </Button>
                </div>
            )}
        </div>
    );
}
