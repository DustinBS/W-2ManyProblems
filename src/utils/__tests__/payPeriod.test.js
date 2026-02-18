import { describe, it, expect } from 'vitest';
import { toDisplayValue, toAnnualValue, periodSuffix, PAY_PERIODS } from '../payPeriod';

describe('Pay Period Conversions', () => {
  describe('toDisplayValue', () => {
    it('returns annual value unchanged for annual period', () => {
      expect(toDisplayValue(120000, 'annual')).toBe(120000);
    });

    it('converts annual to monthly (divides by 12)', () => {
      expect(toDisplayValue(120000, 'monthly')).toBe(10000);
    });

    it('converts annual to biweekly (divides by 26)', () => {
      expect(toDisplayValue(52000, 'biweekly')).toBe(2000);
    });

    it('rounds to nearest dollar for monthly', () => {
      expect(toDisplayValue(100000, 'monthly')).toBe(8333);
    });

    it('rounds to nearest dollar for biweekly', () => {
      expect(toDisplayValue(100000, 'biweekly')).toBe(3846);
    });

    it('handles zero', () => {
      expect(toDisplayValue(0, 'monthly')).toBe(0);
      expect(toDisplayValue(0, 'biweekly')).toBe(0);
    });

    it('defaults to annual when period is null/undefined', () => {
      expect(toDisplayValue(50000)).toBe(50000);
      expect(toDisplayValue(50000, undefined)).toBe(50000);
    });
  });

  describe('toAnnualValue', () => {
    it('returns value unchanged for annual period', () => {
      expect(toAnnualValue(120000, 'annual')).toBe(120000);
    });

    it('converts monthly to annual (multiplies by 12)', () => {
      expect(toAnnualValue(10000, 'monthly')).toBe(120000);
    });

    it('converts biweekly to annual (multiplies by 26)', () => {
      expect(toAnnualValue(2000, 'biweekly')).toBe(52000);
    });

    it('round-trips approximately for monthly', () => {
      const annual = 115000;
      const monthly = toDisplayValue(annual, 'monthly');
      const backToAnnual = toAnnualValue(monthly, 'monthly');
      // Allow rounding tolerance
      expect(Math.abs(backToAnnual - annual)).toBeLessThan(12);
    });

    it('round-trips approximately for biweekly', () => {
      const annual = 115000;
      const biweekly = toDisplayValue(annual, 'biweekly');
      const backToAnnual = toAnnualValue(biweekly, 'biweekly');
      expect(Math.abs(backToAnnual - annual)).toBeLessThan(26);
    });
  });

  describe('periodSuffix', () => {
    it('returns /yr for annual', () => {
      expect(periodSuffix('annual')).toBe('/yr');
    });

    it('returns /mo for monthly', () => {
      expect(periodSuffix('monthly')).toBe('/mo');
    });

    it('returns /2wk for biweekly', () => {
      expect(periodSuffix('biweekly')).toBe('/2wk');
    });
  });

  describe('PAY_PERIODS', () => {
    it('has exactly 3 periods', () => {
      expect(Object.keys(PAY_PERIODS)).toHaveLength(3);
    });

    it('annual divisor is 1', () => {
      expect(PAY_PERIODS.annual.divisor).toBe(1);
    });

    it('monthly divisor is 12', () => {
      expect(PAY_PERIODS.monthly.divisor).toBe(12);
    });

    it('biweekly divisor is 26', () => {
      expect(PAY_PERIODS.biweekly.divisor).toBe(26);
    });
  });
});
