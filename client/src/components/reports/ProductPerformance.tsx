import type { Product } from "@db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProductPerformanceData {
  productId: number;
  name: string;
  category: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface ProductPerformanceProps {
  data?: ProductPerformanceData[];
}

export function ProductPerformance({ data = [] }: ProductPerformanceProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Total Quantity</TableHead>
            <TableHead>Total Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
