import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductForm } from "@/components/inventory/ProductForm";
import { ProductTable, type ProductWithPricing } from "@/components/inventory/ProductTable";
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
import type { ProductFormData } from "@/components/inventory/ProductForm";

function generateSKU(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
    .padEnd(6, '0') + 
    Math.random().toString(36).substring(2, 5).toUpperCase();
}

export default function InventoryPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isPurchaseOrderFormOpen, setIsPurchaseOrderFormOpen] = useState(false);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const { 
    products, 
    isLoading: isLoadingProducts, 
    createProduct, 
    updateProduct,
    isCreating: isCreatingProduct,
    isUpdating: isUpdatingProduct
  } = useProducts();
  const { createPurchaseOrder, createPurchaseOrderItem, isCreating: isCreatingPO } = usePurchaseOrders();
  const { createSupplier, isCreating: isCreatingSupplier } = useSuppliers();

  const loadDemoData = async () => {
    try {
      setIsLoadingDemo(true);
      const response = await fetch('/api/seed-demo-data', {
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

  const handleUpdateProduct = async (id: number, data: any) => {
    try {
      await updateProduct({ id, ...data });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
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
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={loadDemoData}
                disabled={isLoadingDemo}
              >
                <Database className="mr-2 h-4 w-4" />
                {isLoadingDemo ? "Loading..." : "Load Demo Data"}
              </Button>
            </div>
            <Button onClick={() => setIsProductFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
          <ProductTable 
            products={(products as ProductWithPricing[]) || []} 
            isLoading={isLoadingProducts} 
            onUpdateProduct={handleUpdateProduct}
          />
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
            onSubmit={async (data: ProductFormData) => {
              // Get the default pricing unit
              const defaultUnit = data.price_units.find(unit => unit.is_default);
              if (!defaultUnit) {
                toast({
                  title: "Error",
                  description: "A default pricing unit is required",
                  variant: "destructive",
                });
                return;
              }

              const productData = {
                name: data.name,
                sku: generateSKU(data.name),
                buying_price: defaultUnit.buying_price,
                selling_price: defaultUnit.selling_price,
                stock: data.stock,
                category: data.category,
                min_stock: data.min_stock,
                max_stock: data.max_stock,
                reorder_point: data.reorder_point,
                stock_unit: data.stock_unit,
                price_units: data.price_units.map(unit => ({
                  unit_type: unit.unit_type,
                  quantity: unit.quantity,
                  buying_price: unit.buying_price,
                  selling_price: unit.selling_price,
                  is_default: unit.is_default
                }))
              };
              
              try {
                console.log('Creating product with data:', productData);
                await createProduct(productData);
                toast({
                  title: "Success",
                  description: "Product created successfully",
                });
                setIsProductFormOpen(false);
              } catch (error) {
                console.error('Failed to create product:', error);
                toast({
                  variant: "destructive",
                  title: "Error",
                  description: error instanceof Error ? error.message : "Failed to create product",
                });
                // Don't close the form on error
                return;
              }
            }}
            isSubmitting={isCreatingProduct}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isPurchaseOrderFormOpen} onOpenChange={setIsPurchaseOrderFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
          </DialogHeader>
          <PurchaseOrderForm
            onSubmit={async (data) => {
              const total = data.items.reduce((sum, item) => 
                sum + (Number(item.buying_price) * item.quantity), 0
              ).toFixed(2);

              const order = await createPurchaseOrder({
                supplierId: data.supplierId,
                userId: user?.id || 0,
                orderDate: new Date(),
                status: "pending",
                total,
              });

              if (order?.id) {
                await Promise.all(data.items.map(item => 
                  createPurchaseOrderItem({
                    purchaseOrderId: order.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    buyingPrice: item.buying_price.toString(),
                    sellingPrice: item.selling_price.toString(),
                  })
                ));
              }

              setIsPurchaseOrderFormOpen(false);
            }}
            isSubmitting={isCreatingPO}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isSupplierFormOpen} onOpenChange={setIsSupplierFormOpen}>
        <DialogContent className="max-w-2xl">
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
