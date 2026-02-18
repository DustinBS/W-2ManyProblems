/**
 * Pay period conversion utilities
 * All internal state values are stored as annual amounts.
 * The display layer converts to/from the selected pay period.
 */

export const PAY_PERIODS = {
  annual: { label: 'Annual', divisor: 1 },
  monthly: { label: 'Monthly', divisor: 12 },
  biweekly: { label: 'Biweekly', divisor: 26 },
};

export const PAY_PERIOD_OPTIONS = Object.entries(PAY_PERIODS).map(([value, p]) => ({
  value,
  label: p.label,
}));

/**
 * Convert an annual value to the display value for a given period
 */
export function toDisplayValue(annualValue, period = 'annual') {
  const p = PAY_PERIODS[period];
  if (!p || p.divisor === 1) return annualValue;
  return Math.round(annualValue / p.divisor);
}

/**
 * Convert a display value back to annual
 */
export function toAnnualValue(displayValue, period = 'annual') {
  const p = PAY_PERIODS[period];
  if (!p || p.divisor === 1) return displayValue;
  return Math.round(displayValue * p.divisor);
}

/**
 * Get a suffix label for the current period
 */
export function periodSuffix(period = 'annual') {
  if (period === 'monthly') return '/mo';
  if (period === 'biweekly') return '/2wk';
  return '/yr';
}
