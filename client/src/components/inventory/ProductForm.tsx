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

import { z } from "zod";
import { UnitTypeValues, defaultUnitQuantities } from "@db/schema";

const UnitTypes = ['per_piece', 'three_piece', 'dozen'] as const;

// Define the product schema for form validation
const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string(),
  stock: z.number().min(0, "Stock cannot be negative"),
  category: z.string().min(1, "Category is required"),
  min_stock: z.number().min(0, "Minimum stock cannot be negative"),
  max_stock: z.number().min(0, "Maximum stock cannot be negative"),
  reorder_point: z.number().min(0, "Reorder point cannot be negative"),
  stock_unit: z.enum(UnitTypes),
  price_units: z.array(z.object({
    unit_type: z.enum(UnitTypes),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    buying_price: z.string()
      .min(1, "Buying price is required")
      .refine(
        (price) => !isNaN(Number(price)) && Number(price) > 0,
        "Buying price must be a positive number"
      ),
    selling_price: z.string()
      .min(1, "Selling price is required")
      .refine(
        (price) => !isNaN(Number(price)) && Number(price) > 0,
        "Selling price must be a positive number"
      ),
    is_default: z.boolean()
  }))
  .min(1, "At least one price unit is required")
  .refine(
    (units) => {
      // Ensure at least one unit is marked as default
      return units.some(unit => unit.is_default);
    },
    {
      message: "One unit must be marked as default"
    }
  )
  .refine(
    (units) => {
      // Check that selling price is higher than buying price for each unit
      return units.every(unit => 
        Number(unit.selling_price) > Number(unit.buying_price)
      );
    },
    {
      message: "Selling price must be higher than buying price for all units"
    }
  )
  .refine(
    (units) => {
      // Verify that bulk units have appropriate discounts
      const sortedUnits = [...units].sort((a, b) => a.quantity - b.quantity);
      for (let i = 1; i < sortedUnits.length; i++) {
        const prevUnit = sortedUnits[i - 1];
        const currentUnit = sortedUnits[i];
        const prevUnitPrice = Number(prevUnit.selling_price) / prevUnit.quantity;
        const currentUnitPrice = Number(currentUnit.selling_price) / currentUnit.quantity;
        if (currentUnitPrice >= prevUnitPrice) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Bulk units should have lower per-unit prices"
    }
  )
});

export interface PriceUnit {
  unit_type: UnitTypeValues;
  quantity: number;
  buying_price: string;
  selling_price: string;
  is_default: boolean;
}

export interface ProductFormData {
  name: string;
  sku: string;
  stock: number;
  category: string;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  stock_unit: UnitTypeValues;
  price_units: PriceUnit[];
}

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => Promise<void>;
  isSubmitting: boolean;
  initialData?: Partial<ProductFormData>;
}

const PRODUCT_CATEGORIES = [
  { value: "bra", label: "Bra" },
  { value: "shoes", label: "Shoes" },
  { value: "panties", label: "Panties" },
  { value: "oil", label: "Oil" },
  { value: "boxers", label: "Boxers" },
] as const;

const STOCK_UNITS = [
  { value: "per_piece", label: "Per Piece" },
  { value: "three_piece", label: "Three Piece" },
  { value: "dozen", label: "Dozen" },
] as const;

export function ProductForm({ onSubmit, isSubmitting = false, initialData }: ProductFormProps) {
  // Initialize default values for price units
  const defaultPriceUnits: PriceUnit[] = UnitTypes.map((unitType) => ({
    unit_type: unitType as UnitTypeValues,
    quantity: defaultUnitQuantities[unitType as UnitTypeValues],
    buying_price: "0",
    selling_price: "0",
    is_default: unitType === 'per_piece'
  }));

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
      price_units: initialData?.price_units 
        ? UnitTypes.map(unitType => {
            const existingUnit = initialData.price_units?.find(u => u.unit_type === unitType);
            if (existingUnit) {
              return {
                ...existingUnit,
                buying_price: String(existingUnit.buying_price),
                selling_price: String(existingUnit.selling_price)
              };
            }
            return defaultPriceUnits.find(u => u.unit_type === unitType) || {
              unit_type: unitType as UnitTypeValues,
              quantity: defaultUnitQuantities[unitType as UnitTypeValues],
              buying_price: "0",
              selling_price: "0",
              is_default: unitType === 'per_piece'
            };
          })
        : defaultPriceUnits,
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
        price_units: data.price_units.map(unit => ({
          ...unit,
          quantity: Number(unit.quantity),
          buying_price: unit.buying_price.toString(),
          selling_price: unit.selling_price.toString(),
          is_default: Boolean(unit.is_default)
        }))
      };
      
      // Validate that at least one price unit is marked as default
      const hasDefaultUnit = formattedData.price_units.some(unit => unit.is_default);
      if (!hasDefaultUnit) {
        formattedData.price_units[0].is_default = true;
      }
      
      console.log('Submitting form data:', formattedData);
      await onSubmit(formattedData);
    } catch (error) {
      console.error('Form submission error:', error);
      // Keep the form open on error
      return;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
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
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
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
                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : 0)}
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
                <Select onValueChange={field.onChange} value={field.value || "per_piece"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stock unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STOCK_UNITS.map((unit) => (
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
            {defaultPriceUnits.map((unit, index) => (
              <div key={unit.unit_type} className="grid grid-cols-2 gap-4 mb-6 p-4 border rounded-lg">
                <div className="col-span-2">
                  <h4 className="font-medium mb-2 capitalize">
                    {unit.unit_type.replace('_', ' ')} ({unit.quantity} {unit.quantity === 1 ? 'piece' : 'pieces'})
                  </h4>
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
                  value={unit.unit_type}
                />
                <input 
                  type="hidden" 
                  {...form.register(`price_units.${index}.quantity`)}
                  value={unit.quantity}
                />
                <input 
                  type="hidden" 
                  {...form.register(`price_units.${index}.is_default`)}
                  value={String(index === 0)}
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
                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : 0)}
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
                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : 0)}
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
                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : 0)}
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
