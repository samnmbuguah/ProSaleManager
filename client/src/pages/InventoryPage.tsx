import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductForm } from "@/components/inventory/ProductForm";
import { ProductTable } from "@/components/inventory/ProductTable";
import { PurchaseOrderForm } from "@/components/inventory/PurchaseOrderForm";
import { PurchaseOrderList } from "@/components/inventory/PurchaseOrderList";
import { SupplierForm } from "@/components/inventory/SupplierForm";
import { SupplierList } from "@/components/inventory/SupplierList";
import { useProducts } from "@/hooks/use-products";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import { useSuppliers } from "@/hooks/use-suppliers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Plus, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function InventoryPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isPurchaseOrderFormOpen, setIsPurchaseOrderFormOpen] = useState(false);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const { products, isLoading: isLoadingProducts, createProduct, isCreating: isCreatingProduct } = useProducts();
  const { createPurchaseOrder, createPurchaseOrderItem, isCreating: isCreatingPO } = usePurchaseOrders();
  const { createSupplier, isCreating: isCreatingSupplier } = useSuppliers();

  const loadDemoData = async () => {
    try {
      setIsLoadingDemo(true);
      const response = await fetch('/api/demo/seed', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to load demo data');
      }
      
      toast({
        title: "Success",
        description: "Demo data loaded successfully",
      });
      
      // Refresh the page to show new data
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load demo data",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDemo(false);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline"
              onClick={loadDemoData}
              disabled={isLoadingDemo}
            >
              <Database className="mr-2 h-4 w-4" />
              {isLoadingDemo ? "Loading..." : "Load Demo Data"}
            </Button>
            <Button onClick={() => setIsProductFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
          <ProductTable products={products || []} isLoading={isLoadingProducts} />
        </TabsContent>

        <TabsContent value="purchase-orders" className="space-y-4">
          <PurchaseOrderList onCreateOrder={() => setIsPurchaseOrderFormOpen(true)} />
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
      </Tabs>

      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <ProductForm
            onSubmit={async (data) => {
              const productData = {
                name: data.name,
                buyingPrice: data.perPiece.buyingPrice,
                sellingPrice: data.perPiece.sellingPrice,
                stock: data.stock,
                category: data.category,
                minStock: data.minStock,
                maxStock: data.maxStock,
                reorderPoint: data.reorderPoint,
                stockUnit: data.stockUnit,
              };
              
              const product = await createProduct(productData);

              if (product?.id) {
                // Insert SKU pricing records
                await fetch('/api/unit-pricing', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    productId: product.id,
                    prices: {
                      per_piece: data.perPiece,
                      three_piece: data.threePiece,
                      dozen: data.dozen,
                    }
                  }),
                });
              }

              setIsProductFormOpen(false);
            }}
            isSubmitting={isCreatingProduct}
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
              try {
                const purchaseOrder = await createPurchaseOrder({
                  supplierId: Number(data.supplierId),
                  userId: user?.id ?? 0,
                  total: data.total.toString(),
                  status: "pending",
                });

                if (purchaseOrder && data.items) {
                  await Promise.all(data.items.map(item => 
                    createPurchaseOrderItem({
                      purchaseOrderId: purchaseOrder.id,
                      productId: item.productId,
                      quantity: item.quantity,
                      buyingPrice: item.buyingPrice.toString(),
                      sellingPrice: item.sellingPrice.toString(),
                    })
                  ));
                }
                setIsPurchaseOrderFormOpen(false);
              } catch (error) {
                console.error('Error creating purchase order:', error);
              }
            }}
            isSubmitting={isCreatingPO}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isSupplierFormOpen} onOpenChange={setIsSupplierFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
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
