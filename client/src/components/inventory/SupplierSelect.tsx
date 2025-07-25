import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Supplier {
  id: number | string;
  name: string;
}

interface SupplierSelectProps {
  suppliers: Supplier[];
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
}

export function SupplierSelect({ suppliers, value, onChange, loading }: SupplierSelectProps) {
  return (
    <div>
      <Label htmlFor="supplier_id">Supplier</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a supplier" />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading suppliers...</div>
          ) : suppliers.length > 0 ? (
            suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                {supplier.name}
              </SelectItem>
            ))
          ) : (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">No suppliers available</div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
