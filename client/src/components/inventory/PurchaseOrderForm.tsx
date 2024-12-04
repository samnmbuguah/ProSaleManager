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
  unitPrice: number;
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
      unitPrice: Number(product.buyingPrice),
      name: product.name,
      updatePrices: false
    }]);
  };

  const updateItemQuantity = (index: number, quantity: string) => {
    const newItems = [...items];
    newItems[index].quantity = parseInt(quantity) || 0;
    setItems(newItems);
  };

  const updateItemPrice = (index: number, price: string) => {
    const newItems = [...items];
    newItems[index].unitPrice = parseFloat(price) || 0;
    setItems(newItems);
  };

  const toggleUpdatePrice = (index: number) => {
    const newItems = [...items];
    newItems[index].updatePrices = !newItems[index].updatePrices;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => onSubmit({ 
        ...data, 
        items, 
        total: calculateTotal()
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

        <div className="mt-4 space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex gap-4 items-center">
              <div className="flex-1">{item.name}</div>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItemQuantity(index, e.target.value)}
                className="w-24"
                placeholder="Qty"
              />
              <Input
                type="number"
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => updateItemPrice(index, e.target.value)}
                className="w-32"
                placeholder="Price"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => toggleUpdatePrice(index)}
                className={item.updatePrices ? "bg-primary text-primary-foreground" : ""}
              >
                Update Price
              </Button>
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
          ))}
        </div>

        <div className="mt-4 text-right">
          <div className="text-lg font-bold">
            Total: KSh {calculateTotal().toFixed(2)}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Create Purchase Order
        </Button>
      </form>
    </Form>
  );
}
