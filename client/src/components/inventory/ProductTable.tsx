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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductForm, type ProductFormData } from "./ProductForm";
import { Settings, Edit } from "lucide-react";

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onUpdateProduct?: (id: number, data: Partial<Product>) => Promise<void>;
}

export function ProductTable({ products = [], isLoading, onUpdateProduct }: ProductTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!Array.isArray(products)) {
    return <div>No products found</div>;
  }

  const getStockStatus = (product: Product) => {
    if (product.stock <= (product.min_stock || 0)) {
      return { label: "Low Stock", variant: "destructive" as const };
    }
    if (product.stock >= (product.max_stock || Infinity)) {
      return { label: "Overstocked", variant: "destructive" as const };
    }
    return { label: "In Stock", variant: "default" as const };
  };

  const calculateProfitMargin = (buyingPrice: number | string, sellingPrice: number | string) => {
    const buying = Number(buyingPrice);
    const selling = Number(sellingPrice);
    if (buying <= 0) return "N/A";
    return (((selling - buying) / buying) * 100).toFixed(1) + "%";
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock Unit</TableHead>
              <TableHead>Buying Price</TableHead>
              <TableHead>Selling Price</TableHead>
              <TableHead>Profit Margin</TableHead>
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
                <TableCell>{product.stock_unit}</TableCell>
                <TableCell>
                  KSh {Number(product.buying_price).toFixed(2)}
                </TableCell>
                <TableCell>
                  KSh {Number(product.selling_price).toFixed(2)}
                </TableCell>
                <TableCell>
                  {calculateProfitMargin(product.buying_price, product.selling_price)}
                </TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <Badge variant={getStockStatus(product).variant}>
                    {getStockStatus(product).label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProduct(product)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              initialData={{
                name: editingProduct.name,
                sku: editingProduct.sku,
                category: editingProduct.category || "",
                stock: editingProduct.stock,
                min_stock: editingProduct.min_stock || 0,
                max_stock: editingProduct.max_stock || 0,
                reorder_point: editingProduct.reorder_point || 0,
                stock_unit: editingProduct.stock_unit as any,
                buying_price: editingProduct.buying_price?.toString() || "0",
                selling_price: editingProduct.selling_price?.toString() || "0",
              }}
              onSubmit={async (data: ProductFormData) => {
                if (onUpdateProduct && editingProduct.id) {
                  await onUpdateProduct(editingProduct.id, {
                    name: data.name,
                    sku: data.sku,
                    category: data.category,
                    stock: data.stock,
                    min_stock: data.min_stock,
                    max_stock: data.max_stock,
                    reorder_point: data.reorder_point,
                    stock_unit: data.stock_unit,
                    buying_price: data.buying_price,
                    selling_price: data.selling_price,
                  });
                  setEditingProduct(null);
                }
              }}
              isSubmitting={false}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl">
          {selectedProduct && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>Manage Product: {selectedProduct.name}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Stock Information</h3>
                  <p>Current Stock: {selectedProduct.stock}</p>
                  <p>Minimum Stock: {selectedProduct.min_stock || "Not set"}</p>
                  <p>Maximum Stock: {selectedProduct.max_stock || "Not set"}</p>
                  <p>Reorder Point: {selectedProduct.reorder_point || "Not set"}</p>
                </div>
                <div>
                  <h3 className="font-medium">Pricing Information</h3>
                  <p>Buying Price: KSh {Number(selectedProduct.buying_price || 0).toFixed(2)}</p>
                  <p>Selling Price: KSh {Number(selectedProduct.selling_price || 0).toFixed(2)}</p>
                  <p>Profit Margin: {calculateProfitMargin(selectedProduct.buying_price || 0, selectedProduct.selling_price || 0)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
