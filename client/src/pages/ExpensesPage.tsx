import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import type { Expense } from '@/types/expense';
import { expenseService } from '@/services/expenseService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading, checkSession } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      checkSession();
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to access this page",
      });
      setLocation('/auth');
    }
  }, [isAuthenticated, authLoading, setLocation, toast]);

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: expenseService.getAll,
    enabled: isAuthenticated,
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
    onError: (error) => {
      console.error('Error creating expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add expense. Please try again.",
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

  const handleAddExpense = (newExpense: Omit<Expense, 'id' | 'user_id' | 'createdAt' | 'updatedAt'>) => {
    if (!isAuthenticated || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to add expenses",
      });
      return;
    }

    createExpenseMutation.mutate({
      ...newExpense,
      user_id: user.id
    });
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

  if (expensesLoading) {
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
        expenses={expenses} 
        onDeleteExpense={handleDeleteExpense}
      />
    </div>
  );
} 