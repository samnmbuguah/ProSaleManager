import { useState } from "react";
import type { Customer } from "@/types/customer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface Transaction {
  id: number;
  customerId: number;
  amount: number;
  date: Date;
  items: number;
}

interface CustomerHistoryProps {
  customer: Customer;
  transactions: Transaction[];
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
}

export default function CustomerHistory({
  customer,
  transactions,
  onDateRangeChange,
}: CustomerHistoryProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const handleDateRangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate) {
      onDateRangeChange(new Date(startDate), new Date(endDate));
    }
  };

  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const averageTransaction = transactions.length ? totalSpent / transactions.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{customer.name}</h2>
          <p className="text-muted-foreground">
            Customer since {format(new Date(customer.createdAt ?? new Date()), "MMM d, yyyy")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg">
            Total Spent: <span className="font-bold">KSh {totalSpent.toLocaleString("en-KE")}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Average Transaction: KSh {averageTransaction.toLocaleString("en-KE")}
          </p>
        </div>
      </div>

      <form onSubmit={handleDateRangeSubmit} className="flex gap-4 items-end">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <label htmlFor="startDate">Start Date</label>
          <Input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <label htmlFor="endDate">End Date</label>
          <Input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Button type="submit">Filter</Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Items</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{format(new Date(transaction.date), "MMM d, yyyy")}</TableCell>
              <TableCell>{transaction.items}</TableCell>
              <TableCell className="text-right">
                KSh {transaction.amount.toLocaleString("en-KE")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
