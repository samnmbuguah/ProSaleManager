import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product, ProductFormData, STOCK_UNITS } from '@/types/product';
import { PRODUCT_CATEGORIES } from '@/constants/categories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suppliers } from '@/components/inventory/Suppliers';
import { PurchaseOrders } from '@/components/inventory/PurchaseOrders';

const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const initialFormData: ProductFormData = {
    name: '',
    product_code: '',
    category: '',
    stock_unit: 'piece',
    quantity: 0,
    min_stock: 0,
    buying_price: '0',
    selling_price: '0',
  };

  const [formData, setFormData] = useState<ProductFormData>(initialFormData);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/products`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch products',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      
      // Append all product data except image
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'image') {
          formDataToSend.append(key, value.toString());
        }
      });

      // Append image if exists
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const url = selectedProduct
        ? `${import.meta.env.VITE_API_URL}/products/${selectedProduct.id}`
        : `${import.meta.env.VITE_API_URL}/products`;

      const response = await fetch(url, {
        method: selectedProduct ? 'PUT' : 'POST',
        body: formDataToSend,
      });

      if (!response.ok) throw new Error('Failed to save product');

      toast({
        title: 'Success',
        description: `Product ${selectedProduct ? 'updated' : 'created'} successfully`,
      });

      setFormData(initialFormData);
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: `Failed to ${selectedProduct ? 'update' : 'create'} product`,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      product_code: product.product_code || '',
      category: product.category,
      stock_unit: product.stock_unit,
      quantity: product.quantity,
      min_stock: product.min_stock,
      buying_price: product.buying_price,
      selling_price: product.selling_price,
    });
    setImagePreview(product.image_url);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');

      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });

      fetchProducts();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/products/search?query=${searchQuery}`
      );
      if (!response.ok) throw new Error('Failed to search products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to search products',
        variant: 'destructive',
      });
    }
  };

  const ProductForm = () => {
    // Cleanup preview URL when component unmounts
    useEffect(() => {
      return () => {
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
        }
      };
    }, [imagePreview]);

    const calculateUnitPrice = (price: string, unit: typeof STOCK_UNITS[number]): number => {
      const numericPrice = parseFloat(price);
      switch (unit) {
        case 'dozen':
          return numericPrice / 12;
        case 'pack':
          return numericPrice / 6;
        default:
          return numericPrice;
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="image">Product Image (Optional)</Label>
          <Input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1"
          />
          {imagePreview && (
            <div className="mt-2">
              <img
                src={imagePreview}
                alt="Product Preview"
                className="w-32 h-32 object-cover rounded-md"
              />
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="product_code">Product Code</Label>
          <Input
            id="product_code"
            name="product_code"
            value={formData.product_code}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="stock_unit">Stock Unit *</Label>
          <Select 
            value={formData.stock_unit} 
            onValueChange={(value) => setFormData(prev => ({ 
              ...prev, 
              stock_unit: value as typeof STOCK_UNITS[number]
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a stock unit" />
            </SelectTrigger>
            <SelectContent>
              {STOCK_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit.charAt(0).toUpperCase() + unit.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="min_stock">Minimum Stock *</Label>
            <Input
              id="min_stock"
              name="min_stock"
              type="number"
              value={formData.min_stock}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="buying_price">Buying Price *</Label>
            <Input
              id="buying_price"
              name="buying_price"
              type="number"
              step="0.01"
              value={formData.buying_price}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="selling_price">Selling Price *</Label>
            <Input
              id="selling_price"
              name="selling_price"
              type="number"
              step="0.01"
              value={formData.selling_price}
              onChange={handleInputChange}
              required
            />
            <div className="text-sm text-gray-500 mt-1">
              Per piece: KSh {calculateUnitPrice(formData.selling_price, formData.stock_unit).toFixed(2)}
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full">
          {selectedProduct ? 'Update Product' : 'Add Product'}
        </Button>
      </form>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="products" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          </TabsList>
          
          {activeTab === 'products' && (
            <div className="flex gap-2">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <Button onClick={handleSearch}>Search</Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setSelectedProduct(null);
                      setFormData(initialFormData);
                      setImagePreview(null);
                    }}
                  >
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>Fill in the product details below.</DialogDescription>
                  </DialogHeader>
                  <ProductForm />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        <TabsContent value="products">
          <div className="rounded-md border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 flex flex-col space-y-2"
                >
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-md mb-2"
                    />
                  )}
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  {product.product_code && (
                    <p className="text-sm text-gray-600">Product Code: {product.product_code}</p>
                  )}
                  <p className="text-sm text-gray-600">Category: {product.category}</p>
                  <p className="text-sm text-gray-600">
                    Quantity: {product.quantity} {product.stock_unit}
                    {product.available_units !== product.quantity && (
                      <span className="ml-2">({product.available_units} pieces)</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">Min Stock: {product.min_stock}</p>
                  <p className="text-sm text-gray-600">
                    Buying Price: KSh {parseFloat(product.buying_price).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Selling Price: KSh {parseFloat(product.selling_price).toLocaleString()}
                  </p>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(product)}
                      size="sm"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => product.id && handleDelete(product.id)}
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="suppliers">
          <Suppliers />
        </TabsContent>

        <TabsContent value="purchase-orders">
          <PurchaseOrders />
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update the product details below.</DialogDescription>
          </DialogHeader>
          <ProductForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
