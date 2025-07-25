import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { type ProductFormData } from "@/types/product";

interface StockSectionProps {
  form: UseFormReturn<ProductFormData>;
}

export function StockSection({ form }: StockSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Current Quantity</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="0"
              {...form.register("quantity", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="min_quantity">Minimum Quantity</Label>
            <Input
              id="min_quantity"
              type="number"
              placeholder="0"
              {...form.register("min_quantity", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={form.watch("is_active")}
            onCheckedChange={(checked) => form.setValue("is_active", checked)}
          />
          <Label htmlFor="is_active">Product is active</Label>
        </div>
      </CardContent>
    </Card>
  );
}
