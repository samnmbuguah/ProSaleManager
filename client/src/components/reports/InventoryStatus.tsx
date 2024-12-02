import type { Product } from "@db/schema";
import {
  AlertTriangle,
  PackageOpen,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface InventoryStatusProps {
  data: Product[];
}

export function InventoryStatus({ data }: InventoryStatusProps) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1671197346433-a0bb59327ac2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="bg-white/90 rounded-lg p-4">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-center">
              <PackageOpen className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-2">All products are well stocked</p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {product.stock < 5 && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                      {product.name}
                    </div>
                  </TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">
                      Low Stock
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
