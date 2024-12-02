import { useState } from "react";
import { ProductTable } from "../components/inventory/ProductTable";
import { type Product, type Supplier, type PurchaseOrder, type PurchaseOrderItem, type InsertSupplierProduct } from "@db/schema";
import { ProductForm } from "../components/inventory/ProductForm";
import { SupplierForm } from "../components/inventory/SupplierForm";
import { PurchaseOrderForm } from "../components/inventory/PurchaseOrderForm";
import { SupplierPerformance } from "../components/inventory/SupplierPerformance";
import { SupplierProducts } from "../components/inventory/SupplierProducts";
import { Button } from "@/components/ui/button";
import { Plus, Package, Truck } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInventory } from "../hooks/use-inventory";
import { useSuppliers } from "../hooks/use-suppliers";

export default function InventoryPage() {
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [isPurchaseOrderFormOpen, setIsPurchaseOrderFormOpen] = useState(false);
  
  const { 
    products, 
    isLoading: isLoadingProducts, 
    createProduct, 
    isCreating, 
    addStock, 
    isAddingStock 
  } = useInventory();

  const {
    suppliers,
    isLoading: isLoadingSuppliers,
    createSupplier,
    isCreatingSupplier,
    purchaseOrders,
    isLoadingOrders,
    createPurchaseOrder,
    isCreatingOrder,
    receivePurchaseOrder,
    isReceivingOrder,
    updateSupplierQuality,
    isUpdatingQuality,
    reorderSuggestions,
    addSupplierProduct,
    updateSupplierProduct,
  } = useSuppliers();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventory Management</h1>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsProductFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>

          <ProductTable
            products={products || []}
            isLoading={isLoadingProducts}
            onAddStock={async (productId, quantity) => {
              await addStock({ productId, quantity });
            }}
            isAddingStock={isAddingStock}
          />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsPurchaseOrderFormOpen(true)}>
              <Package className="mr-2 h-4 w-4" />
              New Purchase Order
            </Button>
            <Button onClick={() => setIsSupplierFormOpen(true)}>
              <Truck className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Suppliers</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingSuppliers ? (
                    <div>Loading suppliers...</div>
                  ) : suppliers?.length === 0 ? (
                    <div>No suppliers found</div>
                  ) : (
                    <div className="space-y-4">
                      {suppliers?.map((supplier) => (
                        <div key={supplier.id} className="space-y-4">
                          <SupplierPerformance 
                            supplier={supplier}
                            onUpdateQualityRating={updateSupplierQuality}
                          />
                          <div className="text-sm text-muted-foreground">
                            {supplier.email && <div>Email: {supplier.email}</div>}
                            {supplier.phone && <div>Phone: {supplier.phone}</div>}
                            {supplier.address && <div>Address: {supplier.address}</div>}
                          </div>
                          <SupplierProducts
                            supplierId={supplier.id}
                            products={products || []}
                            onAddProduct={addSupplierProduct}
                            onUpdateProduct={updateSupplierProduct}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              {reorderSuggestions && reorderSuggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Reorder Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reorderSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.product.id}
                          className={`p-4 rounded-lg border ${suggestion.isUrgent ? 'bg-destructive/10 border-destructive/50' : 'bg-card'} text-card-foreground`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {suggestion.product.name}
                                {suggestion.isUrgent && (
                                  <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded-full">
                                    Urgent
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Current Stock: {suggestion.product.currentStock}<br />
                                Reorder Point: {suggestion.product.reorderPoint}<br />
                                Stock Out in: {suggestion.stockOutDays} days
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={suggestion.isUrgent ? "destructive" : "default"}
                              onClick={() => {
                                setIsPurchaseOrderFormOpen(true);
                              }}
                            >
                              Order Now
                            </Button>
                          </div>
                          {suggestion.supplier && (
                            <div className="mt-2 text-sm">
                              <div className="font-medium">Recommended Supplier: {suggestion.supplier.name}</div>
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                <div>Delivery Rate: {Number(suggestion.supplier.onTimeDeliveryRate).toFixed(1)}%</div>
                                <div>Quality Rating: {Number(suggestion.supplier.qualityRating).toFixed(1)}/5</div>
                                <div>Response Time: {suggestion.supplier.responseTime}h</div>
                                <div>Suggested Quantity: {suggestion.suggestedOrderQuantity}</div>
                              </div>
                            </div>
                          )}
                          {!suggestion.supplier && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              No suitable supplier found. Consider adding a new supplier.
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Purchase Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingOrders ? (
                  <div>Loading purchase orders...</div>
                ) : purchaseOrders?.length === 0 ? (
                  <div>No purchase orders found</div>
                ) : (
                  <div className="space-y-2">
                    {purchaseOrders?.map((order: PurchaseOrder & { 
  supplier?: Supplier; 
  items: Array<PurchaseOrderItem & { product?: Product }>;
}) => (
                      <div
                        key={order.id}
                        className="p-4 rounded-lg border bg-card text-card-foreground"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              Order #{order.id} - {order.supplier?.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Status: {order.status}
                              <br />
                              Total: KSh {Number(order.total).toLocaleString()}
                            </div>
                          </div>
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                receivePurchaseOrder({
                                  id: order.id,
                                  items: order.items.map((item: { id: number; productId: number; quantity: number; receivedQuantity?: number }) => ({
                                    id: item.id,
                                    productId: item.productId,
                                    quantity: item.quantity - (item.receivedQuantity || 0),
                                  }))
                                });
                              }}
                              disabled={isReceivingOrder}
                            >
                              Receive Items
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Add Product</DialogTitle>
          <ProductForm
            onSubmit={async (data) => {
              await createProduct(data);
              setIsProductFormOpen(false);
            }}
            isSubmitting={isCreating}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isSupplierFormOpen} onOpenChange={setIsSupplierFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Add Supplier</DialogTitle>
          <SupplierForm
            onSubmit={async (data) => {
              await createSupplier(data);
              setIsSupplierFormOpen(false);
            }}
            isSubmitting={isCreatingSupplier}
          />
        </DialogContent>
      </Dialog>

      <Dialog 
        open={isPurchaseOrderFormOpen} 
        onOpenChange={setIsPurchaseOrderFormOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogTitle>Create Purchase Order</DialogTitle>
          <PurchaseOrderForm
            suppliers={suppliers || []}
            products={products || []}
            onSubmit={async (data) => {
              await createPurchaseOrder(data);
              setIsPurchaseOrderFormOpen(false);
            }}
            isSubmitting={isCreatingOrder}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
