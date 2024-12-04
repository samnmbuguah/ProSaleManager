import type { Supplier } from "@db/schema";
import { useSuppliers } from "@/hooks/use-suppliers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, MapPin } from "lucide-react";

export function SupplierList() {
  const { suppliers, isLoading } = useSuppliers();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Products</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers?.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{supplier.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {supplier.email}
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {supplier.phone}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {supplier.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {supplier.address}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  View Products
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
