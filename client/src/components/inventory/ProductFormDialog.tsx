import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProductFormData, STOCK_UNITS, Product } from "@/types/product";
import { PRODUCT_CATEGORIES } from "@/constants/categories";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  imagePreview: string | null;
  setImagePreview: (url: string | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedProduct: Product | null;
}

const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  imagePreview,
  setImagePreview,
  onSubmit,
  selectedProduct,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>
            {selectedProduct ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            Fill in the product details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image">Product Image (Optional)</Label>
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Product Preview"
                  className="w-32 h-32 object-cover rounded-md"
                />
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="product_code">Product Code</Label>
            <Input
              id="product_code"
              name="product_code"
              value={formData.product_code}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="stock_unit">Stock Unit *</Label>
            <Select
              value={formData.stock_unit}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  stock_unit: value as (typeof STOCK_UNITS)[number],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a stock unit" />
              </SelectTrigger>
              <SelectContent>
                {STOCK_UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit.charAt(0).toUpperCase() + unit.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="min_stock">Minimum Stock *</Label>
              <Input
                id="min_stock"
                name="min_stock"
                type="number"
                value={formData.min_stock}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="buying_price">Buying Price *</Label>
              <Input
                id="buying_price"
                name="buying_price"
                type="number"
                step="0.01"
                value={formData.buying_price}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="selling_price">Selling Price *</Label>
              <Input
                id="selling_price"
                name="selling_price"
                type="number"
                step="0.01"
                value={formData.selling_price}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            {selectedProduct ? "Update Product" : "Add Product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;
