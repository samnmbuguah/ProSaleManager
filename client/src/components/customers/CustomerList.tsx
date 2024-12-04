import { type Customer } from "@db/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Phone, User } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";

interface CustomerListProps {
  customers: Customer[] | null | undefined;
  isLoading: boolean;
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="text-center py-8 text-red-500">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
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
    <ErrorBoundary FallbackComponent={ErrorFallback}>
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
  );
}
