import React from "react";
import type { Product } from "../../types/product";

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  onEdit,
  onDelete,
}) => {
  if (!products.length) {
    return <div className="text-gray-500">No products available.</div>;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <div
          key={product.id}
          className="border rounded-lg p-4 bg-white shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-1">{product.name}</h2>
          <p className="text-sm text-gray-600">SKU: {product.product_code}</p>
          <p className="text-sm text-gray-600">Category: {product.category}</p>
          <p className="text-sm text-gray-600">
            Price: {product.selling_price}
          </p>
          <p className="text-sm text-gray-600">Stock: {product.quantity}</p>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => onEdit(product)}
            >
              Edit
            </button>
            <button
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={() => onDelete(product.id)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductList;

export {};
