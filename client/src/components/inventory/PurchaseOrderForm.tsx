import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  purchaseOrderSchema,
  type PurchaseOrderFormData,
  type PurchaseOrderItem,
  type PurchaseOrderSubmitData,
} from "@/types/purchase-order";

interface PurchaseOrderFormProps {
  onSubmit: (data: PurchaseOrderSubmitData) => Promise<void>;
  isSubmitting: boolean;
}

export function PurchaseOrderForm({
  onSubmit,
  isSubmitting,
}: PurchaseOrderFormProps) {
  const { suppliers = [], productSuppliers = [] } = useSuppliers();
  const { products = [] } = useInventory();
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);

  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplier_id: "",
    },
  });

  const addItem = (productId: string) => {
    const product = products.find((p) => p.id === parseInt(productId));
    if (!product) return;

    // Find preferred supplier price if available
    const supplierPricing = productSuppliers.find(
      (ps) =>
        Number(ps.product_id) === Number(productId) &&
        Number(ps.supplier_id) === Number(form.getValues("supplier_id")),
    );

    setItems([
      ...items,
      {
        product_id: parseInt(productId),
        quantity: 1,
        buying_price: Number(
          supplierPricing
            ? supplierPricing.cost_price
            : product.price_units?.find((p) => p.is_default)?.buying_price ||
                "0",
        ),
        selling_price: Number(
          product.price_units?.find((p) => p.is_default)?.selling_price || "0",
        ),
        name: product.name,
      },
    ]);
  };

  const updateItemQuantity = (index: number, quantity: string) => {
    const newItems = [...items];
    newItems[index].quantity = parseInt(quantity) || 0;
    setItems(newItems);
  };

  const updateItemPrice = (
    index: number,
    field: "buying_price" | "selling_price",
    value: string,
  ) => {
    const newItems = [...items];
    newItems[index][field] = parseFloat(value) || 0;
    setItems(newItems);
  };

  const calculateTotal = (): string => {
    return items
      .reduce((sum, item) => sum + item.quantity * item.buying_price, 0)
      .toFixed(2);
  };

  const handleSupplierChange = (supplierId: string) => {
    form.setValue("supplier_id", supplierId);
    // Update prices based on selected supplier
    setItems(
      items.map((item) => {
        const supplierPricing = productSuppliers.find(
          (ps) =>
            Number(ps.product_id) === Number(item.product_id) &&
            Number(ps.supplier_id) === Number(supplierId),
        );
        return {
          ...item,
          buying_price: Number(
            supplierPricing ? supplierPricing.cost_price : item.buying_price,
          ),
        };
      }),
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) =>
          onSubmit({
            supplier_id: parseInt(data.supplier_id),
            items,
            total: calculateTotal(),
          }),
        )}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="supplier_id"
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
                    Current Stock:{" "}
                    {products.find((p) => p.id === item.product_id)?.stock || 0}
                    → New Stock:{" "}
                    {(products.find((p) => p.id === item.product_id)?.stock ||
                      0) + item.quantity}
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <div>
                    <FormLabel>Quantity</FormLabel>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItemQuantity(index, e.target.value)
                      }
                      className="w-full md:w-24"
                    />
                  </div>
                  <div>
                    <FormLabel>Buying Price (KSh)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.buying_price}
                      onChange={(e) =>
                        updateItemPrice(index, "buying_price", e.target.value)
                      }
                      className="w-full md:w-32"
                    />
                  </div>
                  <div>
                    <FormLabel>Selling Price (KSh)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.selling_price}
                      onChange={(e) =>
                        updateItemPrice(index, "selling_price", e.target.value)
                      }
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

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || items.length === 0}
        >
          {isSubmitting ? "Creating..." : "Create Purchase Order"}
        </Button>
      </form>
    </Form>
  );
}
