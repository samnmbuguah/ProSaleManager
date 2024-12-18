import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import type { Expense } from '@/types/expense';
import { expenseService } from '@/services/expenseService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: expenseService.getAll,
  });

  const createExpenseMutation = useMutation({
    mutationFn: expenseService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Success",
        description: "Expense added successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add expense",
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: expenseService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
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

  const handleAddExpense = (newExpense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    createExpenseMutation.mutate(newExpense);
  };

  const handleDeleteExpense = (expenseId: number) => {
    deleteExpenseMutation.mutate(expenseId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Expense Tracker</h2>
        <p className="text-muted-foreground">
          Manage and track your business expenses
        </p>
      </div>
      <ExpenseForm onAddExpense={handleAddExpense} />
      <ExpenseList 
        expenses={expenses || []} 
        onDeleteExpense={handleDeleteExpense}
      />
    </div>
  );
} 