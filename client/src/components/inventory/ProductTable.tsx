import { useState } from "react";
import type { Product, UnitTypeValues, PriceUnit } from "@/types/product";
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
import { ProductForm } from "./ProductForm";
import type { ProductFormData } from "@/types/product";
import { Settings, Edit } from "lucide-react";

export type ProductWithPricing = Product & {
  price_units?: PriceUnit[];
};

interface ProductTableProps {
  products: ProductWithPricing[];
  isLoading: boolean;
  onUpdateProduct?: (id: number, data: Partial<ProductFormData>) => Promise<void>;
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

  const getDefaultPricing = (product: Product) => {
    const defaultUnit = product.price_units?.find((unit: { unit_type: string; buying_price: string; selling_price: string; is_default: boolean }) => unit.is_default);
    return defaultUnit || {
      buying_price: "0",
      selling_price: "0",
      unit_type: product.stock_unit
    };
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
              <TableHead>Default Price (Buy/Sell)</TableHead>
              <TableHead>Profit Margin</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const defaultPricing = getDefaultPricing(product);
              return (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.stock_unit}</TableCell>
                  <TableCell>
                    {`KSh ${Number(defaultPricing.buying_price).toFixed(2)} / ${Number(defaultPricing.selling_price).toFixed(2)}`}
                  </TableCell>
                  <TableCell>
                    {calculateProfitMargin(defaultPricing.buying_price, defaultPricing.selling_price)}
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
              );
            })}
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
                price_units: (editingProduct.price_units || []).map(unit => ({
                  unit_type: unit.unit_type as UnitTypeValues,
                  quantity: Number(unit.quantity),
                  buying_price: String(unit.buying_price),
                  selling_price: String(unit.selling_price),
                  is_default: Boolean(unit.is_default)
                }))
              }}
              onSubmit={async (data: ProductFormData) => {
                if (onUpdateProduct && editingProduct.id) {
                  await onUpdateProduct(editingProduct.id, data);
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
                  {selectedProduct.price_units?.map((unit: { unit_type: string; buying_price: string; selling_price: string }) => (
                    <div key={unit.unit_type} className="mb-2">
                      <p className="capitalize">{unit.unit_type.replace('_', ' ')}:</p>
                      <p className="ml-4">Buy: KSh {Number(unit.buying_price).toFixed(2)}</p>
                      <p className="ml-4">Sell: KSh {Number(unit.selling_price).toFixed(2)}</p>
                      <p className="ml-4">Margin: {calculateProfitMargin(unit.buying_price, unit.selling_price)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
