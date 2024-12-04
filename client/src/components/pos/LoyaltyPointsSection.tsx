import { useState } from "react";
import { useLoyalty } from "@/hooks/use-loyalty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoyaltyPointsSectionProps {
  customerId?: number;
  total: number;
  onPointsUse: (points: number) => void;
}

export function LoyaltyPointsSection({ customerId, total, onPointsUse }: LoyaltyPointsSectionProps) {
  const { points } = useLoyalty(customerId);
  const [pointsToUse, setPointsToUse] = useState(0);
  
  // Each point is worth KSh 1
  const maxPoints = Math.min(points, Math.floor(total));

  const handlePointsChange = (value: string) => {
    const numPoints = Math.min(Number(value) || 0, maxPoints);
    setPointsToUse(numPoints);
    onPointsUse(numPoints);
  };

  if (!customerId || points === 0) {
    return null;
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex justify-between text-sm">
        <span>Available Points:</span>
        <span>{points} points (KSh {points})</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="points">Use Points</Label>
        <Input
          id="points"
          type="number"
          min="0"
          max={maxPoints}
          value={pointsToUse}
          onChange={(e) => handlePointsChange(e.target.value)}
        />
        {pointsToUse > 0 && (
          <div className="text-sm text-muted-foreground">
            Discount: KSh {pointsToUse}
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handlePointsChange(maxPoints.toString())}
      >
        Use Maximum Points
      </Button>
    </div>
  );
}
