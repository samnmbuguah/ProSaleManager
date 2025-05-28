import { useState, useEffect } from "react";
import { useLoyalty } from "@/hooks/use-loyalty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoyaltyPointsSectionProps {
  customerId?: number;
  total: number;
  onPointsUse: (points: number) => void;
}

export function LoyaltyPointsSection({
  customerId,
  total,
  onPointsUse,
}: LoyaltyPointsSectionProps) {
  const { points, fetchPoints } = useLoyalty();
  const [pointsToUse, setPointsToUse] = useState(0);

  useEffect(() => {
    if (customerId) {
      fetchPoints(customerId);
    }
  }, [customerId, fetchPoints]);

  // Each point is worth $1
  const maxPoints = points?.points
    ? Math.min(points.points, Math.floor(total))
    : 0;

  const handlePointsChange = (value: string) => {
    const numPoints = Number(value);
    if (isNaN(numPoints) || numPoints < 0) {
      setPointsToUse(0);
    } else if (numPoints > maxPoints) {
      setPointsToUse(maxPoints);
    } else {
      setPointsToUse(numPoints);
    }
  };

  const handleApplyPoints = () => {
    onPointsUse(pointsToUse);
  };

  if (!customerId || !points) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Available Points: {points.points}</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            min={0}
            max={maxPoints}
            value={pointsToUse}
            onChange={(e) => handlePointsChange(e.target.value)}
          />
          <Button onClick={handleApplyPoints}>Apply Points</Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {pointsToUse > 0 &&
            `This will reduce the total by KSh ${pointsToUse.toLocaleString("en-KE")}`}
        </p>
      </div>
    </div>
  );
}
