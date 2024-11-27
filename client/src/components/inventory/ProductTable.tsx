import { useState } from "react";
import type { Product } from "@db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddStockDialog } from "./AddStockDialog";

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onAddStock?: (productId: number, quantity: number) => Promise<void>;
  isAddingStock?: boolean;
}

export function ProductTable({ products, isLoading, onAddStock, isAddingStock }: ProductTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>KSh {Number(product.price).toFixed(2)}</TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell>
                <Badge variant={product.stock > 10 ? "default" : "destructive"}>
                  {product.stock > 10 ? "In Stock" : "Low Stock"}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProduct(product)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stock
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedProduct && onAddStock && (
        <AddStockDialog
          product={selectedProduct}
          open={true}
          onClose={() => setSelectedProduct(null)}
          onSubmit={async (productId, quantity) => {
            await onAddStock(productId, quantity);
            setSelectedProduct(null);
          }}
          isSubmitting={isAddingStock || false}
        />
      )}
    </div>
  );
}
