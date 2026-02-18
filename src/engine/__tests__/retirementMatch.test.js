import { describe, it, expect } from 'vitest';
import { calculateEmployerMatch } from '../retirementMatch';

/*──────────────────────────────────────────────────────────
 * Employer Matching Engine Tests
 *
 * Validates that calculateEmployerMatch:
 *  - Caps employee contributions at the correct year's IRS limit
 *  - Calculates tiered matching correctly
 *  - Caps total retirement at the 415(c) limit
 *  - Uses the right year's limits when year is passed
 *──────────────────────────────────────────────────────────*/

const SALARY = 150_000;

describe('calculateEmployerMatch', () => {
  describe('Safe Harbor Basic (100% on 3%, 50% on 2%)', () => {
    it('calculates match for full 5% contribution', () => {
      const contribution = SALARY * 0.05; // $7,500
      const result = calculateEmployerMatch('safe_harbor_basic', SALARY, contribution);
      // 100% * 3% * $150k = $4,500 + 50% * 2% * $150k = $1,500 = $6,000
      expect(result.employerMatch).toBe(6000);
      expect(result.employeeContribution).toBe(7500);
      expect(result.totalRetirement).toBe(13500);
    });

    it('handles contribution under first tier', () => {
      const contribution = SALARY * 0.02; // $3,000
      const result = calculateEmployerMatch('safe_harbor_basic', SALARY, contribution);
      // 100% * 2% * $150k = $3,000 (only in first tier, not full)
      expect(result.employerMatch).toBe(3000);
    });
  });

  describe('IRS elective deferral cap per year', () => {
    it('caps employee contribution at $24,500 for 2026', () => {
      const overLimit = 30_000;
      const result = calculateEmployerMatch('safe_harbor_basic', SALARY, overLimit, [], 0, 2026);
      expect(result.employeeContribution).toBe(24_500);
    });

    it('caps employee contribution at $23,500 for 2025', () => {
      const overLimit = 30_000;
      const result = calculateEmployerMatch('safe_harbor_basic', SALARY, overLimit, [], 0, 2025);
      expect(result.employeeContribution).toBe(23_500);
    });

    it('caps employee contribution at $23,000 for 2024', () => {
      const overLimit = 30_000;
      const result = calculateEmployerMatch('safe_harbor_basic', SALARY, overLimit, [], 0, 2024);
      expect(result.employeeContribution).toBe(23_000);
    });
  });

  describe('415(c) total annual cap per year', () => {
    it('caps total at $72,000 for 2026', () => {
      // Use a 20% flat contribution on $500k to exceed the cap
      const result = calculateEmployerMatch(
        'custom', 500_000, 24_500,
        [], 20, 2026
      );
      // Flat: 20% of $500k = $100k employer. Total uncapped = $124,500. Capped at $72,000.
      expect(result.totalRetirement).toBe(72_000);
    });

    it('caps total at $70,000 for 2025', () => {
      const result = calculateEmployerMatch(
        'custom', 500_000, 23_500,
        [], 20, 2025
      );
      expect(result.totalRetirement).toBe(70_000);
    });
  });

  describe('custom flat + tiered matching', () => {
    it('adds flat non-elective contribution', () => {
      const result = calculateEmployerMatch(
        'custom', SALARY, 0, [], 3, 2026
      );
      // 3% of $150k = $4,500
      expect(result.employerMatch).toBe(4500);
      expect(result.employeeContribution).toBe(0);
      expect(result.totalRetirement).toBe(4500);
    });
  });

  describe('edge cases', () => {
    it('returns zero match for unknown template', () => {
      const result = calculateEmployerMatch('nonexistent', SALARY, 10000);
      expect(result.employerMatch).toBe(0);
      expect(result.employeeContribution).toBe(10000);
    });

    it('handles zero salary', () => {
      const result = calculateEmployerMatch('safe_harbor_basic', 0, 0);
      expect(result.employerMatch).toBe(0);
      expect(result.totalRetirement).toBe(0);
    });
  });
});
