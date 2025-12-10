import { useEffect, useMemo, useState, useCallback } from "react";
import { Search, RefreshCw, BadgeCheck, BellRing, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "@/components/ui/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

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
}

interface PendingItem {
  id: number;
  product_name: string;
  sku?: string | null;
  category_name?: string | null;
  system_quantity: number;
  counted_quantity: number;
  variance: number;
}

interface PendingSession {
  id: number;
  status: string;
  createdAt: string;
  notes?: string | null;
  submittedBy?: { id: number; name: string; email: string };
  items?: PendingItem[];
}

const REVIEW_ROLES = ["admin", "manager", "super_admin"] as const;

const formatVariance = (variance: number) => {
  if (variance > 0) return { label: `+${variance}`, tone: "positive" as const };
  if (variance < 0) return { label: `${variance}`, tone: "negative" as const };
  return { label: "0", tone: "neutral" as const };
};

export default function StockTake() {
  const { user } = useAuthContext();
  const isReviewer = REVIEW_ROLES.includes(user?.role as (typeof REVIEW_ROLES)[number]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showOnlyWithCounts, setShowOnlyWithCounts] = useState(false);
  const [stockTakeItems, setStockTakeItems] = useState<Map<number, StockTakeItem>>(new Map());
  const [submitting, setSubmitting] = useState(false);

  const [pendingSessions, setPendingSessions] = useState<PendingSession[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  }, [toast]);

  const fetchPending = useCallback(async () => {
    try {
      setPendingLoading(true);
      const response = await api.get(API_ENDPOINTS.reports.stockTakePending);
      setPendingSessions(response.data?.data?.sessions || []);
    } catch (error) {
      console.error("Error loading pending stock takes:", error);
      toast({
        title: "Error",
        description: "Could not load pending stock takes",
        variant: "destructive",
      });
    } finally {
      setPendingLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (isReviewer) {
      fetchPending();
    }
  }, [isReviewer, fetchPending]);

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
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || product.Category?.name === categoryFilter;
      const hasCount = stockTakeItems.has(product.id);
      const matchesCountFilter = !showOnlyWithCounts || hasCount;
      return matchesSearch && matchesCategory && matchesCountFilter;
    });
  }, [products, searchQuery, categoryFilter, showOnlyWithCounts, stockTakeItems]);

  const handleCountChange = (product: Product, value: string) => {
    const numValue = value === "" ? null : parseInt(value, 10);

    if (numValue === null || isNaN(numValue)) {
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
    };

    const newItems = new Map(stockTakeItems);
    newItems.set(product.id, item);
    setStockTakeItems(newItems);
  };

  const handleClearAll = () => {
    setStockTakeItems(new Map());
  };

  const handleSubmitCounts = async () => {
    if (stockTakeItems.size === 0) {
      toast({
        title: "No counts entered",
        description: "Add counted quantities before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const items = Array.from(stockTakeItems.values()).map((item) => ({
        productId: item.productId,
        countedQuantity: item.countedQuantity,
      }));
      const response = await api.post(API_ENDPOINTS.reports.stockTakeSubmit, { items });
      if (response.data?.success) {
        toast({
          title: "Submitted for review",
          description: `Sent ${items.length} items for admin review.`,
        });
        setStockTakeItems(new Map());
        fetchProducts();
        if (isReviewer) {
          fetchPending();
        }
      } else {
        throw new Error(response.data?.message || "Failed to submit stock take");
      }
    } catch (error) {
      console.error("Error submitting stock take:", error);
      toast({
        title: "Error",
        description: "Failed to submit stock take for review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (sessionId: number) => {
    try {
      await api.post(API_ENDPOINTS.reports.stockTakeApprove(sessionId), {});
      toast({
        title: "Stock take applied",
        description: `Updated inventory for session #${sessionId}`,
      });
      fetchPending();
      fetchProducts();
    } catch (error) {
      console.error("Error approving stock take:", error);
      toast({
        title: "Error",
        description: "Failed to apply stock take",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (sessionId: number) => {
    try {
      await api.post(API_ENDPOINTS.reports.stockTakeReject(sessionId), {});
      toast({
        title: "Stock take rejected",
        description: `Marked session #${sessionId} as rejected`,
      });
      fetchPending();
    } catch (error) {
      console.error("Error rejecting stock take:", error);
      toast({
        title: "Error",
        description: "Failed to reject stock take",
        variant: "destructive",
      });
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
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Stock Take</h2>
          <p className="text-muted-foreground">
            Enter counted quantities and send them for admin review. Variance will only be shown to
            reviewers.
          </p>
        </div>
        {stockTakeItems.size > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClearAll}>
              Clear All
            </Button>
            <Button onClick={handleSubmitCounts} disabled={submitting}>
              {submitting ? "Submitting..." : `Submit (${stockTakeItems.size})`}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Capture counts</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cashiers only see counted quantities here. Admins will review variance separately.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
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

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">System Qty</TableHead>
                  <TableHead className="text-right w-32">Counted Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const stockItem = stockTakeItems.get(product.id);
                    return (
                      <TableRow key={product.id} className={stockItem ? "bg-blue-50" : ""}>
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
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isReviewer && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              Pending stock take reviews
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Admins and managers can see variance here and apply or reject submissions.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading pending submissions...
              </div>
            ) : pendingSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending stock takes.</p>
            ) : (
              pendingSessions.map((session) => (
                <div key={session.id} className="border rounded-md p-4 space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="font-semibold">Session #{session.id}</div>
                      <div className="text-sm text-muted-foreground">
                        Submitted by {session.submittedBy?.name || "Unknown"} on{" "}
                        {new Date(session.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(session.id)}
                        className="flex items-center gap-2"
                      >
                        <Ban className="h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(session.id)}
                        className="flex items-center gap-2"
                      >
                        <BadgeCheck className="h-4 w-4" />
                        Apply
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">System</TableHead>
                          <TableHead className="text-right">Counted</TableHead>
                          <TableHead className="text-right">Variance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(session.items || []).map((item) => {
                          const { label, tone } = formatVariance(item.variance);
                          const toneClass =
                            tone === "positive"
                              ? "text-green-600"
                              : tone === "negative"
                                ? "text-red-600"
                                : "text-muted-foreground";
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.product_name}</TableCell>
                              <TableCell>{item.sku || "—"}</TableCell>
                              <TableCell>{item.category_name || "—"}</TableCell>
                              <TableCell className="text-right">{item.system_quantity}</TableCell>
                              <TableCell className="text-right">{item.counted_quantity}</TableCell>
                              <TableCell className={`text-right font-semibold ${toneClass}`}>
                                {label}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
