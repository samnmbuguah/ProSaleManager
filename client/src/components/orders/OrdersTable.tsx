import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, User, CreditCard } from "lucide-react";
import {
  ResponsiveTable,
  createActionsColumn,
  ResponsiveTableColumn,
} from "@/components/ui/responsive-table";
import { formatCurrency } from "@/utils/format";

interface Sale {
  id: number;
  total_amount: number;
  delivery_fee: number;
  customer_id: number;
  payment_method: string;
  status: string;
  payment_status: string;
  amount_paid: number | null;
  change_amount: number;
  created_at: string;
  updated_at: string;
  Customer: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    id: number;
    quantity: number;
    unit_price: number;
    total: number;
    unit_type: string;
    Product: {
      id: number;
      name: string;
      sku: string;
    };
  }>;
}

interface OrdersTableProps {
  orders: Sale[];
  onViewOrder: (order: Sale) => void;
  isLoading?: boolean;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, onViewOrder, isLoading = false }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
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

  const columns: ResponsiveTableColumn<Sale>[] = [
    {
      key: "order_info",
      label: "Order",
      priority: 1,
      render: (order) => (
        <div>
          <div className="font-medium">Order #{order.id}</div>
          <div className="text-sm text-muted-foreground">
            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
          </div>
        </div>
      ),
      mobileRender: (order) => (
        <div className="text-right">
          <div className="font-medium">Order #{order.id}</div>
          <div className="text-sm text-muted-foreground">
            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
          </div>
        </div>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      priority: 2,
      hideOnMobile: true,
      render: (order) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{order.Customer.name}</div>
            <div className="text-sm text-muted-foreground">{order.Customer.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "total",
      label: "Total",
      priority: 3,
      render: (order) => (
        <div className="font-medium text-green-600">{formatCurrency(order.total_amount)}</div>
      ),
    },
    {
      key: "status",
      label: "Status",
      priority: 4,
      render: (order) => <Badge className={getStatusColor(order.status)}>{order.status}</Badge>,
    },
    {
      key: "payment_status",
      label: "Payment",
      priority: 5,
      hideOnMobile: true,
      render: (order) => (
        <Badge className={getPaymentStatusColor(order.payment_status)}>
          {order.payment_status}
        </Badge>
      ),
    },
    {
      key: "payment_method",
      label: "Method",
      priority: 6,
      hideOnMobile: true,
      render: (order) => (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize">{order.payment_method}</span>
        </div>
      ),
    },
    {
      key: "date",
      label: "Date",
      priority: 7,
      hideOnMobile: true,
      render: (order) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{new Date(order.created_at).toLocaleDateString()}</span>
        </div>
      ),
    },
    createActionsColumn(
      "actions",
      "Actions",
      (order) => (
        <Button variant="outline" size="sm" onClick={() => onViewOrder(order)}>
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      ),
      { priority: 8 }
    ),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <ResponsiveTable
      data={orders}
      columns={columns}
      keyExtractor={(order) => order.id}
      title="Orders"
      description="View and manage customer orders"
      emptyMessage="No orders found"
    />
  );
};

export default OrdersTable;
