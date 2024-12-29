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
import { Receipt } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Sale {
  id: number;
  customerId: number | null;
  total: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  customer?: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  user: {
    username?: string;
    name?: string;
    email?: string;
  };
  receiptStatus?: {
    sms?: boolean;
    whatsapp?: boolean;
    lastSentAt?: string;
  };
}

interface SaleItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: string;
  total: string;
  product: {
    name: string;
    sku: string;
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
        `/api/sales?page=${currentPage}&pageSize=${pageSize}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sales");
      }
      return response.json();
    },
  });

  const { data: saleItems, isLoading: isLoadingSaleItems } = useQuery<
    SaleItem[]
  >({
    queryKey: ["sale-items", selectedSale?.id],
    queryFn: async () => {
      if (!selectedSale) return [];
      const response = await fetch(`/api/sales/${selectedSale.id}/items`);
      if (!response.ok) {
        throw new Error("Failed to fetch sale items");
      }
      return response.json();
    },
    enabled: !!selectedSale,
  });

  const totalPages = salesData
    ? Math.ceil(salesData.total / pageSize)
    : 1;

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
    <div className="container mx-auto py-6">
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
                    <TableCell>{sale.user?.username || sale.user?.name || sale.user?.email || "Unknown User"}</TableCell>
                    <TableCell className="capitalize">
                      {sale.paymentMethod}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getPaymentStatusColor(sale.paymentStatus)}
                      >
                        {sale.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sale.receiptStatus ? (
                        <div className="flex gap-2">
                          <Badge variant={sale.receiptStatus.sms ? "default" : "outline"}>
                            SMS
                          </Badge>
                          <Badge variant={sale.receiptStatus.whatsapp ? "default" : "outline"}>
                            WhatsApp
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not sent</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(sale.total)}
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
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                )
              )}
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, totalPages)
                    )
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
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <p>
                    {selectedSale.customer?.name || "Walk-in Customer"}
                  </p>
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
                    Method: {selectedSale.paymentMethod}
                  </p>
                  <p>
                    Status:{" "}
                    <Badge
                      className={getPaymentStatusColor(
                        selectedSale.paymentStatus
                      )}
                    >
                      {selectedSale.paymentStatus}
                    </Badge>
                  </p>
                  <p>Total: {formatCurrency(selectedSale.total)}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Sale Information</h3>
                  <p>Date: {format(new Date(selectedSale.createdAt), "PPp")}</p>
                  <p>Cashier: {selectedSale.user?.username || selectedSale.user?.name || selectedSale.user?.email || "Unknown User"}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                {isLoadingSaleItems ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">
                            Unit Price
                          </TableHead>
                          <TableHead className="text-right">
                            Quantity
                          </TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {saleItems?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product.name}</TableCell>
                            <TableCell>{item.product.sku}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unitPrice)}
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