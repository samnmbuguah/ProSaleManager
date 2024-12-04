import { useState } from "react";
import { ProductTable } from "../components/inventory/ProductTable";
import { ProductForm } from "../components/inventory/ProductForm";
import { PurchaseOrderList } from "../components/inventory/PurchaseOrderList";
import { PurchaseOrderForm } from "../components/inventory/PurchaseOrderForm";
import { SupplierForm } from "../components/inventory/SupplierForm";
import { SupplierList } from "../components/inventory/SupplierList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInventory } from "../hooks/use-inventory";
import { usePurchaseOrders } from "../hooks/use-purchase-orders";
import { useSuppliers } from "@/hooks/use-suppliers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InventoryPage() {
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isPurchaseOrderFormOpen, setIsPurchaseOrderFormOpen] = useState(false);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const { products = [], isLoading, createProduct, isCreating } = useInventory();
  const { createPurchaseOrder, isCreating: isCreatingPO } = usePurchaseOrders();
  const { createSupplier, isCreating: isCreatingSupplier } = useSuppliers();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventory Management</h1>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsProductFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>

          <ProductTable products={products || []} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsSupplierFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </div>
          <SupplierList />
        </TabsContent>

        <TabsContent value="purchase-orders">
          <PurchaseOrderList
            onCreateOrder={() => setIsPurchaseOrderFormOpen(true)}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <ProductForm
            onSubmit={async (data) => {
              await createProduct(data);
              setIsProductFormOpen(false);
            }}
            isSubmitting={isCreating}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isPurchaseOrderFormOpen} onOpenChange={setIsPurchaseOrderFormOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
          </DialogHeader>
          <PurchaseOrderForm
            onSubmit={async (data) => {
              await createPurchaseOrder({
                supplierId: parseInt(data.supplierId),
                total: data.total,
                items: data.items,
              });
              setIsPurchaseOrderFormOpen(false);
            }}
            isSubmitting={isCreatingPO}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isSupplierFormOpen} onOpenChange={setIsSupplierFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <SupplierForm
            onSubmit={async (data) => {
              await createSupplier(data);
              setIsSupplierFormOpen(false);
            }}
            isSubmitting={isCreatingSupplier}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
