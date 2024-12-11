import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertProductSchema, type InsertProduct } from "@db/schema";
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

export interface PriceUnit {
  unit_type: 'per_piece' | 'three_piece' | 'dozen';
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
  stock_unit: 'per_piece' | 'three_piece' | 'dozen';
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

export function ProductForm({ onSubmit, isSubmitting, initialData }: ProductFormProps) {
  const defaultPriceUnits: PriceUnit[] = [
    {
      unit_type: 'per_piece',
      quantity: 1,
      buying_price: "0",
      selling_price: "0",
      is_default: true
    },
    {
      unit_type: 'three_piece',
      quantity: 3,
      buying_price: "0",
      selling_price: "0",
      is_default: false
    },
    {
      unit_type: 'dozen',
      quantity: 12,
      buying_price: "0",
      selling_price: "0",
      is_default: false
    }
  ];

  const form = useForm<ProductFormData>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      ...(initialData || {
        name: "",
        sku: "",
        stock: 0,
        category: "",
        min_stock: 0,
        max_stock: 0,
        reorder_point: 0,
        stock_unit: "per_piece",
      }),
      price_units: initialData?.price_units || defaultPriceUnits,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Input type="number" step="0.01" {...field} />
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
                        <Input type="number" step="0.01" {...field} />
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
                  value={index === 0 ? "true" : "false"}
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
                  <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
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
                  <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
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
                  <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
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
