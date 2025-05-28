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
  onSubmit: (e: React.FormEvent, localImageFile?: File) => void;
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
  // Local state for image file
  const [localImageFile, setLocalImageFile] = React.useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "number" ? Number(value) : value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Updated conversion factors: 1 pack = 3 pieces, 1 dozen = 4 packs = 12 pieces
  const UNIT_CONVERSIONS = {
    dozen: { pack: 4, piece: 12 }, // 1 dozen = 4 packs, 12 pieces
    pack: { dozen: 1 / 4, piece: 3 }, // 1 pack = 3 pieces, 1 dozen = 4 packs
    piece: { dozen: 1 / 12, pack: 1 / 3 }, // 1 piece = 1/12 dozen, 1/3 pack
  };

  // Initialize price_units if not present
  const priceUnits = formData.price_units || [
    { unit_type: "dozen", buying_price: "", selling_price: "", manual: false },
    { unit_type: "pack", buying_price: "", selling_price: "", manual: false },
    { unit_type: "piece", buying_price: "", selling_price: "", manual: false },
  ];

  // Handler for price change with correct auto-calc logic
  const handlePriceChange = (unit, field, value) => {
    const updatedUnits = priceUnits.map((u) => {
      if (u.unit_type === unit) {
        return { ...u, [field]: value, manual: true };
      }
      return { ...u };
    });
    // Auto-calc logic
    const changed = updatedUnits.find((u) => u.unit_type === unit);
    if (changed && !isNaN(Number(value)) && value !== "") {
      Object.keys(UNIT_CONVERSIONS[unit]).forEach((otherUnit) => {
        const conv = UNIT_CONVERSIONS[unit][otherUnit];
        const other = updatedUnits.find((u) => u.unit_type === otherUnit);
        if (other && !other.manual) {
          updatedUnits.forEach((u, idx) => {
            if (u.unit_type === otherUnit) {
              let newValue;
              if (conv > 1) {
                newValue = (Number(value) / conv).toString();
              } else {
                newValue = (Number(value) * (1 / conv)).toString();
              }
              updatedUnits[idx] = {
                ...u,
                [field]: newValue,
              };
            }
          });
        }
      });
    }
    setFormData({ ...formData, price_units: updatedUnits });
  };

  // Handler to allow manual override
  const handleManualOverride = (unit, field) => {
    const updatedUnits = priceUnits.map((u) =>
      u.unit_type === unit ? { ...u, manual: true } : u
    );
    setFormData({ ...formData, price_units: updatedUnits });
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
        <form onSubmit={e => {
          e.preventDefault();
          if (typeof onSubmit === 'function') {
            onSubmit(e, localImageFile);
          }
        }} className="space-y-4">
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
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger className="bg-white text-black">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-white">
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
                setFormData({ ...formData, stock_unit: value })
              }
            >
              <SelectTrigger className="bg-white text-black">
                <SelectValue placeholder="Select a stock unit" />
              </SelectTrigger>
              <SelectContent className="bg-white">
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
          {/* Multiple Unit Prices */}
          <div>
            <Label>Unit Prices</Label>
            <div className="grid grid-cols-3 gap-4">
              {priceUnits.map((unit) => (
                <div key={unit.unit_type} className="border rounded p-2">
                  <div className="font-semibold capitalize mb-1">{unit.unit_type}</div>
                  <div>
                    <Label>Buying Price</Label>
                    <Input
                      type="number"
                      value={unit.buying_price}
                      onChange={e => handlePriceChange(unit.unit_type, "buying_price", e.target.value)}
                      onFocus={() => handleManualOverride(unit.unit_type, "buying_price")}
                    />
                  </div>
                  <div>
                    <Label>Selling Price</Label>
                    <Input
                      type="number"
                      value={unit.selling_price}
                      onChange={e => handlePriceChange(unit.unit_type, "selling_price", e.target.value)}
                      onFocus={() => handleManualOverride(unit.unit_type, "selling_price")}
                    />
                  </div>
                  {unit.manual && <div className="text-xs text-green-600 mt-1">Manual override</div>}
                </div>
              ))}
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
