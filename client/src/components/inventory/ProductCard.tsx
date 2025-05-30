import React from "react";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
}) => (
  <div className="border rounded-lg p-4 flex flex-col space-y-2">
    {product.image_url && (
      <img
        src={product.image_url}
        alt={product.name}
        className="w-full h-48 object-cover rounded-md mb-2"
      />
    )}
    <h3 className="text-lg font-semibold">{product.name}</h3>
    {product.product_code && (
      <p className="text-sm text-gray-600">
        Product Code: {product.product_code}
      </p>
    )}
    <p className="text-sm text-gray-600">Category: {product.category}</p>
    <p className="text-sm text-gray-600">
      Stock: {product.stock} {product.stock_unit}
      {product.available_units !== product.stock && (
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
      <Button variant="outline" onClick={() => onEdit(product)} size="sm">
        Edit
      </Button>
      <Button
        variant="destructive"
        onClick={() => onDelete(product.id!)}
        size="sm"
      >
        Delete
      </Button>
    </div>
  </div>
);

export default ProductCard;
