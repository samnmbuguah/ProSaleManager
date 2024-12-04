import { useQuery } from "@tanstack/react-query";
import type { Customer } from "@db/schema";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Crown, Award, Medal } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface LoyaltyCardProps {
  customer: Customer;
  onPointsRedeemed?: () => void;
}

export function LoyaltyCard({ customer, onPointsRedeemed }: LoyaltyCardProps) {
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState("");
  const { toast } = useToast();

  const { data: loyaltyInfo } = useQuery({
    queryKey: ["loyalty", customer.id],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customer.id}/loyalty`);
      if (!response.ok) {
        throw new Error("Failed to fetch loyalty info");
      }
      return response.json();
    },
  });

  const handleRedeem = async () => {
    try {
      const points = parseInt(pointsToRedeem);
      if (isNaN(points) || points <= 0) {
        toast({
          variant: "destructive",
          title: "Invalid points",
          description: "Please enter a valid number of points to redeem",
        });
        return;
      }

      const response = await fetch(`/api/customers/${customer.id}/redeem-points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pointsToRedeem: points }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const result = await response.json();
      toast({
        title: "Points Redeemed",
        description: `Successfully redeemed ${points} points for KSh ${result.discountAmount} discount`,
      });
      setIsRedeemOpen(false);
      setPointsToRedeem("");
      onPointsRedeemed?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to redeem points",
      });
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "gold":
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case "silver":
        return <Award className="h-6 w-6 text-gray-400" />;
      default:
        return <Medal className="h-6 w-6 text-amber-700" />;
    }
  };

  if (!loyaltyInfo) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Loyalty Program</CardTitle>
              <CardDescription>
                Current Tier: {loyaltyInfo.tier.charAt(0).toUpperCase() + loyaltyInfo.tier.slice(1)}
              </CardDescription>
            </div>
            {getTierIcon(loyaltyInfo.tier)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold">{loyaltyInfo.points}</p>
              <p className="text-sm text-muted-foreground">Points Available</p>
            </div>
            
            {loyaltyInfo.nextTier && (
              <div>
                <p className="text-sm">
                  {loyaltyInfo.nextTier.pointsNeeded} more points until {loyaltyInfo.nextTier.name} tier
                </p>
                <div className="mt-2 h-2 rounded-full bg-secondary">
                  <div 
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ 
                      width: `${(loyaltyInfo.points / (loyaltyInfo.nextTier.name === "silver" ? 5000 : 10000)) * 100}%` 
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">
                Earning {loyaltyInfo.multiplier}x points on purchases
              </p>
            </div>

            <Button 
              className="w-full" 
              onClick={() => setIsRedeemOpen(true)}
              disabled={loyaltyInfo.points < 100}
            >
              Redeem Points
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Points</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Available Points: {loyaltyInfo.points}
              </p>
              <p className="text-sm text-muted-foreground">
                10 points = KSh 1 discount
              </p>
            </div>
            <Input
              type="number"
              placeholder="Enter points to redeem"
              value={pointsToRedeem}
              onChange={(e) => setPointsToRedeem(e.target.value)}
              min={100}
              max={loyaltyInfo.points}
              step={100}
            />
            <Button onClick={handleRedeem} className="w-full">
              Redeem for KSh {(parseInt(pointsToRedeem) || 0) / 10} discount
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
