import { describe, it, expect } from 'vitest';
import { getIRSLimits } from '../retirementMatch';
import irsLimitsData from '../../data/irs_limits.json';

/*──────────────────────────────────────────────────────────
 * IRS Contribution Limit Regression Tests
 *
 * Ground-truth values sourced from:
 *   - IRS Notice 2023-75 (2024 limits)
 *   - IRS Notice 2024-80 (2025 limits)
 *   - IRS Notice 2025-XX (2026 limits)
 *──────────────────────────────────────────────────────────*/

// These are the correct IRS-published values.
// If the JSON drifts, these tests will catch it.
const EXPECTED = {
  2024: {
    electiveDeferralLimit: 23000,
    catchUpContribution: 7500,
    superCatchUp: 11250,
    totalAnnualLimit: 69000,
    hsaIndividual: 4150,
    hsaFamily: 8300,
    rothIRA: 7000,
    rothIRACatchUp: 1000,
  },
  2025: {
    electiveDeferralLimit: 23500,
    catchUpContribution: 7500,
    superCatchUp: 11250,
    totalAnnualLimit: 70000,
    hsaIndividual: 4300,
    hsaFamily: 8550,
    rothIRA: 7000,
    rothIRACatchUp: 1000,
  },
  2026: {
    electiveDeferralLimit: 24500,
    catchUpContribution: 8000,
    superCatchUp: 11250,
    totalAnnualLimit: 72000,
    hsaIndividual: 4400,
    hsaFamily: 8750,
    rothIRA: 7500,
    rothIRACatchUp: 1100,
  },
};

describe('irs_limits.json regression', () => {
  for (const [year, expected] of Object.entries(EXPECTED)) {
    describe(`${year}`, () => {
      for (const [key, value] of Object.entries(expected)) {
        it(`${key} = ${value.toLocaleString()}`, () => {
          expect(irsLimitsData[year][key]).toBe(value);
        });
      }
    });
  }
});

describe('getIRSLimits()', () => {
  it('returns correct limits for 2024 (string)', () => {
    const limits = getIRSLimits('2024');
    expect(limits.electiveDeferralLimit).toBe(23000);
    expect(limits.totalAnnualLimit).toBe(69000);
  });

  it('returns correct limits for 2025 (number)', () => {
    const limits = getIRSLimits(2025);
    expect(limits.electiveDeferralLimit).toBe(23500);
    expect(limits.hsaFamily).toBe(8550);
  });

  it('returns correct limits for 2026', () => {
    const limits = getIRSLimits(2026);
    expect(limits.electiveDeferralLimit).toBe(24500);
    expect(limits.catchUpContribution).toBe(8000);
    expect(limits.hsaIndividual).toBe(4400);
    expect(limits.rothIRA).toBe(7500);
  });

  it('falls back to latest year for unknown year', () => {
    const limits = getIRSLimits(2099);
    const latestYear = Object.keys(irsLimitsData).sort((a, b) => b - a)[0];
    expect(limits).toEqual(irsLimitsData[latestYear]);
  });

  it('falls back to latest year when year is null', () => {
    const limits = getIRSLimits(null);
    const latestYear = Object.keys(irsLimitsData).sort((a, b) => b - a)[0];
    expect(limits).toEqual(irsLimitsData[latestYear]);
  });

  it('falls back to latest year when year is undefined', () => {
    const limits = getIRSLimits();
    const latestYear = Object.keys(irsLimitsData).sort((a, b) => b - a)[0];
    expect(limits).toEqual(irsLimitsData[latestYear]);
  });
});
