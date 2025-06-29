import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductFormData, productSchema } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function ProductForm({
  initialData,
  onSubmit,
  isSubmitting,
}: ProductFormProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      barcode: "",
      category_id: 1,
      price: 0,
      cost_price: 0,
      quantity: 0,
      min_quantity: 0,
      is_active: true,
      ...initialData,
    },
  });

  const handleSubmit = async (data: ProductFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            {...form.register("name")}
            placeholder="Enter product name"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            placeholder="Enter product description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" {...form.register("sku")} placeholder="Enter SKU" />
          </div>

          <div>
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              {...form.register("barcode")}
              placeholder="Enter barcode"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              {...form.register("price", { valueAsNumber: true })}
              placeholder="Enter price"
            />
            {form.formState.errors.price && (
              <p className="text-sm text-red-500">
                {form.formState.errors.price.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="cost_price">Cost Price</Label>
            <Input
              id="cost_price"
              type="number"
              {...form.register("cost_price", { valueAsNumber: true })}
              placeholder="Enter cost price"
            />
            {form.formState.errors.cost_price && (
              <p className="text-sm text-red-500">
                {form.formState.errors.cost_price.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              {...form.register("quantity", { valueAsNumber: true })}
              placeholder="Enter quantity"
            />
            {form.formState.errors.quantity && (
              <p className="text-sm text-red-500">
                {form.formState.errors.quantity.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="min_quantity">Minimum Quantity</Label>
            <Input
              id="min_quantity"
              type="number"
              {...form.register("min_quantity", { valueAsNumber: true })}
              placeholder="Enter minimum quantity"
            />
            {form.formState.errors.min_quantity && (
              <p className="text-sm text-red-500">
                {form.formState.errors.min_quantity.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="category_id">Category</Label>
          <Select
            value={form.watch("category_id").toString()}
            onValueChange={(value) =>
              form.setValue("category_id", parseInt(value))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Category 1</SelectItem>
              <SelectItem value="2">Category 2</SelectItem>
              <SelectItem value="3">Category 3</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.category_id && (
            <p className="text-sm text-red-500">
              {form.formState.errors.category_id.message}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Product"}
      </Button>
    </form>
  );
}
