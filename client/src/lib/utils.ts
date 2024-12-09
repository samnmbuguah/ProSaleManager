import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: string | number | null | undefined) {
  if (amount === null || amount === undefined) {
    return 'KSh 0.00';
  }
  
  try {
    const numAmount = typeof amount === 'string' ? 
      parseFloat(amount.replace(/[^\d.-]/g, '')) || 0 : 
      Number(amount) || 0;

    return `KSh ${numAmount.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } catch (error) {
    console.error('Currency formatting error:', error);
    return 'KSh 0.00';
  }
}
