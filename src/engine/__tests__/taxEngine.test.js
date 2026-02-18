import { describe, it, expect } from 'vitest';
import { calculateFullTax, calcProgressiveTax, calcFICA, calcStateTax, getTaxParameters, SS_WAGE_BASE_2026 } from '../taxEngine';

describe('Tax Engine', () => {
  describe('calculateFullTax', () => {
    it('calculates basic tax with minimal inputs', () => {
      const result = calculateFullTax({
        grossIncome: 100000,
        filingStatus: 'single',
        stateCode: 'WA',
      });
      expect(result.grossIncome).toBe(100000);
      expect(result.totalPreTaxDeductions).toBe(0);
      expect(result.adjustedGross).toBe(100000);
      expect(result.federalTax).toBeGreaterThan(0);
      expect(result.stateTax).toBe(0); // WA has no state tax
      expect(result.netIncome).toBeLessThan(100000);
    });

    it('includes dental/vision/otherPreTaxFees in deductions', () => {
      const base = calculateFullTax({
        grossIncome: 100000,
        filingStatus: 'single',
        stateCode: 'WA',
      });

      const withFees = calculateFullTax({
        grossIncome: 100000,
        dentalPremium: 600,
        visionPremium: 200,
        otherPreTaxFees: 1200,
        filingStatus: 'single',
        stateCode: 'WA',
      });

      expect(withFees.totalPreTaxDeductions).toBe(2000);
      expect(withFees.adjustedGross).toBe(98000);
      expect(withFees.federalTax).toBeLessThan(base.federalTax);
      expect(withFees.federalTaxableIncome).toBeLessThan(base.federalTaxableIncome);
    });

    it('dental/vision fees combine with medical and HSA', () => {
      const result = calculateFullTax({
        grossIncome: 150000,
        medicalPremium: 3000,
        hsaContribution: 4000,
        dentalPremium: 600,
        visionPremium: 200,
        otherPreTaxFees: 500,
        filingStatus: 'single',
        stateCode: 'WA',
      });

      expect(result.totalPreTaxDeductions).toBe(8300);
      expect(result.adjustedGross).toBe(141700);
    });

    it('handles MFJ filing status', () => {
      const single = calculateFullTax({
        grossIncome: 200000,
        filingStatus: 'single',
        stateCode: 'WA',
      });

      // Uses 'mfj' alias which maps to 'married_joint' in tax_data.json
      const mfj = calculateFullTax({
        grossIncome: 200000,
        filingStatus: 'mfj',
        stateCode: 'WA',
      });

      // MFJ should have lower tax due to wider brackets and higher deduction
      expect(mfj.federalTax).toBeLessThan(single.federalTax);
      expect(mfj.standardDeduction).toBeGreaterThan(single.standardDeduction);
    });

    it('married_joint and mfj produce identical results', () => {
      const mfj = calculateFullTax({
        grossIncome: 200000,
        filingStatus: 'mfj',
        stateCode: 'WA',
      });

      const marriedJoint = calculateFullTax({
        grossIncome: 200000,
        filingStatus: 'married_joint',
        stateCode: 'WA',
      });

      expect(mfj.federalTax).toBe(marriedJoint.federalTax);
      expect(mfj.standardDeduction).toBe(marriedJoint.standardDeduction);
    });

    it('computes FICA correctly', () => {
      const result = calculateFullTax({
        grossIncome: 150000,
        filingStatus: 'single',
        stateCode: 'WA',
      });

      expect(result.fica.socialSecurity).toBeGreaterThan(0);
      expect(result.fica.medicare).toBeGreaterThan(0);
      expect(result.fica.total).toBe(
        result.fica.socialSecurity + result.fica.medicare + result.fica.additionalMedicare
      );
    });

    it('applies state tax for non-zero-tax states', () => {
      const result = calculateFullTax({
        grossIncome: 100000,
        filingStatus: 'single',
        stateCode: 'CA',
      });

      expect(result.stateTax).toBeGreaterThan(0);
    });

    it('applies state tax override when provided', () => {
      const result = calculateFullTax({
        grossIncome: 100000,
        filingStatus: 'single',
        stateCode: 'CA',
        stateOverrideRate: 0.05,
      });

      // stateOverrideRate applies to adjustedGross (which equals grossIncome with no deductions)
      expect(result.stateTax).toBe(100000 * 0.05);
    });

    it('returns correct net income', () => {
      const result = calculateFullTax({
        grossIncome: 100000,
        preTax401k: 10000,
        hsaContribution: 3000,
        medicalPremium: 2000,
        dentalPremium: 500,
        filingStatus: 'single',
        stateCode: 'WA',
      });

      expect(result.netIncome).toBe(
        result.grossIncome - result.totalTax - result.totalPreTaxDeductions
      );
    });

    it('marginal rate is higher for higher income', () => {
      const low = calculateFullTax({ grossIncome: 50000, filingStatus: 'single', stateCode: 'WA' });
      const high = calculateFullTax({ grossIncome: 500000, filingStatus: 'single', stateCode: 'WA' });

      expect(high.marginalRate).toBeGreaterThan(low.marginalRate);
    });
  });

  describe('calcProgressiveTax', () => {
    it('returns 0 for 0 income', () => {
      const brackets = [{ min: 0, max: 10000, rate: 0.1 }, { min: 10000, max: Infinity, rate: 0.2 }];
      expect(calcProgressiveTax(0, brackets)).toBe(0);
    });

    it('computes tax within a single bracket', () => {
      const brackets = [{ min: 0, max: 10000, rate: 0.1 }, { min: 10000, max: Infinity, rate: 0.2 }];
      expect(calcProgressiveTax(5000, brackets)).toBe(500);
    });

    it('computes tax across multiple brackets', () => {
      const brackets = [{ min: 0, max: 10000, rate: 0.1 }, { min: 10000, max: Infinity, rate: 0.2 }];
      expect(calcProgressiveTax(15000, brackets)).toBe(1000 + 1000); // 10000*0.1 + 5000*0.2
    });
  });

  describe('calcFICA', () => {
    it('computes SS and Medicare', () => {
      const result = calcFICA(100000);
      expect(result.socialSecurity).toBeGreaterThan(0);
      expect(result.medicare).toBeGreaterThan(0);
      expect(result.total).toBe(result.socialSecurity + result.medicare + result.additionalMedicare);
    });

    it('caps Social Security at wage base', () => {
      const lowIncome = calcFICA(50000);
      const highIncome = calcFICA(500000);
      // SS should cap at the wage base — use the exported constant
      expect(highIncome.socialSecurity).toBe(
        lowIncome.socialSecurity / 50000 * Math.min(500000, SS_WAGE_BASE_2026)
      );
    });

    it('applies additional Medicare above threshold', () => {
      const belowThreshold = calcFICA(150000, 'single');
      const aboveThreshold = calcFICA(250000, 'single');
      expect(belowThreshold.additionalMedicare).toBe(0);
      expect(aboveThreshold.additionalMedicare).toBeGreaterThan(0);
    });
  });

  describe('calcStateTax', () => {
    it('returns 0 for no-tax states', () => {
      expect(calcStateTax(100000, 'WA')).toBe(0);
      expect(calcStateTax(100000, 'TX')).toBe(0);
      expect(calcStateTax(100000, 'FL')).toBe(0);
    });

    it('returns flat rate for flat-tax states', () => {
      const tax = calcStateTax(100000, 'IL');
      expect(tax).toBeCloseTo(100000 * 0.0495, 0);
    });

    it('computes progressive tax for progressive states', () => {
      const tax = calcStateTax(100000, 'CA');
      expect(tax).toBeGreaterThan(0);
    });
  });

  describe('getTaxParameters', () => {
    it('returns parameters for valid year', () => {
      const params = getTaxParameters(2026);
      expect(params.year).toBe('2026');
      expect(params.brackets).toBeDefined();
      expect(params.standardDeduction).toBeDefined();
      expect(params.ssWageBase).toBeGreaterThan(0);
    });

    it('falls back to latest year for invalid year', () => {
      const params = getTaxParameters(9999);
      expect(params.year).toBeDefined();
      expect(params.brackets).toBeDefined();
    });
  });
});
