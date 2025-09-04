import React from "react";
import { Product } from "../../types/product";
import { formatCurrency } from "../../utils/format";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { 
  ResponsiveTable, 
  createTextColumn, 
  createCurrencyColumn, 
  createActionsColumn,
  ResponsiveTableColumn 
} from "@/components/ui/responsive-table";

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onEdit, onDelete }) => {
  const columns: ResponsiveTableColumn<Product>[] = [
    createTextColumn(
      "name",
      "Product Name",
      (product) => product.name,
      { priority: 1 }
    ),
    createTextColumn(
      "sku",
      "SKU",
      (product) => product.sku,
      { hideOnMobile: true, priority: 2 }
    ),
    createCurrencyColumn(
      "piece_price",
      "Piece Price",
      (product) => product.piece_selling_price,
      { priority: 3 }
    ),
    createCurrencyColumn(
      "pack_price",
      "Pack Price",
      (product) => product.pack_selling_price,
      { hideOnMobile: true, priority: 4 }
    ),
    createCurrencyColumn(
      "dozen_price",
      "Dozen Price",
      (product) => product.dozen_selling_price,
      { hideOnMobile: true, priority: 5 }
    ),
    createTextColumn(
      "quantity",
      "Quantity",
      (product) => product.quantity.toString(),
      { priority: 6 }
    ),
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
      { priority: 7 }
    ),
  ];

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

export {};
