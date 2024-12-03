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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SupplierPricing } from "./SupplierPricing";
import { Settings } from "lucide-react";

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
}

export function ProductTable({ products = [], isLoading }: ProductTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!Array.isArray(products)) {
    return <div>No products found</div>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Buying Price</TableHead>
              <TableHead>Selling Price</TableHead>
              <TableHead>Profit Margin</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Suppliers</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>KSh {Number(product.buyingPrice).toFixed(2)}</TableCell>
                <TableCell>KSh {Number(product.sellingPrice).toFixed(2)}</TableCell>
                <TableCell>
                  {(((Number(product.sellingPrice) - Number(product.buyingPrice)) / Number(product.buyingPrice)) * 100).toFixed(1)}%
                </TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <Badge variant={product.stock > 10 ? "default" : "destructive"}>
                    {product.stock > 10 ? "In Stock" : "Low Stock"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl">
          {selectedProduct && <SupplierPricing product={selectedProduct} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
