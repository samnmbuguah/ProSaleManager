import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistance } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SupplierProduct } from "@db/schema";

interface SupplierPricingProps {
  supplierProducts: Array<SupplierProduct & {
    product: { name: string };
    priceHistory?: Array<{
      price: number;
      date: string;
    }>;
  }>;
}

export function SupplierPricing({ supplierProducts }: SupplierPricingProps) {
  // Filter products with price changes
  const productsWithPriceChanges = supplierProducts.filter(
    (sp) => sp.previousPrice !== null && sp.priceVariance !== null
  );

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Supplier Pricing Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>Previous Price</TableHead>
                <TableHead>Price Variance</TableHead>
                <TableHead>Last Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsWithPriceChanges.map((sp) => (
                <TableRow key={sp.id}>
                  <TableCell>{sp.product.name}</TableCell>
                  <TableCell>KSh {sp.unitPrice.toLocaleString()}</TableCell>
                  <TableCell>
                    KSh {sp.previousPrice?.toLocaleString() ?? "N/A"}
                  </TableCell>
                  <TableCell className={Number(sp.priceVariance) > 0 ? "text-destructive" : "text-green-600"}>
                    {Number(sp.priceVariance).toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    {sp.lastPriceChange
                      ? formatDistance(new Date(sp.lastPriceChange), new Date(), {
                          addSuffix: true,
                        })
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {productsWithPriceChanges.length > 0 && (
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={productsWithPriceChanges}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="product.name"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="priceVariance"
                    name="Price Variance %"
                    stroke="#8884d8"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
