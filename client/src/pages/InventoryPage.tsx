import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product, PriceUnit, ProductFormData } from '@/types/product';
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
  const { toast } = useToast();

  const initialFormData: ProductFormData = {
    name: '',
    sku: '',
    category: '',
    stock: 0,
    min_stock: 0,
    max_stock: 0,
    reorder_point: 0,
    stock_unit: 'per_piece',
    buying_price: '0',
    selling_price: '0',
    price_units: [
      {
        unit_type: 'per_piece',
        quantity: 1,
        buying_price: '0',
        selling_price: '0',
        is_default: true,
      },
    ],
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
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handlePriceUnitChange = (index: number, field: keyof PriceUnit, value: string | number | boolean) => {
    setFormData((prev) => {
      const newPriceUnits = [...prev.price_units];
      newPriceUnits[index] = {
        ...newPriceUnits[index],
        [field]: value,
      };
      return {
        ...prev,
        price_units: newPriceUnits,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      
      // Append all product data except price_units and image
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'price_units' && key !== 'image') {
          formDataToSend.append(key, value.toString());
        }
      });

      // Append price units as JSON string
      formDataToSend.append('price_units', JSON.stringify(formData.price_units));

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
      ...product,
      price_units: product.price_units || [],
    });
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
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFormData((prev) => ({
          ...prev,
          image: file,
        }));
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
      }
    };

    // Cleanup preview URL when component unmounts
    useEffect(() => {
      return () => {
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
        }
      };
    }, [imagePreview]);

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="image">Product Image</Label>
          <Input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1"
          />
          {(imagePreview || formData.image_url || selectedProduct?.image_url) && (
            <div className="mt-2">
              <img
                src={imagePreview || formData.image_url || selectedProduct?.image_url}
                alt="Product Preview"
                className="w-32 h-32 object-cover rounded-md"
              />
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            name="sku"
            value={formData.sku}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="stock_unit">Stock Unit</Label>
            <Input
              id="stock_unit"
              name="stock_unit"
              value={formData.stock_unit}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="min_stock">Min Stock</Label>
            <Input
              id="min_stock"
              name="min_stock"
              type="number"
              value={formData.min_stock}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="max_stock">Max Stock</Label>
            <Input
              id="max_stock"
              name="max_stock"
              type="number"
              value={formData.max_stock}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="reorder_point">Reorder Point</Label>
          <Input
            id="reorder_point"
            name="reorder_point"
            type="number"
            value={formData.reorder_point}
            onChange={handleInputChange}
            required
          />
        </div>

        {formData.price_units.map((unit, index) => (
          <div key={index} className="space-y-4 p-4 border rounded-md">
            <h4 className="font-medium">Price Unit {index + 1}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`unit_type_${index}`}>Unit Type</Label>
                <Input
                  id={`unit_type_${index}`}
                  value={unit.unit_type}
                  onChange={(e) =>
                    handlePriceUnitChange(index, 'unit_type', e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor={`quantity_${index}`}>Quantity</Label>
                <Input
                  id={`quantity_${index}`}
                  type="number"
                  value={unit.quantity}
                  onChange={(e) =>
                    handlePriceUnitChange(index, 'quantity', Number(e.target.value))
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`buying_price_${index}`}>Buying Price</Label>
                <Input
                  id={`buying_price_${index}`}
                  value={unit.buying_price}
                  onChange={(e) =>
                    handlePriceUnitChange(index, 'buying_price', e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor={`selling_price_${index}`}>Selling Price</Label>
                <Input
                  id={`selling_price_${index}`}
                  value={unit.selling_price}
                  onChange={(e) =>
                    handlePriceUnitChange(index, 'selling_price', e.target.value)
                  }
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`is_default_${index}`}
                checked={unit.is_default}
                onChange={(e) =>
                  handlePriceUnitChange(index, 'is_default', e.target.checked)
                }
              />
              <Label htmlFor={`is_default_${index}`}>Default Unit</Label>
            </div>
          </div>
        ))}

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
                    }}
                  >
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
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
                  <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                  <p className="text-sm text-gray-600">Category: {product.category}</p>
                  <p className="text-sm text-gray-600">
                    Stock: {product.stock} {product.stock_unit}
                  </p>
                  <div className="mt-2 space-y-1">
                    <h4 className="font-medium">Price Units:</h4>
                    {product.price_units?.map((unit, index) => (
                      <div key={index} className="text-sm">
                        {unit.unit_type} ({unit.quantity}): Buy - ${unit.buying_price},
                        Sell - ${unit.selling_price}
                        {unit.is_default && ' (Default)'}
                      </div>
                    ))}
                  </div>
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
          </DialogHeader>
          <ProductForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
