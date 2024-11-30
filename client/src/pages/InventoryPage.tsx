import { useState } from "react";
import { ProductTable } from "../components/inventory/ProductTable";
import { ProductForm } from "../components/inventory/ProductForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useInventory } from "../hooks/use-inventory";

export default function InventoryPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { products, isLoading, createProduct, isCreating, addStock, isAddingStock } = useInventory();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <ProductTable
        products={products || []}
        isLoading={isLoading}
        onAddStock={async (productId, quantity) => {
          await addStock({ productId, quantity });
        }}
        isAddingStock={isAddingStock}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <ProductForm
            onSubmit={async (data) => {
              await createProduct(data);
              setIsFormOpen(false);
            }}
            isSubmitting={isCreating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
