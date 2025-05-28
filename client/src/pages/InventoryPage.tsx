import React, { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import Suppliers from "@/components/inventory/Suppliers";
import { PurchaseOrders } from "@/components/inventory/PurchaseOrders";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import {
  fetchProducts,
  setIsAddDialogOpen,
  setIsEditDialogOpen,
  setSelectedProduct,
  setSearchQuery,
  setActiveTab,
  setImagePreview,
  setFormData,
} from "@/store/productsSlice";
import ProductList from "@/components/inventory/ProductList";
import ProductFormDialog from "@/components/inventory/ProductFormDialog";
import ProductSearchBar from "@/components/inventory/ProductSearchBar";
import TabsNav from "@/components/inventory/TabsNav";

const InventoryPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const products = useSelector(
    (state: RootState) => state.products.items as Product[],
  );
  const productsStatus = useSelector(
    (state: RootState) => state.products.status,
  );
  const isAddDialogOpen = useSelector(
    (state: RootState) => state.products.isAddDialogOpen,
  );
  const isEditDialogOpen = useSelector(
    (state: RootState) => state.products.isEditDialogOpen,
  );
  const selectedProduct = useSelector(
    (state: RootState) => state.products.selectedProduct,
  );
  const searchQuery = useSelector(
    (state: RootState) => state.products.searchQuery,
  );
  const activeTab = useSelector((state: RootState) => state.products.activeTab);
  const imagePreview = useSelector(
    (state: RootState) => state.products.imagePreview,
  );
  const formData = useSelector((state: RootState) => state.products.formData);
  const { toast } = useToast();

  const defaultUnits = [
    { unit_type: "dozen", buying_price: "", selling_price: "", manual: false },
    { unit_type: "pack", buying_price: "", selling_price: "", manual: false },
    { unit_type: "piece", buying_price: "", selling_price: "", manual: false },
  ];

  const initialFormData = {
    name: "",
    product_code: "",
    category: "",
    stock_unit: "piece",
    quantity: 0,
    min_stock: 0,
    buying_price: "0",
    selling_price: "0",
    price_units: defaultUnits,
  };

  useEffect(() => {
    if (productsStatus === "idle") {
      dispatch(fetchProducts());
    }
  }, [dispatch, productsStatus]);

  const handleSubmit = async (_unused: unknown, localImageFile?: File) => {
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "price_units") {
          formDataToSend.append("price_units", JSON.stringify(value));
        } else {
          formDataToSend.append(key, value.toString());
        }
      });
      if (localImageFile) {
        formDataToSend.append("image", localImageFile);
      }
      const url = selectedProduct
        ? `${import.meta.env.VITE_API_URL}/products/${selectedProduct.id}`
        : `${import.meta.env.VITE_API_URL}/products`;
      const response = await fetch(url, {
        method: selectedProduct ? "PUT" : "POST",
        body: formDataToSend,
      });
      if (!response.ok) throw new Error("Failed to save product");
      toast({
        title: "Success",
        description: `Product ${selectedProduct ? "updated" : "created"} successfully`,
      });
      dispatch(
        setFormData({
          name: "",
          product_code: "",
          category: "",
          stock_unit: "piece",
          quantity: 0,
          min_stock: 0,
          buying_price: "0",
          selling_price: "0",
        }),
      );
      dispatch(setIsAddDialogOpen(false));
      dispatch(setIsEditDialogOpen(false));
      dispatch(fetchProducts());
    } catch (error: unknown) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: `Failed to ${selectedProduct ? "update" : "create"} product`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: Product) => {
    const mergedUnits = defaultUnits.map((def) => {
      const found = (product.price_units || []).find(
        (u) => u.unit_type === def.unit_type,
      );
      return found ? { ...def, ...found } : def;
    });
    dispatch(setSelectedProduct(product));
    dispatch(
      setFormData({
        name: product.name,
        product_code: product.product_code || "",
        category: product.category,
        stock_unit: product.stock_unit,
        quantity: product.quantity,
        min_stock: product.min_stock,
        buying_price: product.buying_price,
        selling_price: product.selling_price,
        price_units: mergedUnits,
      }),
    );
    dispatch(setImagePreview(product.image_url));
    dispatch(setIsEditDialogOpen(true));
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/products/${id}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        let errorMsg = "Failed to delete product";
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMsg = errorData.message;
          }
        } catch { }
        throw new Error(errorMsg);
      }
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      dispatch(fetchProducts());
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/products/search?query=${searchQuery}`,
      );
      if (!response.ok) throw new Error("Failed to search products");
      const data = await response.json();
      dispatch(fetchProducts(data));
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to search products",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 mt-16">
      <TabsNav
        activeTab={activeTab}
        setActiveTab={(tab) => dispatch(setActiveTab(tab))}
      />
      <div className="flex justify-between items-center mb-4">
        {activeTab === "products" && (
          <>
            <ProductSearchBar
              searchQuery={searchQuery}
              setSearchQuery={(q) => dispatch(setSearchQuery(q))}
              onSearch={handleSearch}
            />
            <Button
              onClick={() => {
                dispatch(setFormData(initialFormData));
                dispatch(setSelectedProduct(null));
                dispatch(setIsAddDialogOpen(true));
              }}
            >
              Add Product
            </Button>
          </>
        )}
      </div>
      {activeTab === "products" && (
        <ProductList
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
      <ProductFormDialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            dispatch(setFormData(initialFormData));
            dispatch(setSelectedProduct(null));
          }
          dispatch(setIsAddDialogOpen(open));
          dispatch(setIsEditDialogOpen(open));
        }}
        formData={formData}
        setFormData={(data) => dispatch(setFormData(data))}
        imagePreview={imagePreview}
        setImagePreview={(img) => dispatch(setImagePreview(img))}
        onSubmit={handleSubmit}
        selectedProduct={selectedProduct}
      />
      {activeTab === "suppliers" && <Suppliers />}
      {activeTab === "purchase-orders" && <PurchaseOrders />}
    </div>
  );
};

export default InventoryPage;
