import React, { useState } from 'react';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import type { Expense } from '../components/ExpenseForm';

interface ExpenseWithId extends Expense {
  id: number;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseWithId[]>([]);

  const handleAddExpense = (newExpense: Expense) => {
    setExpenses([...expenses, { ...newExpense, id: Date.now() }]);
  };

  const handleDeleteExpense = (expenseId: number) => {
    setExpenses(expenses.filter((expense) => expense.id !== expenseId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Expense Tracker</h2>
        <p className="text-muted-foreground">
          Manage and track your business expenses
        </p>
      </div>
      <ExpenseForm onAddExpense={handleAddExpense} />
      <ExpenseList expenses={expenses} onDeleteExpense={handleDeleteExpense} />
    </div>
  );
} 