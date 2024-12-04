import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useInventory } from "@/hooks/use-inventory";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
  productId: string;
  quantity: number;
  buyingPrice: number;
  sellingPrice: number;
  name: string;
  updatePrices?: boolean;
}

interface PurchaseOrderFormProps {
  onSubmit: (data: {
    supplierId: string;
    items: PurchaseOrderItem[];
    total: number;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function PurchaseOrderForm({ onSubmit, isSubmitting }: PurchaseOrderFormProps) {
  const { suppliers = [] } = useSuppliers();
  const { products = [] } = useInventory();
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  
  const form = useForm({
    defaultValues: {
      supplierId: "",
    },
  });

  const addItem = (productId: string) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (!product) return;
    
    setItems([...items, {
      productId,
      quantity: 1,
      buyingPrice: Number(product.buyingPrice),
      sellingPrice: Number(product.sellingPrice),
      name: product.name,
      updatePrices: true
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

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.buyingPrice), 0);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => onSubmit({ 
        ...data, 
        items: items.map(item => ({
          productId: parseInt(item.productId),
          quantity: item.quantity,
          unitPrice: item.buyingPrice,  // Set unitPrice to buyingPrice for purchase orders
          updatePrices: true
        })),
        supplierId: parseInt(data.supplierId),
        total: calculateTotal().toString(),  // Convert to string for DB
      }))} className="space-y-4">
        <FormField
          control={form.control}
          name="supplierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier</FormLabel>
              <Select onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <div className="mt-4">
          <FormLabel>Add Products</FormLabel>
          <Select onValueChange={addItem}>
            <SelectTrigger>
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id.toString()}>
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
                    Current Stock: {products.find(p => p.id.toString() === item.productId)?.stock || 0}
                    → New Stock: {(products.find(p => p.id.toString() === item.productId)?.stock || 0) + item.quantity}
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Create Purchase Order
        </Button>
      </form>
    </Form>
  );
}
