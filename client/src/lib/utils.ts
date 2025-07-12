import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn (...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency (amount: string | number | null | undefined) {
  if (amount === null || amount === undefined) {
    return 'KSh 0.00'
  }

  try {
    // Convert string to number, removing any non-numeric characters except decimal point
    const numAmount =
      typeof amount === 'string'
        ? parseFloat(amount.replace(/[^\d.-]/g, ''))
        : Number(amount)

    // Check if the conversion resulted in a valid number
    if (isNaN(numAmount)) {
      console.warn('Invalid amount for currency formatting:', amount)
      return 'KSh 0.00'
    }

    return `KSh ${numAmount.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  } catch (error) {
    console.error('Currency formatting error:', error)
    return 'KSh 0.00'
  }
}
