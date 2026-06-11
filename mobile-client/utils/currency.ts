/**
 * Format an amount in Kenyan Shillings, matching the web client's
 * formatCurrency output ("KSh 1,234.00"). Accepts strings because the
 * API serializes DECIMAL columns as strings. Grouping is done manually
 * so the output is identical regardless of the device's Intl support.
 */
export function formatCurrency(amount: string | number | null | undefined): string {
    if (amount === null || amount === undefined) return 'KSh 0.00';

    const num = typeof amount === 'string'
        ? parseFloat(amount.replace(/[^\d.-]/g, ''))
        : Number(amount);
    if (!isFinite(num)) return 'KSh 0.00';

    const [int, dec] = Math.abs(num).toFixed(2).split('.');
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `KSh ${num < 0 ? '-' : ''}${grouped}.${dec}`;
}
