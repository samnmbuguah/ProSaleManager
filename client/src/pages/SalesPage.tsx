import { useState } from "react";
import { ReceiptSettings } from "@/components/pos/ReceiptSettings";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Receipt, Loader2 } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Sale {
  id: number;
  customer_id: number | null;
  total_amount: string;
  payment_method: string;
  status: string;
  createdAt: string;
  customer?: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  user: {
    name: string;
    email: string;
  };
  items: {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: string;
    total: string;
    product: {
      name: string;
      product_number: string;
    };
  }[];
  receiptStatus?: {
    sms?: boolean;
    whatsapp?: boolean;
  };
  change_amount?: string | number;
}

interface SaleItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  total: string;
  product: {
    name: string;
    product_number: string;
  };
}

export function SalesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const pageSize = 10;

  const { data: salesData, isLoading } = useQuery<{
    sales: Sale[];
    total: number;
  }>({
    queryKey: ["sales", currentPage],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/sales?page=${currentPage}&pageSize=${pageSize}`,
        { credentials: "include" },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sales");
      }
      return response.json();
    },
  });

  const { isLoading: isLoadingSaleItems } = useQuery<SaleItem[]>({
    queryKey: ["sale-items", selectedSale?.id],
    queryFn: async () => {
      if (!selectedSale) return [];
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/sales/${selectedSale.id}/items`,
        { credentials: "include" },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sale items");
      }
      return response.json();
    },
    enabled: !!selectedSale,
  });

  const totalPages = salesData ? Math.ceil(salesData.total / pageSize) : 1;

  const formatCurrency = (amount: string) => {
    return `KSh ${Number(amount).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getPaymentStatusColor = (status: string | undefined) => {
    if (!status) return "bg-gray-500";

    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto p-4 mt-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sales History</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Receipt className="w-4 h-4 mr-2" />
              Receipt Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Customize Receipt</DialogTitle>
            </DialogHeader>
            <ReceiptSettings />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData?.sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {format(new Date(sale.createdAt), "PPp")}
                    </TableCell>
                    <TableCell>
                      {sale.customer?.name || "Walk-in Customer"}
                    </TableCell>
                    <TableCell>
                      {sale.user?.name || sale.user?.email || "Unknown User"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {sale.payment_method}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPaymentStatusColor(sale.status)}>
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sale.receiptStatus ? (
                        <div className="flex gap-2">
                          <Badge
                            variant={
                              sale.receiptStatus.sms ? "default" : "outline"
                            }
                          >
                            SMS
                          </Badge>
                          <Badge
                            variant={
                              sale.receiptStatus.whatsapp
                                ? "default"
                                : "outline"
                            }
                          >
                            WhatsApp
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Not sent
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(sale.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedSale(sale)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </>
      )}

      <Dialog
        open={!!selectedSale}
        onOpenChange={(open) => !open && setSelectedSale(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-8">
              {/* Summary Section */}
              <div className="flex flex-col md:grid md:grid-cols-3 gap-6 md:gap-4 border-b pb-6">
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <p>{selectedSale.customer?.name || "Walk-in Customer"}</p>
                  {selectedSale.customer?.email && (
                    <p className="text-sm text-muted-foreground">
                      {selectedSale.customer.email}
                    </p>
                  )}
                  {selectedSale.customer?.phone && (
                    <p className="text-sm text-muted-foreground">
                      {selectedSale.customer.phone}
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Payment Information</h3>
                  <p className="capitalize">
                    Method: {selectedSale.payment_method}
                  </p>
                  <p>
                    Status:{" "}
                    <Badge
                      className={getPaymentStatusColor(selectedSale.status)}
                    >
                      {selectedSale.status}
                    </Badge>
                  </p>
                  <p>Total: {formatCurrency(selectedSale.total_amount)}</p>
                  {selectedSale.change_amount && (
                    <p>
                      Change Given: {formatCurrency(selectedSale.change_amount)}
                    </p>
                  )}
                  {selectedSale.receiptStatus && (
                    <div className="mt-2 flex gap-2">
                      <Badge
                        variant={
                          selectedSale.receiptStatus.sms ? "default" : "outline"
                        }
                      >
                        SMS
                      </Badge>
                      <Badge
                        variant={
                          selectedSale.receiptStatus.whatsapp
                            ? "default"
                            : "outline"
                        }
                      >
                        WhatsApp
                      </Badge>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Sale Information</h3>
                  <p>Date: {format(new Date(selectedSale.createdAt), "PPp")}</p>
                  <p>
                    Cashier:{" "}
                    {selectedSale.user?.name ||
                      selectedSale.user?.email ||
                      "Unknown User"}
                  </p>
                  {selectedSale.status && <p>Status: {selectedSale.status}</p>}
                  {selectedSale.id && <p>Sale ID: {selectedSale.id}</p>}
                </div>
              </div>

              {/* Items Section */}
              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                {isLoadingSaleItems ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Product Number</TableHead>
                          <TableHead className="text-right">
                            Unit Price
                          </TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSale.items?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product.name}</TableCell>
                            <TableCell>{item.product.product_number}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unit_price)}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
