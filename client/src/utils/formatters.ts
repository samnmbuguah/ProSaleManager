/**
 * Format a number as currency (KSh)
 */
export const formatCurrency = (amount: number): string => {
  return `KSh ${amount.toFixed(2)}`
}
