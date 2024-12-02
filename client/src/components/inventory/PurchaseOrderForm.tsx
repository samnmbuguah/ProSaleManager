import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type Supplier, type Product } from "@db/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";

const purchaseOrderSchema = z.object({
  supplierId: z.string(),
  expectedDeliveryDate: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.string(),
    unitPrice: z.string(),
  })).min(1, "At least one item is required"),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

interface PurchaseOrderFormProps {
  suppliers: Supplier[];
  products: Product[];
  onSubmit: (data: {
    supplierId: number;
    expectedDeliveryDate?: string;
    items: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
    }>;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function PurchaseOrderForm({ 
  suppliers, 
  products, 
  onSubmit, 
  isSubmitting 
}: PurchaseOrderFormProps) {
  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      items: [{ productId: "", quantity: "", unitPrice: "" }],
    },
  });

  const { fields, append, remove } = form.useFieldArray({
    name: "items",
  });

  const handleSubmit = async (data: PurchaseOrderFormData) => {
    await onSubmit({
      supplierId: parseInt(data.supplierId),
      expectedDeliveryDate: data.expectedDeliveryDate,
      items: data.items.map(item => ({
        productId: parseInt(item.productId),
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
      })),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="supplierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        <FormField
          control={form.control}
          name="expectedDeliveryDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Delivery Date</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="font-medium">Order Items</div>
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-4 items-end">
              <FormField
                control={form.control}
                name={`items.${index}.productId`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Product</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.unitPrice`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Unit Price</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => append({ productId: "", quantity: "", unitPrice: "" })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Purchase Order
        </Button>
      </form>
    </Form>
  );
}
