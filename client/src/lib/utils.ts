import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: string | number | null | undefined) {
  if (amount === null || amount === undefined) {
    return 'KSh 0.00';
  }
  
  let numAmount = 0;
  try {
    if (typeof amount === 'string') {
      numAmount = parseFloat(amount) || 0;
    } else {
      numAmount = amount;
    }

    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount).replace('KES', 'KSh');
  } catch (error) {
    console.error('Currency formatting error:', error);
    return 'KSh 0.00';
  }
}
