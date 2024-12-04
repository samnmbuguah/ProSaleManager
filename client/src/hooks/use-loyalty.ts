import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LoyaltyPoints, LoyaltyTransaction } from "@db/schema";
import { useToast } from "@/hooks/use-toast";

export function useLoyalty(customerId?: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: points } = useQuery<LoyaltyPoints>({
    queryKey: ["loyalty-points", customerId],
    queryFn: async () => {
      if (!customerId) return null;
      const response = await fetch(`/api/customers/${customerId}/loyalty`);
      if (!response.ok) throw new Error("Failed to fetch loyalty points");
      return response.json();
    },
    enabled: !!customerId,
  });

  const { data: transactions } = useQuery<LoyaltyTransaction[]>({
    queryKey: ["loyalty-transactions", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const response = await fetch(`/api/customers/${customerId}/loyalty/transactions`);
      if (!response.ok) throw new Error("Failed to fetch loyalty transactions");
      return response.json();
    },
    enabled: !!customerId,
  });

  return {
    points: points?.points || 0,
    transactions: transactions || [],
  };
}
