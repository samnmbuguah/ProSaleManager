import { describe, it, expect } from 'vitest'
import { formatCurrency } from '../formatters'

describe('formatCurrency', () => {
  it('should format a number as currency', () => {
    expect(formatCurrency(100)).toBe('KSh 100.00')
    expect(formatCurrency(99.99)).toBe('KSh 99.99')
    expect(formatCurrency(0)).toBe('KSh 0.00')
  })
})
