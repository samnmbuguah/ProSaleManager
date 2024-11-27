import type { Product } from "@db/schema";

interface TopSellingProduct {
  productId: number;
  name: string;
  category: string;
  units: number;
  revenue: number;
  profit: number;
}

export function TopSelling({ data }: { data: TopSellingProduct[] }) {
  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Top Selling Products</h3>
      <div className="space-y-2">
        {safeData.length === 0 ? (
          <div className="text-center p-4">
            <p>No top selling products data available</p>
          </div>
        ) : (
          safeData.map((product, index) => (
            <div key={product.productId} className="flex items-start space-x-4 p-3 bg-accent rounded-lg">
              <div className="font-medium">
                {index + 1}. {product.name}
                <div className="text-sm text-muted-foreground">{product.category}</div>
              </div>
              <div className="ml-auto text-right">
                <div>Units: {product.units}</div>
                <div className="text-sm">
                  Revenue: KSh {Number(product.revenue).toLocaleString()}
                </div>
                <div className={`text-sm ${Number(product.profit) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  Profit: KSh {Number(product.profit).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
