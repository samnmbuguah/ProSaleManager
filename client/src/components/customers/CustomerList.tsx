import React from 'react';
import { type Customer } from "@db/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Phone, User } from "lucide-react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

interface CustomerListProps {
  customers: Customer[];
  isLoading: boolean;
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  React.useEffect(() => {
    console.error("[CustomerList] Error:", error);
    
    // Report error to health monitoring system
    fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        component: 'CustomerList',
        stack: error.stack
      })
    }).catch(err => {
      console.error('Failed to report error:', err);
    });
  }, [error]);

  return (
    <div className="text-center py-8 text-red-500">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button 
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}

export function CustomerList({ customers, isLoading }: CustomerListProps) {
  if (isLoading) {
    return <div className="text-center py-8">Loading customers...</div>;
  }

  if (!Array.isArray(customers) || customers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No customers found
      </div>
    );
  }

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        console.error("[CustomerList] Error boundary caught:", error);
      }}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {customers.map((customer) => (
          <Card key={customer.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {customer.name}
              </CardTitle>
              <CardDescription>Customer ID: #{customer.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {customer.email}
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {customer.phone}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ErrorBoundary>
  );
}
