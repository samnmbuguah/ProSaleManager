import React from "react";
import { Product } from "../../types/product";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import {
  ResponsiveTable,
  createTextColumn,
  createCurrencyColumn,
  createActionsColumn,
  createBadgeColumn,
  ResponsiveTableColumn,
} from "@/components/ui/responsive-table";
import { useAuthContext } from "@/contexts/AuthContext";
import { getStockStatus, getStockStatusText } from "@/utils/productFilters";

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onEdit, onDelete }) => {
  const { user } = useAuthContext();

  // Check if user is sales/cashier (should not see edit/delete buttons)
  const isSalesOrCashier = user?.role === "sales";

  const columns: ResponsiveTableColumn<Product>[] = [
    createTextColumn("name", "Product Name", (product) => product.name, { priority: 1 }),
    createTextColumn("sku", "SKU", (product) => product.sku, { hideOnMobile: true, priority: 2 }),
    createTextColumn("category", "Category", (product) => product.Category?.name || "N/A", {
      hideOnMobile: true,
      priority: 3,
    }),
    createBadgeColumn(
      "stock_status",
      "Stock Status",
      (product) => getStockStatusText(getStockStatus(product)),
      (product) => {
        const status = getStockStatus(product);
        switch (status) {
          case "in-stock":
            return "default";
          case "low-stock":
            return "secondary";
          case "out-of-stock":
            return "destructive";
          default:
            return "outline";
        }
      },
      { priority: 4 }
    ),
    createTextColumn(
      "quantity",
      "Quantity",
      (product) => `${product.quantity} ${product.stock_unit}`,
      { priority: 5 }
    ),
    createCurrencyColumn("piece_price", "Piece Price", (product) => product.piece_selling_price, {
      priority: 6,
    }),
    createCurrencyColumn("pack_price", "Pack Price", (product) => product.pack_selling_price, {
      hideOnMobile: true,
      priority: 7,
    }),
    createCurrencyColumn("dozen_price", "Dozen Price", (product) => product.dozen_selling_price, {
      hideOnMobile: true,
      priority: 8,
    }),
  ];

  // Only add actions column for non-sales users
  if (!isSalesOrCashier) {
    columns.push(
      createActionsColumn(
        "actions",
        "Actions",
        (product) => (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(product.id)}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        ),
        { priority: 9 }
      )
    );
  }

  return (
    <ResponsiveTable
      data={products}
      columns={columns}
      keyExtractor={(product) => product.id}
      title="Products"
      description="Manage your product inventory"
      emptyMessage="No products available"
    />
  );
};

export default ProductList;

export { };
