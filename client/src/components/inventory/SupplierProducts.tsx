import { useState } from "react";
import { type Product, type SupplierProduct } from "@db/schema";
import { useSupplierProducts } from "@/hooks/use-supplier-products";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupplierProductSchema, type InsertSupplierProduct } from "@db/schema";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Package, Plus } from "lucide-react";

interface SupplierProductsProps {
  supplierId: number;
  products: Product[];
  onAddProduct: (data: InsertSupplierProduct) => Promise<void>;
  onUpdateProduct: (id: number, data: Partial<InsertSupplierProduct>) => Promise<void>;
}

export function SupplierProducts({
  supplierId,
  products,
  onAddProduct,
  onUpdateProduct,
}: SupplierProductsProps) {
  const { data: supplierProducts, isLoading } = useSupplierProducts(supplierId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(insertSupplierProductSchema),
    defaultValues: {
      supplierId,
      productId: 0,
      supplierSku: "",
      unitPrice: 0,
      minimumOrderQuantity: 1,
      leadTime: 1,
      isPreferred: false,
    },
  });

  const availableProducts = products.filter(
    (p) => !supplierProducts.some((sp) => sp.productId === p.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Products Supplied</h3>
        <Button
          onClick={() => setIsDialogOpen(true)}
          disabled={availableProducts.length === 0}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : supplierProducts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="mx-auto h-12 w-12 mb-2" />
          <p>No products added yet</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>MOQ</TableHead>
              <TableHead>Lead Time</TableHead>
              <TableHead>Preferred</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supplierProducts.map((sp) => (
              <TableRow key={sp.id}>
                <TableCell>{sp.product?.name}</TableCell>
                <TableCell>{sp.supplierSku}</TableCell>
                <TableCell>KSh {Number(sp.unitPrice).toLocaleString()}</TableCell>
                <TableCell>{sp.minimumOrderQuantity} units</TableCell>
                <TableCell>{sp.leadTime} days</TableCell>
                <TableCell>
                  <Switch
                    checked={sp.isPreferred}
                    onCheckedChange={(checked) =>
                      onUpdateProduct(sp.id, { isPreferred: checked })
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(async (data) => {
                await onAddProduct(data);
                setIsDialogOpen(false);
                form.reset();
              })}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full p-2 border rounded"
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      >
                        <option value={0}>Select a product</option>
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplierSku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier SKU</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Supplier's SKU" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price (KSh)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        step="0.01"
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minimumOrderQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Order Quantity</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leadTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Time (days)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPreferred"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormLabel>Preferred Supplier</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Add Product
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
