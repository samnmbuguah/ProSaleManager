import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PRICE_UNITS } from "@/constants/priceUnits";
import { PRODUCT_CATEGORIES } from "@/constants/categories";
import { type ProductFormData, productSchema } from "@/types/product";

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => Promise<void>;
  isSubmitting?: boolean;
  initialData?: Partial<ProductFormData>;
}

export function ProductForm({
  onSubmit,
  isSubmitting = false,
  initialData,
}: ProductFormProps) {
  // Initialize form with proper default values
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      sku: initialData?.sku ?? "",
      stock: initialData?.stock ?? 0,
      category: initialData?.category ?? "",
      min_stock: initialData?.min_stock ?? 0,
      max_stock: initialData?.max_stock ?? 0,
      reorder_point: initialData?.reorder_point ?? 0,
      stock_unit: initialData?.stock_unit ?? "per_piece",
      price_units:
        initialData?.price_units ??
        PRICE_UNITS.map((unit) => ({
          unit_type: unit.value,
          quantity: unit.quantity,
          buying_price: "0",
          selling_price: "0",
          is_default: unit.value === "per_piece",
        })),
    },
  });

  const handleSubmit = async (data: ProductFormData) => {
    try {
      // Ensure numeric values are properly converted
      const formattedData = {
        ...data,
        stock: Number(data.stock),
        min_stock: Number(data.min_stock),
        max_stock: Number(data.max_stock),
        reorder_point: Number(data.reorder_point),
        price_units: data.price_units.map((unit) => ({
          ...unit,
          quantity: Number(unit.quantity),
          buying_price: unit.buying_price.toString(),
          selling_price: unit.selling_price.toString(),
          is_default: Boolean(unit.is_default),
        })),
      };

      // Validate that at least one price unit is marked as default
      const hasDefaultUnit = formattedData.price_units.some(
        (unit) => unit.is_default,
      );
      if (!hasDefaultUnit) {
        formattedData.price_units[0].is_default = true;
      }

      // Adjust stock based on selected unit
      const selectedUnit = formattedData.price_units.find(
        (unit) => unit.unit_type === formattedData.stock_unit,
      );
      if (selectedUnit) {
        formattedData.stock = formattedData.stock * selectedUnit.quantity;
      }

      console.log("Submitting form data:", formattedData);
      await onSubmit(formattedData);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="product_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
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
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Stock</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value || "0"}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : 0,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stock_unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Unit</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stock unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRICE_UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="col-span-2">
            <h3 className="text-lg font-semibold mb-4">Price Units</h3>
            {PRICE_UNITS.map((unit, index) => (
              <div
                key={unit.value}
                className="grid grid-cols-2 gap-4 mb-6 p-4 border rounded-lg"
              >
                <div className="col-span-2 flex justify-between items-center">
                  <h4 className="font-medium mb-2">
                    {unit.label} ({unit.quantity}{" "}
                    {unit.quantity === 1 ? "piece" : "pieces"})
                  </h4>
                  <FormField
                    control={form.control}
                    name={`price_units.${index}.is_default`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              // Uncheck other units when this one is checked
                              if (checked) {
                                form.setValue(
                                  "price_units",
                                  form
                                    .getValues("price_units")
                                    .map((pu, i) => ({
                                      ...pu,
                                      is_default: i === index,
                                    })),
                                );
                              }
                              field.onChange(checked);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm">Default Unit</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`price_units.${index}.buying_price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buying Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value || "0"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`price_units.${index}.selling_price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value || "0"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <input
                  type="hidden"
                  {...form.register(`price_units.${index}.unit_type`)}
                  value={unit.value}
                />
                <input
                  type="hidden"
                  {...form.register(`price_units.${index}.quantity`)}
                  value={unit.quantity}
                />
              </div>
            ))}
          </div>

          <FormField
            control={form.control}
            name="min_stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Stock</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value || "0"}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : 0,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Stock</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value || "0"}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : 0,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reorder_point"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reorder Point</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value || "0"}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : 0,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Product"}
        </Button>
      </form>
    </Form>
  );
}
