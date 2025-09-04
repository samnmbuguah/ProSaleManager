import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, Package, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { Sale } from "@/types/sale";

interface OrderDetailsDialogProps {
    order: Sale;
    open: boolean;
    onClose: () => void;
}

function OrderDetailsDialog({ order, open, onClose }: OrderDetailsDialogProps) {
    const formatCurrency = (amount: string | number) => {
        return `KSh ${Number(amount).toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed":
            case "fulfilled":
                return "bg-green-100 text-green-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "unprocessed":
                return "bg-blue-100 text-blue-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "paid":
                return "bg-green-100 text-green-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "failed":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Details - #{order.id}
          </DialogTitle>
          <DialogDescription>
            View detailed information about your order including items, payment status, and delivery information.
          </DialogDescription>
        </DialogHeader>

                <div className="space-y-6">
                    {/* Order Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Order Date</p>
                                    <p className="font-medium">
                                        {format(new Date(order.createdAt), "PPP 'at' p")}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Amount</p>
                                    <p className="font-medium text-lg">
                                        {formatCurrency(order.total_amount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Order Status</p>
                                    <Badge className={getStatusColor(order.status)}>
                                        {order.status}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Payment Status</p>
                                    <Badge className={getPaymentStatusColor(order.payment_status)}>
                                        {order.payment_status}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Order Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Unit Price</TableHead>
                                        <TableHead>Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{item.Product.name}</p>
                                                    {item.Product.sku && (
                                                        <p className="text-sm text-gray-500">SKU: {item.Product.sku}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {item.quantity} {item.unit_type}
                                            </TableCell>
                                            <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                                            <TableCell className="font-medium">
                                                {formatCurrency(item.total)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Payment Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Payment Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span>Payment Method:</span>
                                <span className="font-medium">{order.payment_method}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Amount Paid:</span>
                                <span className="font-medium">{formatCurrency(order.amount_paid)}</span>
                            </div>
                            {order.delivery_fee > 0 && (
                                <div className="flex justify-between">
                                    <span>Delivery Fee:</span>
                                    <span className="font-medium">{formatCurrency(order.delivery_fee)}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function OrdersPage() {
    const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null);
    const [currentPage] = useState(1);
    const pageSize = 10;

    const { data: ordersData, isLoading, error } = useQuery<{
        orders: Sale[];
    }>({
        queryKey: ["orders", currentPage],
        queryFn: async () => {
            const response = await api.get(
                API_ENDPOINTS.orders.list + `?page=${currentPage}&pageSize=${pageSize}`
            );
            return response.data;
        },
    });

    const formatCurrency = (amount: string | number) => {
        return `KSh ${Number(amount).toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed":
            case "fulfilled":
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case "pending":
                return <Clock className="h-4 w-4 text-yellow-600" />;
            case "unprocessed":
                return <Package className="h-4 w-4 text-blue-600" />;
            case "cancelled":
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <Package className="h-4 w-4 text-gray-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed":
            case "fulfilled":
                return "bg-green-100 text-green-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "unprocessed":
                return "bg-blue-100 text-blue-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "paid":
                return "bg-green-100 text-green-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "failed":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Separate orders by status
    const currentOrders = ordersData?.orders.filter(
        (order) =>
            order.status.toLowerCase() === "pending" ||
            order.status.toLowerCase() === "unprocessed"
    ) || [];

    const pastOrders = ordersData?.orders.filter(
        (order) =>
            order.status.toLowerCase() === "completed" ||
            order.status.toLowerCase() === "fulfilled" ||
            order.status.toLowerCase() === "cancelled"
    ) || [];

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading your orders...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Failed to load orders</h3>
                            <p className="text-gray-600">
                                {error instanceof Error ? error.message : "Something went wrong"}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">My Orders</h1>
                <p className="text-gray-600">
                    View and track your current and past orders
                </p>
            </div>

            <Tabs defaultValue="current" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="current" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Current Orders ({currentOrders.length})
                    </TabsTrigger>
                    <TabsTrigger value="past" className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Past Orders ({pastOrders.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="current" className="space-y-4">
                    {currentOrders.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No current orders</h3>
                                    <p className="text-gray-600">
                                        You don't have any pending orders at the moment.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {currentOrders.map((order) => (
                                <Card key={order.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(order.status)}
                                                    <div>
                                                        <h3 className="font-semibold">Order #{order.id}</h3>
                                                        <p className="text-sm text-gray-600">
                                                            {format(new Date(order.createdAt), "PPP")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-semibold text-lg">
                                                        {formatCurrency(order.total_amount)}
                                                    </p>
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge className={getStatusColor(order.status)}>
                                                            {order.status}
                                                        </Badge>
                                                        <Badge className={getPaymentStatusColor(order.payment_status)}>
                                                            {order.payment_status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setSelectedOrder(order)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Details
                                                        </Button>
                                                    </DialogTrigger>
                                                </Dialog>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="past" className="space-y-4">
                    {pastOrders.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No past orders</h3>
                                    <p className="text-gray-600">
                                        You haven't completed any orders yet.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {pastOrders.map((order) => (
                                <Card key={order.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(order.status)}
                                                    <div>
                                                        <h3 className="font-semibold">Order #{order.id}</h3>
                                                        <p className="text-sm text-gray-600">
                                                            {format(new Date(order.createdAt), "PPP")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-semibold text-lg">
                                                        {formatCurrency(order.total_amount)}
                                                    </p>
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge className={getStatusColor(order.status)}>
                                                            {order.status}
                                                        </Badge>
                                                        <Badge className={getPaymentStatusColor(order.payment_status)}>
                                                            {order.payment_status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setSelectedOrder(order)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Details
                                                        </Button>
                                                    </DialogTrigger>
                                                </Dialog>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {selectedOrder && (
                <OrderDetailsDialog
                    order={selectedOrder}
                    open={!!selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </div>
    );
}
