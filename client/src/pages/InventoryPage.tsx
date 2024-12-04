import { useState } from "react";
import { ProductTable } from "../components/inventory/ProductTable";
import { ProductForm } from "../components/inventory/ProductForm";
import { PurchaseOrderList } from "../components/inventory/PurchaseOrderList";
import { PurchaseOrderForm } from "../components/inventory/PurchaseOrderForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useInventory } from "../hooks/use-inventory";
import { usePurchaseOrders } from "../hooks/use-purchase-orders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InventoryPage() {
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isPurchaseOrderFormOpen, setIsPurchaseOrderFormOpen] = useState(false);
  const { products = [], isLoading, createProduct, isCreating } = useInventory();
  const { createPurchaseOrder, isCreating: isCreatingPO } = usePurchaseOrders();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventory Management</h1>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
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
              await createPurchaseOrder(data);
              setIsPurchaseOrderFormOpen(false);
            }}
            isSubmitting={isCreatingPO}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
