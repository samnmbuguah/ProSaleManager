interface TopSellingProduct {
  productId: number;
  name: string;
  category: string;
  units: number;
  revenue: number;
}

export function TopSelling({ data }: { data: TopSellingProduct[] }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Top Selling Products</h3>
      <div className="space-y-2">
        {data.map((product, index) => (
          <div key={product.productId} className="flex items-start space-x-4 p-3 bg-accent rounded-lg">
            <div className="font-medium">
              {index + 1}. {product.name}
              <div className="text-sm text-muted-foreground">{product.category}</div>
            </div>
            <div className="ml-auto text-right">
              <div>Units: {product.units}</div>
              <div className="text-sm text-muted-foreground">
                KSh {Number(product.revenue).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
