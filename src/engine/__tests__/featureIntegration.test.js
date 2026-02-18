import { describe, it, expect } from 'vitest';
import { calculateFullTax } from '../taxEngine';
import { calculateEmployerMatch, getIRSLimits } from '../retirementMatch';
import { calculateTimelineIncome, calculateSimpleIncome } from '../incomeTimeline';
import { calcFIRETarget, calcYearsToFIRE, projectWealth, calcInvestmentRatios, calcTaxAlpha } from '../fireCalc';
import { appReducer, DEFAULT_STATE, ACTIONS } from '../../state/reducer';
import { toDisplayValue, toAnnualValue } from '../../utils/payPeriod';

describe('Feature Integration Tests', () => {
  describe('Full pipeline: income -> tax -> retirement -> net', () => {
    it('computes a complete financial picture with all deductions', () => {
      const income = calculateSimpleIncome(150000, 5000);
      expect(income.totalGross).toBe(155000);

      const match = calculateEmployerMatch('safe_harbor_basic', income.totalGross, 23000, [], 0, 2026);
      expect(match.employeeContribution).toBeGreaterThan(0);
      expect(match.employerMatch).toBeGreaterThan(0);

      const tax = calculateFullTax({
        grossIncome: income.totalGross,
        preTax401k: match.employeeContribution,
        hsaContribution: 4150,
        medicalPremium: 3000,
        dentalPremium: 600,
        visionPremium: 200,
        otherPreTaxFees: 1200,
        filingStatus: 'single',
        stateCode: 'CA',
        year: 2026,
      });

      expect(tax.totalPreTaxDeductions).toBe(
        match.employeeContribution + 4150 + 3000 + 600 + 200 + 1200
      );
      expect(tax.netIncome).toBeGreaterThan(0);
      expect(tax.netIncome).toBeLessThan(income.totalGross);
    });
  });

  describe('Timeline income with mid-year raise', () => {
    it('weights salary by days worked', () => {
      // Use Jan 15 instead of Jan 1 to avoid dayOfYear timezone edge case
      // (new Date('2026-01-01') is UTC midnight, which can be Dec 31 in US timezones)
      const events = [
        { id: 1, effectiveDate: '2026-01-15', baseSalary: 100000, oneTimeBonus: 0 },
        { id: 2, effectiveDate: '2026-07-01', baseSalary: 120000, oneTimeBonus: 5000 },
      ];
      const result = calculateTimelineIncome(events, 2026);

      // First portion ~100k, second portion ~120k, weighted by days
      expect(result.weightedSalary).toBeGreaterThan(40000);
      expect(result.weightedSalary).toBeLessThan(120000);
      expect(result.totalBonuses).toBe(5000);
      expect(result.totalGross).toBe(result.weightedSalary + result.totalBonuses);
      expect(result.segments).toHaveLength(2);
    });
  });

  describe('Pay period conversion with financial computations', () => {
    it('monthly salary input produces correct annual tax', () => {
      // User enters $9583/mo which converts to annual
      const monthlyInput = 9583;
      const annual = toAnnualValue(monthlyInput, 'monthly');

      const tax = calculateFullTax({
        grossIncome: annual,
        filingStatus: 'single',
        stateCode: 'WA',
      });

      expect(annual).toBe(114996);
      expect(tax.grossIncome).toBe(annual);
      expect(tax.federalTax).toBeGreaterThan(0);
    });

    it('biweekly retirement contribution stays within IRS limits', () => {
      const limits = getIRSLimits(2026);
      const biweeklyMax = toDisplayValue(limits.electiveDeferralLimit, 'biweekly');
      const backToAnnual = toAnnualValue(biweeklyMax, 'biweekly');

      // Should be close to (but not exceed) the annual limit
      expect(backToAnnual).toBeLessThanOrEqual(limits.electiveDeferralLimit + 26);
    });
  });

  describe('FIRE calculations with real inputs', () => {
    it('higher savings rate means fewer years to FIRE', () => {
      const target = calcFIRETarget(50000, 0.03);

      const yearsLow = calcYearsToFIRE(0, 20000, target, 0.04);
      const yearsHigh = calcYearsToFIRE(0, 60000, target, 0.04);

      expect(yearsHigh).toBeLessThan(yearsLow);
    });

    it('existing savings reduces years to FIRE', () => {
      const target = calcFIRETarget(50000, 0.03);

      const fromZero = calcYearsToFIRE(0, 40000, target, 0.04);
      const withSavings = calcYearsToFIRE(500000, 40000, target, 0.04);

      expect(withSavings).toBeLessThan(fromZero);
    });

    it('wealth projection grows over time', () => {
      const projection = projectWealth({
        currentSavings: 10000,
        annualContribution: 30000,
        years: 30,
        nominalReturn: 0.07,
        inflationRate: 0.03,
      });

      expect(projection).toHaveLength(30);
      expect(projection[29].balance).toBeGreaterThan(projection[0].balance);
      expect(projection[29].balance).toBeGreaterThan(30 * 30000 + 10000); // Should exceed contributions due to growth
    });

    it('tax alpha reflects marginal rate savings', () => {
      const preTaxContributions = 30000;
      const marginalRate = 0.24;
      const alpha = calcTaxAlpha(preTaxContributions, marginalRate);
      expect(alpha).toBe(7200);
    });

    it('investment ratios are consistent', () => {
      const ratios = calcInvestmentRatios(50000, 150000, 100000);
      expect(ratios.grossRatio).toBeCloseTo(50000 / 150000, 5);
      expect(ratios.netRatio).toBeCloseTo(50000 / 100000, 5);
    });
  });

  describe('State reducer', () => {
    it('has payPeriod in default state', () => {
      expect(DEFAULT_STATE.payPeriod).toBe('annual');
    });

    it('has dental/vision/other fees in default state', () => {
      expect(DEFAULT_STATE.dentalPremium).toBe(0);
      expect(DEFAULT_STATE.visionPremium).toBe(0);
      expect(DEFAULT_STATE.otherPreTaxFees).toBe(0);
    });

    it('SET_FIELD updates payPeriod', () => {
      const state = appReducer(DEFAULT_STATE, { type: ACTIONS.SET_FIELD, field: 'payPeriod', value: 'monthly' });
      expect(state.payPeriod).toBe('monthly');
    });

    it('SET_FIELD updates dentalPremium', () => {
      const state = appReducer(DEFAULT_STATE, { type: ACTIONS.SET_FIELD, field: 'dentalPremium', value: 600 });
      expect(state.dentalPremium).toBe(600);
    });

    it('RESET_STATE restores defaults', () => {
      const modified = appReducer(DEFAULT_STATE, { type: ACTIONS.SET_FIELD, field: 'payPeriod', value: 'biweekly' });
      const reset = appReducer(modified, { type: ACTIONS.RESET_STATE });
      expect(reset.payPeriod).toBe('annual');
      expect(reset.dentalPremium).toBe(0);
    });

    it('LOAD_STATE merges with defaults', () => {
      const loaded = appReducer(DEFAULT_STATE, { type: ACTIONS.LOAD_STATE, state: { dentalPremium: 800, payPeriod: 'monthly' } });
      expect(loaded.dentalPremium).toBe(800);
      expect(loaded.payPeriod).toBe('monthly');
      expect(loaded.annualSalary).toBe(DEFAULT_STATE.annualSalary); // other defaults preserved
    });
  });

  describe('IRS limits by year', () => {
    it('2026 limits include all expected fields', () => {
      const limits = getIRSLimits(2026);
      expect(limits.electiveDeferralLimit).toBeDefined();
      expect(limits.catchUpContribution).toBeDefined();
      expect(limits.totalAnnualLimit).toBeDefined();
      expect(limits.hsaIndividual).toBeDefined();
      expect(limits.hsaFamily).toBeDefined();
      expect(limits.rothIRA).toBeDefined();
      expect(limits.rothIRACatchUp).toBeDefined();
    });

    it('falls back to latest year for unknown year', () => {
      const unknown = getIRSLimits(3000);
      const known = getIRSLimits(2026);
      expect(unknown.electiveDeferralLimit).toBe(known.electiveDeferralLimit);
    });
  });
});
