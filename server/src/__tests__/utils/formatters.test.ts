import { formatDate, formatNumber } from '../../utils/formatters.js';

describe('formatDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    const date = new Date('2023-01-15T12:00:00Z');
    expect(formatDate(date)).toBe('2023-01-15');
  });
});

describe('formatNumber', () => {
  it('formats a number with commas for thousands', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1000000)).toBe('1,000,000');
    expect(formatNumber(1234567.89)).toBe('1,234,567.89');
  });
}); 