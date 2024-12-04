import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useInventory } from "@/hooks/use-inventory";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PurchaseOrderItem {
  productId: number;
  quantity: number;
  buyingPrice: number;
  sellingPrice: number;
  name?: string;
}

const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Please select a supplier"),
});

type FormData = z.infer<typeof purchaseOrderSchema>;

interface PurchaseOrderFormProps {
  onSubmit: (data: {
    supplierId: number;
    items: PurchaseOrderItem[];
    total: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function PurchaseOrderForm({ onSubmit, isSubmitting }: PurchaseOrderFormProps) {
  const { suppliers = [], productSuppliers = [] } = useSuppliers();
  const { products = [] } = useInventory();
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  
  const form = useForm<FormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: "",
    },
  });

  const addItem = (productId: string) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (!product) return;
    
    // Find preferred supplier price if available
    const supplierPricing = productSuppliers.find(
      ps => ps.productId === parseInt(productId) && ps.supplierId === parseInt(form.getValues("supplierId"))
    );
    
    setItems([...items, {
      productId: parseInt(productId),
      quantity: 1,
      buyingPrice: supplierPricing ? Number(supplierPricing.costPrice) : Number(product.buyingPrice),
      sellingPrice: Number(product.sellingPrice),
      name: product.name,
    }]);
  };

  const updateItemQuantity = (index: number, quantity: string) => {
    const newItems = [...items];
    newItems[index].quantity = parseInt(quantity) || 0;
    setItems(newItems);
  };

  const updateItemPrice = (index: number, field: 'buyingPrice' | 'sellingPrice', value: string) => {
    const newItems = [...items];
    newItems[index][field] = parseFloat(value) || 0;
    setItems(newItems);
  };

  const calculateTotal = (): string => {
    return items.reduce((sum, item) => sum + (item.quantity * item.buyingPrice), 0).toFixed(2);
  };

  const handleSupplierChange = (supplierId: string) => {
    form.setValue("supplierId", supplierId);
    // Update prices based on selected supplier
    setItems(items.map(item => {
      const supplierPricing = productSuppliers.find(
        ps => ps.productId === item.productId && ps.supplierId === parseInt(supplierId)
      );
      return {
        ...item,
        buyingPrice: supplierPricing ? Number(supplierPricing.costPrice) : item.buyingPrice,
      };
    }));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => onSubmit({
        supplierId: parseInt(data.supplierId),
        items,
        total: calculateTotal(),
      }))} className="space-y-4">
        <FormField
          control={form.control}
          name="supplierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier</FormLabel>
              <Select onValueChange={handleSupplierChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={String(supplier.id)}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-4">
          <FormLabel>Add Products</FormLabel>
          <Select onValueChange={addItem}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={String(product.id)}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 space-y-4 max-h-[50vh] overflow-y-auto">
          {items.map((item, index) => (
            <div key={index} className="space-y-2 p-4 border rounded-lg">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Current Stock: {products.find(p => p.id === item.productId)?.stock || 0}
                    → New Stock: {(products.find(p => p.id === item.productId)?.stock || 0) + item.quantity}
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <div>
                    <FormLabel>Quantity</FormLabel>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(index, e.target.value)}
                      className="w-full md:w-24"
                    />
                  </div>
                  <div>
                    <FormLabel>Buying Price (KSh)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.buyingPrice}
                      onChange={(e) => updateItemPrice(index, 'buyingPrice', e.target.value)}
                      className="w-full md:w-32"
                    />
                  </div>
                  <div>
                    <FormLabel>Selling Price (KSh)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.sellingPrice}
                      onChange={(e) => updateItemPrice(index, 'sellingPrice', e.target.value)}
                      className="w-full md:w-32"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      const newItems = [...items];
                      newItems.splice(index, 1);
                      setItems(newItems);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-right text-lg font-semibold">
          Total: KSh {calculateTotal()}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || items.length === 0}>
          {isSubmitting ? "Creating..." : "Create Purchase Order"}
        </Button>
      </form>
    </Form>
  );
}
