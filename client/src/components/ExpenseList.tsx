import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Expense } from "./ExpenseForm";

interface ExpenseWithId extends Expense {
  id: number;
}

interface ExpenseListProps {
  expenses: ExpenseWithId[];
  onDeleteExpense: (id: number) => void;
}

export default function ExpenseList({ expenses, onDeleteExpense }: ExpenseListProps) {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>Your recent expenses will appear here</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          No expenses recorded yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses</CardTitle>
        <CardDescription>Manage your expenses</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.description}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>{formatDate(expense.date)}</TableCell>
                <TableCell className="text-right">
                  {formatAmount(expense.amount)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteExpense(expense.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 