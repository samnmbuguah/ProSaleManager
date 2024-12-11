import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

const priceUnitSchema = z.object({
  stockUnit: z.string().min(1, "Stock unit is required"),
  sellingPrice: z.number().min(0, "Selling price must be positive"),
  buyingPrice: z.number().min(0, "Buying price must be positive"),
  conversionRate: z.number().min(0.0001, "Conversion rate must be positive"),
});

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  defaultUnit: z.string().min(1, "Default unit is required"),
  priceUnits: z.array(priceUnitSchema).min(1, "At least one price unit is required"),
  // ... other existing fields
});

type FormData = z.infer<typeof formSchema>;

const defaultPriceUnits = [
  { stockUnit: 'piece', sellingPrice: 0, buyingPrice: 0, conversionRate: 1 },
  { stockUnit: 'box', sellingPrice: 0, buyingPrice: 0, conversionRate: 1 },
  { stockUnit: 'carton', sellingPrice: 0, buyingPrice: 0, conversionRate: 1 },
];

interface ProductFormProps {
  onSubmit: (data: FormData) => void;
  initialData?: {
    name?: string;
    description?: string;
    defaultUnit?: string;
    priceUnits?: Array<{
      stockUnit: string;
      sellingPrice: number;
      buyingPrice: number;
      conversionRate: number;
    }>;
  };
}

export function ProductForm({ onSubmit, initialData }: ProductFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      defaultUnit: initialData?.defaultUnit || "piece",
      priceUnits: initialData?.priceUnits || [defaultPriceUnits[0]],
      // ... other existing fields
    },
  });

const { fields, append, remove } = useFieldArray({
  name: "priceUnits",
    control: form.control,
  });

  const handleSubmit = (data: FormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultUnit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Unit</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select default unit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {defaultPriceUnits.map((unit) => (
                    <SelectItem key={unit.stockUnit} value={unit.stockUnit}>
                      {unit.stockUnit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Price Units</h3>
            <Button
              type="button"
              variant="outline"
              onClick={() => append(defaultPriceUnits[0])}
            >
              Add Price Unit
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`priceUnits.${index}.stockUnit`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Unit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {defaultPriceUnits.map((unit) => (
                              <SelectItem key={unit.stockUnit} value={unit.stockUnit}>
                                {unit.stockUnit}
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
                    name={`priceUnits.${index}.conversionRate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conversion Rate</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.0001"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`priceUnits.${index}.buyingPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buying Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`priceUnits.${index}.sellingPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="mt-4"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Button type="submit">Save Product</Button>
      </form>
    </Form>
  );
}