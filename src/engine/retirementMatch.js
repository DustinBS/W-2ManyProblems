/**
 * 401k/403b Employer Matching Templates
 *
 * Each template defines how an employer matches employee contributions.
 * The engine calculates the employer match based on the employee's contribution
 * as a percentage of their gross salary.
 */

// 2026 IRS limits (estimated)
export const IRS_LIMITS_2026 = {
  electiveDeferralLimit: 23500, // 401k/403b employee max
  catchUpContribution: 7500, // age 50+
  superCatchUp: 11250, // age 60-63 (SECURE 2.0)
  totalAnnualLimit: 70000, // 415(c) total limit (employee + employer)
  hsaIndividual: 4300,
  hsaFamily: 8550,
  rothIRA: 7000,
  rothIRACatchUp: 1000,
};

export const MATCHING_TEMPLATES = [
  {
    id: 'safe_harbor_basic',
    name: 'Safe Harbor Basic',
    description: '100% match on first 3%, plus 50% match on next 2%',
    tiers: [
      { matchRate: 1.0, upToPercent: 3 },
      { matchRate: 0.5, upToPercent: 5 },
    ],
  },
  {
    id: 'safe_harbor_enhanced',
    name: 'Safe Harbor Enhanced',
    description: '100% match on first 4%',
    tiers: [
      { matchRate: 1.0, upToPercent: 4 },
    ],
  },
  {
    id: 'safe_harbor_stretch',
    name: 'Safe Harbor Stretch',
    description: '100% match on first 6%',
    tiers: [
      { matchRate: 1.0, upToPercent: 6 },
    ],
  },
  {
    id: 'faang_standard',
    name: 'FAANG Standard',
    description: '50% match up to IRS elective deferral limit (~$11,750 max match)',
    tiers: [
      { matchRate: 0.5, upToPercent: 100, maxMatchDollars: 11750 },
    ],
  },
  {
    id: 'big_tech_generous',
    name: 'Big Tech Generous',
    description: '100% match on first 4%, plus 50% match on next 4%',
    tiers: [
      { matchRate: 1.0, upToPercent: 4 },
      { matchRate: 0.5, upToPercent: 8 },
    ],
  },
  {
    id: 'flat_nonelective_3',
    name: 'Flat Non-Elective 3%',
    description: 'Employer contributes 3% regardless of employee contributions',
    tiers: [],
    flatContributionPercent: 3,
  },
  {
    id: 'flat_nonelective_5',
    name: 'Flat Non-Elective 5%',
    description: 'Employer contributes 5% regardless of employee contributions',
    tiers: [],
    flatContributionPercent: 5,
  },
  {
    id: 'dollar_for_dollar_6',
    name: 'Dollar-for-Dollar up to 6%',
    description: '100% match on first 6% of salary',
    tiers: [
      { matchRate: 1.0, upToPercent: 6 },
    ],
  },
  {
    id: 'tiered_50_6',
    name: 'Tiered 50% up to 6%',
    description: '50% match on first 6% of salary',
    tiers: [
      { matchRate: 0.5, upToPercent: 6 },
    ],
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Define your own matching formula',
    tiers: [],
  },
];

/**
 * Calculate employer match based on template and employee contribution
 *
 * @param {string} templateId - ID of the matching template
 * @param {number} grossSalary - Annual gross salary
 * @param {number} employeeContribution - Employee's annual 401k contribution (dollars)
 * @param {Array} customTiers - Custom tiers if templateId is 'custom'
 * @param {number} customFlatPercent - Custom flat contribution % if applicable
 * @returns {{ employerMatch: number, employeeContribution: number, totalRetirement: number, matchDetails: string }}
 */
export function calculateEmployerMatch(templateId, grossSalary, employeeContribution, customTiers = [], customFlatPercent = 0) {
  const template = MATCHING_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    return {
      employerMatch: 0,
      employeeContribution,
      totalRetirement: employeeContribution,
      matchDetails: 'No template found',
    };
  }

  // Cap employee contribution at IRS limit
  const cappedContribution = Math.min(employeeContribution, IRS_LIMITS_2026.electiveDeferralLimit);
  const employeePercent = grossSalary > 0 ? (cappedContribution / grossSalary) * 100 : 0;

  let employerMatch = 0;

  // Flat non-elective contribution
  const flatPercent = template.flatContributionPercent || customFlatPercent;
  if (flatPercent > 0) {
    employerMatch += grossSalary * (flatPercent / 100);
  }

  // Tiered matching
  const tiers = templateId === 'custom' ? customTiers : template.tiers;
  let prevPercent = 0;
  for (const tier of tiers) {
    // How much of the employee's contribution falls in this tier
    const tierRangePercent = tier.upToPercent - prevPercent;
    const employeeInTier = Math.max(0, Math.min(employeePercent - prevPercent, tierRangePercent));
    let tierMatch = (employeeInTier / 100) * grossSalary * tier.matchRate;

    // Cap by maxMatchDollars if specified
     if (tier.maxMatchDollars) {
       tierMatch = Math.min(tierMatch, tier.maxMatchDollars);
     }
 
     employerMatch += tierMatch;
     prevPercent = tier.upToPercent || 100; // default to 100% (no percent limit) if not set
   }

  // Cap total employer + employee at the IRS 415(c) limit
  const totalRetirement = Math.min(
    cappedContribution + employerMatch,
    IRS_LIMITS_2026.totalAnnualLimit
  );
  employerMatch = totalRetirement - cappedContribution;

  return {
    employerMatch: Math.max(0, employerMatch),
    employeeContribution: cappedContribution,
    totalRetirement,
    matchDetails: template.description,
  };
}

/**
 * Get template by ID
 */
export function getMatchTemplate(templateId) {
  return MATCHING_TEMPLATES.find((t) => t.id === templateId) || MATCHING_TEMPLATES[0];
}
