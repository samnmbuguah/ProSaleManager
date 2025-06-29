import React from "react";
import { Product } from "@/types/product";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{product.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {product.sku && (
          <div className="text-sm text-gray-500 mb-2">SKU: {product.sku}</div>
        )}
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Category ID: {product.category_id}
          </p>
          <p className="text-sm text-gray-600">Stock: {product.quantity}</p>
          <p className="text-sm text-gray-600">
            Min Quantity: {product.min_quantity}
          </p>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Cost: KSh {product.cost_price.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              Price: KSh {product.price.toLocaleString()}
            </p>
          </div>
          <div className="flex justify-end">
            <Badge variant={product.is_active ? "default" : "destructive"}>
              {product.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
