import { useState } from "react";
import type { Product, Supplier, InsertSupplier, InsertProductSupplier } from "@db/schema";
import { useSuppliers } from "../../hooks/use-suppliers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupplierSchema } from "@db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductSupplierWithDetails {
  id: number;
  productId: number;
  supplierId: number;
  costPrice: string;
  isPreferred: boolean;
  lastSupplyDate: Date | null;
  supplier: {
    id: number;
    name: string;
  };
}

type ProductSuppliersList = Array<ProductSupplierWithDetails>;

interface SupplierPricingProps {
  product: Product;
}

export function SupplierPricing({ product }: SupplierPricingProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLinkFormOpen, setIsLinkFormOpen] = useState(false);
  const { suppliers, productSuppliers, createSupplier, linkProductToSupplier, isCreating, isLinking } = useSuppliers<ProductSupplierWithDetails>();

  const form = useForm<InsertSupplier>({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const linkForm = useForm<InsertProductSupplier>({
    defaultValues: {
      productId: product.id,
      supplierId: undefined,
      costPrice: "",
      isPreferred: false,
    },
  });

  const onSubmit = async (data: InsertSupplier) => {
    await createSupplier(data);
    setIsFormOpen(false);
    form.reset();
  };

  const onLinkSubmit = async (data: InsertProductSupplier) => {
    await linkProductToSupplier({
      ...data,
      costPrice: data.costPrice,
      productId: product.id,
      supplierId: Number(data.supplierId),
    });
    setIsLinkFormOpen(false);
    linkForm.reset();
  };

  const productSuppliersList = productSuppliers?.filter(
    (ps) => ps.productId === product.id
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Supplier Management</h2>
        <div className="space-x-2">
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
          <Button onClick={() => setIsLinkFormOpen(true)} variant="outline">
            Link Supplier
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Supplier</TableHead>
            <TableHead>Cost Price</TableHead>
            <TableHead>Preferred</TableHead>
            <TableHead>Last Supply</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productSuppliersList.map((ps) => (
            <TableRow key={ps.id}>
              <TableCell>{ps.supplier.name}</TableCell>
              <TableCell>KSh {Number(ps.costPrice).toFixed(2)}</TableCell>
              <TableCell>{ps.isPreferred ? "Yes" : "No"}</TableCell>
              <TableCell>
                {ps.lastSupplyDate
                  ? new Date(ps.lastSupplyDate).toLocaleDateString()
                  : "Never"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isCreating}>
                Add Supplier
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isLinkFormOpen} onOpenChange={setIsLinkFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Supplier to Product</DialogTitle>
          </DialogHeader>
          <Form {...linkForm}>
            <form onSubmit={linkForm.handleSubmit(onLinkSubmit)} className="space-y-4">
              <FormField
                control={linkForm.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full p-2 border rounded"
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : undefined)
                        }
                      >
                        <option value="">Select a supplier</option>
                        {suppliers?.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={linkForm.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={linkForm.control}
                name="isPreferred"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Preferred Supplier</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLinking}>
                Link Supplier
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
