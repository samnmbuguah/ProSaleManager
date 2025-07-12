import { z } from 'zod'

export const loyaltyPointsSchema = z.object({
  customer_id: z.number(),
  sale_id: z.number().nullable(),
  points: z.string()
})

export type LoyaltyPointsFormData = z.infer<typeof loyaltyPointsSchema>;

export interface LoyaltyPoints extends Omit<LoyaltyPointsFormData, 'points'> {
  id: number;
  points: number;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface LoyaltyStats {
  totalPoints: number;
  averagePoints: number;
  totalCustomers: number;
}
