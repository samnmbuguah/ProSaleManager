import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ExpenseForm from "../components/ExpenseForm";
import ExpenseList from "../components/ExpenseList";
import type { Expense } from "@/types/expense";
import { expenseService } from "@/services/expenseService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useStoreContext } from "@/contexts/StoreContext";

import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading, checkSession } = useAuth();
  const [, setLocation] = useLocation();
  const { currentStore, isLoading: isStoreLoading } = useStoreContext();

  const [date, setDate] = useState<DateRange | undefined>();

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      checkSession();
    }
  }, [isAuthenticated, authLoading, checkSession]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to access this page",
      });
      setLocation("/auth");
    }
  }, [isAuthenticated, authLoading, setLocation, toast]);

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses", currentStore?.id, date],
    queryFn: () => expenseService.getAll(currentStore?.id, {
      start_date: date?.from ? date.from.toISOString() : undefined,
      end_date: date?.to ? date.to.toISOString() : undefined
    }),
    enabled: isAuthenticated && !!currentStore && !isStoreLoading,
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data: Parameters<typeof expenseService.create>[0]) =>
      expenseService.create(data, currentStore?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", currentStore?.id] });
      toast({
        title: "Success",
        description: "Expense added successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating expense:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add expense. Please try again.",
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: number) => expenseService.delete(id, currentStore?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", currentStore?.id] });
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete expense",
      });
    },
  });

  const handleAddExpense = (
    newExpense: Omit<Expense, "id" | "user_id" | "createdAt" | "updatedAt">
  ) => {
    if (!isAuthenticated || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to add expenses",
      });
      return;
    }

    createExpenseMutation.mutate(newExpense);
  };

  const handleDeleteExpense = (expenseId: number) => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to delete expenses",
      });
      return;
    }
    deleteExpenseMutation.mutate(expenseId);
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 mt-16 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expense Tracker</h2>
          <p className="text-muted-foreground">Manage and track your business expenses</p>
        </div>
        <div className={cn("grid gap-2")}>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {expensesLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <ExpenseForm onAddExpense={handleAddExpense} />
          <ExpenseList expenses={expenses} onDeleteExpense={handleDeleteExpense} />
        </>
      )}
    </div>
  );
}
