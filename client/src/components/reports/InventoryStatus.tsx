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
  const criticalStock = data.filter(p => p.stock <= 5);
  const warningStock = data.filter(p => p.stock > 5 && p.stock <= 10);
  
  return (
    <div className="space-y-4">
      {criticalStock.length > 0 && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-4">
          <h3 className="font-semibold">Critical Stock Alert!</h3>
          <p className="text-sm">
            {criticalStock.length} products need immediate reordering
          </p>
        </div>
      )}
      
      {warningStock.length > 0 && (
        <div className="bg-warning/10 text-warning rounded-lg p-4">
          <h3 className="font-semibold">Low Stock Warning</h3>
          <p className="text-sm">
            {warningStock.length} products are running low
          </p>
        </div>
      )}
      
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
                      <Badge variant={product.stock <= 5 ? "destructive" : "default"}>
                        {product.stock <= 5 ? "Critical" : "Low Stock"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
      
      {criticalStock.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Suggested Purchase Orders</h3>
          <div className="space-y-2">
            {criticalStock.map(product => (
              <div key={product.id} className="bg-card rounded-lg p-4 border">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Current Stock: {product.stock}
                    </div>
                  </div>
                  <div className="text-sm">
                    Suggested Order: {Math.max(20 - product.stock, 0)} units
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
