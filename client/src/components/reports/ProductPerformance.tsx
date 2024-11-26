import type { Product } from "@db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProductStats {
  productId: number;
  name: string;
  category: string;
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
}

interface ProductPerformanceProps {
  data: ProductStats[];
}

export function ProductPerformance({ data }: ProductPerformanceProps) {
  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];

  if (safeData.length === 0) {
    return (
      <div className="text-center p-4">
        <p>No product performance data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Total Quantity</TableHead>
            <TableHead>Total Revenue</TableHead>
            <TableHead>Total Cost</TableHead>
            <TableHead>Profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeData.map((item) => (
            <TableRow key={item.productId}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.totalQuantity}</TableCell>
              <TableCell>
                KSh {Number(item.totalRevenue).toLocaleString("en-KE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell>
                KSh {Number(item.totalCost).toLocaleString("en-KE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell className={Number(item.profit) >= 0 ? "text-green-600" : "text-red-600"}>
                KSh {Number(item.profit).toLocaleString("en-KE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
