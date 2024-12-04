import type { Customer } from "@db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface SaleHistory {
  saleId: number;
  date: string;
  total: number;
  paymentMethod: string;
}

interface CustomerHistoryProps {
  data: SaleHistory[];
  customer: Customer | null;
}

export function CustomerHistory({ data, customer }: CustomerHistoryProps) {
  if (!customer) {
    return (
      <div className="text-center p-4">
        <p>Select a customer to view their purchase history</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="font-semibold">Purchase History for {customer.name}</div>
        <div className="text-sm space-x-4">
          <span className="inline-flex items-center gap-1">
            <span className="font-medium">Loyalty Points:</span> {customer.loyaltyPoints}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="font-medium">Tier:</span> 
            <span className="capitalize">{customer.tier}</span>
          </span>
        </div>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((sale) => (
              <TableRow key={sale.saleId}>
                <TableCell>
                  {format(new Date(sale.date), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  KSh {Number(sale.total).toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="capitalize">
                  {sale.paymentMethod}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
