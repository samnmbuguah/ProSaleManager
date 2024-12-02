import { useState } from "react";
import { type Supplier } from "@db/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Package, Star, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { QualityRatingDialog } from "./QualityRatingDialog";

interface SupplierPerformanceProps {
  supplier: Supplier;
  onUpdateQualityRating?: (supplierId: number, rating: number) => Promise<void>;
}

export function SupplierPerformance({ supplier, onUpdateQualityRating }: SupplierPerformanceProps) {
  const [isQualityDialogOpen, setIsQualityDialogOpen] = useState(false);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          {supplier.name} Performance
        </CardTitle>
        <CardDescription>
          Supplier performance metrics and ratings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2 mb-4">
          {Number(supplier.onTimeDeliveryRate) >= 90 ? (
            <Badge className="bg-green-500">Elite Supplier</Badge>
          ) : Number(supplier.onTimeDeliveryRate) >= 80 ? (
            <Badge className="bg-blue-500">Preferred Supplier</Badge>
          ) : Number(supplier.onTimeDeliveryRate) >= 70 ? (
            <Badge>Standard Supplier</Badge>
          ) : (
            <Badge variant="destructive">Needs Improvement</Badge>
          )}
          {Number(supplier.qualityRating) >= 4.5 && (
            <Badge className="bg-purple-500">Quality Excellence</Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium">On-Time Delivery Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{Number(supplier.onTimeDeliveryRate).toFixed(1)}%</span>
              {Number(supplier.onTimeDeliveryRate) >= 90 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : Number(supplier.onTimeDeliveryRate) < 70 && (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              )}
            </div>
          </div>
          <Progress 
            value={Number(supplier.onTimeDeliveryRate)} 
            className={Number(supplier.onTimeDeliveryRate) >= 90 ? "bg-green-500" : undefined}
          />
          <div className="text-xs text-muted-foreground">
            Target: 90% or higher for Elite status
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="font-medium">Quality Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{Number(supplier.qualityRating).toFixed(1)}/5</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onUpdateQualityRating) {
                    setIsQualityDialogOpen(true);
                  }
                }}
              >
                Update Rating
              </Button>
            </div>
          </div>
          <Progress 
            value={Number(supplier.qualityRating) * 20}
            className={Number(supplier.qualityRating) >= 4.5 ? "bg-purple-500" : undefined}
          />
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date(supplier.updatedAt).toLocaleDateString()}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">Average Response Time</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{supplier.responseTime} hours</span>
              {supplier.responseTime <= 24 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : supplier.responseTime > 48 && (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              )}
            </div>
          </div>
          <Progress 
            value={Math.max(0, 100 - (supplier.responseTime / 48) * 100)}
            className={supplier.responseTime <= 24 ? "bg-green-500" : undefined}
          />
          <div className="text-xs text-muted-foreground">
            Target: Less than 24 hours for optimal performance
          </div>
        </div>

        <QualityRatingDialog
          open={isQualityDialogOpen}
          onOpenChange={setIsQualityDialogOpen}
          onSubmit={async (rating) => {
            if (onUpdateQualityRating) {
              await onUpdateQualityRating(supplier.id, rating);
              setIsQualityDialogOpen(false);
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
