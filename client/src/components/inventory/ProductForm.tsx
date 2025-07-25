import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { productSchema } from "@/types/product";
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
import { useCategories } from "@/hooks/use-categories";
import { useCreateCategory } from "@/hooks/use-categories";
import React from "react";

interface ProductFormProps {
  initialData?: Partial<z.infer<typeof productSchema>>;
  onSubmit: (data: z.infer<typeof productSchema>) => Promise<void>;
  isSubmitting?: boolean;
}

// Helper type to ensure stock_unit is required and not undefined
type ProductFormType = Omit<z.infer<typeof productSchema>, "stock_unit"> & {
  stock_unit: "piece" | "pack" | "dozen";
};

export function ProductForm({ initialData, onSubmit, isSubmitting }: ProductFormProps) {
  const form = useForm<ProductFormType>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      barcode: "",
      category_id: 1,
      piece_buying_price: 0,
      piece_selling_price: 0,
      pack_buying_price: 0,
      pack_selling_price: 0,
      dozen_buying_price: 0,
      dozen_selling_price: 0,
      quantity: 0,
      min_quantity: 0,
      image_url: "",
      is_active: true,
      ...initialData,
      stock_unit: (initialData?.stock_unit as "piece" | "pack" | "dozen") ?? "piece",
    },
  });

  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const [showAddCategory, setShowAddCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [newCategoryDesc, setNewCategoryDesc] = React.useState("");

  React.useEffect(() => {
    if (categories && categories.length > 0 && !form.watch("category_id")) {
      form.setValue("category_id", categories[0].id);
    }
  }, [categories, form]);

  // Debug: log form state on every render
  React.useEffect(() => {
    console.log("ProductForm form state:", form.getValues());
  });

  const handleSubmit = async (data: z.infer<typeof productSchema>) => {
    console.log("Submitting product form data:", data);
    await onSubmit(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register("name")} placeholder="Enter product name" />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
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
            <Input id="barcode" {...form.register("barcode")} placeholder="Enter barcode" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">{/* Remove Price and Cost Price fields */}</div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={form.watch("quantity") !== undefined ? String(form.watch("quantity")) : "0"}
              onChange={(e) =>
                form.setValue("quantity", e.target.value === "" ? 0 : Number(e.target.value))
              }
              placeholder="Enter quantity"
            />
            {form.formState.errors.quantity && (
              <p className="text-sm text-red-500">{form.formState.errors.quantity.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="min_quantity">Minimum Quantity</Label>
            <Input
              id="min_quantity"
              type="number"
              value={
                form.watch("min_quantity") !== undefined ? String(form.watch("min_quantity")) : "0"
              }
              onChange={(e) =>
                form.setValue("min_quantity", e.target.value === "" ? 0 : Number(e.target.value))
              }
              placeholder="Enter minimum quantity"
            />
            {form.formState.errors.min_quantity && (
              <p className="text-sm text-red-500">{form.formState.errors.min_quantity.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="stock_unit">Default Stock Unit</Label>
          <Select
            value={form.watch("stock_unit") || "piece"}
            onValueChange={(value) =>
              form.setValue("stock_unit", value as "piece" | "pack" | "dozen")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select default unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="piece">Piece</SelectItem>
              <SelectItem value="pack">Pack</SelectItem>
              <SelectItem value="dozen">Dozen</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.stock_unit && (
            <p className="text-sm text-red-500">{form.formState.errors.stock_unit.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="category_id">Category</Label>
          <Select
            value={form.watch("category_id")?.toString() || ""}
            onValueChange={(value) => {
              if (value === "__add__") {
                setShowAddCategory(true);
              } else {
                setShowAddCategory(false);
                form.setValue("category_id", Number(value));
              }
            }}
            disabled={isLoading || !categories}
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? "Loading..." : "Select category"} />
            </SelectTrigger>
            <SelectContent>
              {categories &&
                categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              <SelectItem value="__add__">+ Add new category</SelectItem>
            </SelectContent>
          </Select>
          {showAddCategory && (
            <div className="mt-2 flex gap-2 items-end">
              <div>
                <Input
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="mb-1"
                />
                <Input
                  placeholder="Description (optional)"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="mb-1"
                />
              </div>
              <Button
                type="button"
                disabled={createCategory.isLoading || !newCategoryName.trim()}
                onClick={async () => {
                  try {
                    const res = await createCategory.mutateAsync({ name: newCategoryName.trim(), description: newCategoryDesc });
                    if (res?.data?.id) {
                      form.setValue("category_id", res.data.id);
                      setShowAddCategory(false);
                      setNewCategoryName("");
                      setNewCategoryDesc("");
                    }
                  } catch (err: any) {
                    alert(err?.response?.data?.message || "Failed to create category");
                  }
                }}
              >
                {createCategory.isLoading ? "Adding..." : "Add"}
              </Button>
            </div>
          )}
          {form.formState.errors.category_id && (
            <p className="text-sm text-red-500">{form.formState.errors.category_id.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Product"}
      </Button>
    </form>
  );
}
