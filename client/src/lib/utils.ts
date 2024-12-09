import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: string | number | null | undefined) {
  if (amount === null || amount === undefined) {
    return 'KSh 0.00';
  }
  
  let numAmount: number;
  if (typeof amount === 'string') {
    numAmount = parseFloat(amount) || 0;
  } else {
    numAmount = amount || 0;
  }

  try {
    return `KSh ${numAmount.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } catch (error) {
    console.error('Currency formatting error:', error);
    return 'KSh 0.00';
  }
}
