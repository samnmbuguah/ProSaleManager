import { UseFormReturn, useFieldArray } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { type ProductFormData } from "@/types/product";

interface PriceUnitsSectionProps {
  form: UseFormReturn<ProductFormData>;
}

export function PriceUnitsSection({ form }: PriceUnitsSectionProps) {
  const { fields } = useFieldArray({
    control: form.control,
    name: "price_units",
  });

  return (
    <div className="col-span-2">
      <h3 className="text-lg font-semibold mb-4">Price Units</h3>
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid grid-cols-2 gap-4 mb-6 p-4 border rounded-lg"
        >
          <div className="col-span-2 flex justify-between items-center">
            <h4 className="font-medium mb-2">
              {field.unit_type} ({field.quantity}{" "}
              {field.quantity === 1 ? "piece" : "pieces"})
            </h4>
            <FormField
              control={form.control}
              name={`price_units.${index}.is_default` as const}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Default</FormLabel>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name={`price_units.${index}.buying_price` as const}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Buying Price</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`price_units.${index}.selling_price` as const}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}
    </div>
  );
}
