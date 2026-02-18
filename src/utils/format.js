/**
 * Shared formatting utilities
 */

export function fmt(n) {
  if (n === undefined || n === null || isNaN(n)) return '$0';
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function fmtDecimal(n, digits = 2) {
  if (n === undefined || n === null || isNaN(n)) return '$0.00';
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function pct(n, digits = 2) {
  if (n === undefined || n === null || isNaN(n)) return '0%';
  return (n * 100).toFixed(digits) + '%';
}

export function pctInput(n) {
  if (n === undefined || n === null || isNaN(n)) return '0';
  return (n * 100).toFixed(2);
}
