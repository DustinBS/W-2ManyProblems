// 2026 US Federal Tax Brackets (estimated)
// Source: IRS inflation adjustments projected for 2026

export const FEDERAL_BRACKETS_2026 = {
  single: [
    { min: 0, max: 11925, rate: 0.10 },
    { min: 11925, max: 48475, rate: 0.12 },
    { min: 48475, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250525, rate: 0.32 },
    { min: 250525, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 },
  ],
  mfj: [
    { min: 0, max: 23850, rate: 0.10 },
    { min: 23850, max: 96950, rate: 0.12 },
    { min: 96950, max: 206700, rate: 0.22 },
    { min: 206700, max: 394600, rate: 0.24 },
    { min: 394600, max: 501050, rate: 0.32 },
    { min: 501050, max: 751600, rate: 0.35 },
    { min: 751600, max: Infinity, rate: 0.37 },
  ],
};

export const STANDARD_DEDUCTION_2026 = {
  single: 15000,
  mfj: 30000,
};

// Social Security wage base estimate for 2026
export const SS_WAGE_BASE_2026 = 176100;

// FICA rates
export const FICA_RATES = {
  socialSecurity: 0.062,
  medicare: 0.0145,
  additionalMedicare: 0.009, // applies above $200k single / $250k MFJ
  additionalMedicareThreshold: { single: 200000, mfj: 250000 },
};

// State income tax data for all 50 states + DC
// States with no income tax: AK, FL, NV, NH (dividends/interest only until 2025, fully repealed 2025+), SD, TN (repealed 2021), TX, WA, WY
export const STATE_TAX_DATA = {
  AL: { name: 'Alabama', type: 'progressive', brackets: [{ min: 0, max: 500, rate: 0.02 }, { min: 500, max: 3000, rate: 0.04 }, { min: 3000, max: Infinity, rate: 0.05 }] },
  AK: { name: 'Alaska', type: 'none', rate: 0 },
  AZ: { name: 'Arizona', type: 'flat', rate: 0.025 },
  AR: { name: 'Arkansas', type: 'progressive', brackets: [{ min: 0, max: 4400, rate: 0.02 }, { min: 4400, max: 8800, rate: 0.04 }, { min: 8800, max: Infinity, rate: 0.044 }] },
  CA: { name: 'California', type: 'progressive', brackets: [{ min: 0, max: 10412, rate: 0.01 }, { min: 10412, max: 24684, rate: 0.02 }, { min: 24684, max: 38959, rate: 0.04 }, { min: 38959, max: 54081, rate: 0.06 }, { min: 54081, max: 68350, rate: 0.08 }, { min: 68350, max: 349137, rate: 0.093 }, { min: 349137, max: 418961, rate: 0.103 }, { min: 418961, max: 698271, rate: 0.113 }, { min: 698271, max: 1000000, rate: 0.123 }, { min: 1000000, max: Infinity, rate: 0.133 }] },
  CO: { name: 'Colorado', type: 'flat', rate: 0.044 },
  CT: { name: 'Connecticut', type: 'progressive', brackets: [{ min: 0, max: 10000, rate: 0.03 }, { min: 10000, max: 50000, rate: 0.05 }, { min: 50000, max: 100000, rate: 0.055 }, { min: 100000, max: 200000, rate: 0.06 }, { min: 200000, max: 250000, rate: 0.065 }, { min: 250000, max: 500000, rate: 0.069 }, { min: 500000, max: Infinity, rate: 0.0699 }] },
  DE: { name: 'Delaware', type: 'progressive', brackets: [{ min: 0, max: 2000, rate: 0 }, { min: 2000, max: 5000, rate: 0.022 }, { min: 5000, max: 10000, rate: 0.039 }, { min: 10000, max: 20000, rate: 0.048 }, { min: 20000, max: 25000, rate: 0.052 }, { min: 25000, max: 60000, rate: 0.0555 }, { min: 60000, max: Infinity, rate: 0.066 }] },
  FL: { name: 'Florida', type: 'none', rate: 0 },
  GA: { name: 'Georgia', type: 'flat', rate: 0.0549 },
  HI: { name: 'Hawaii', type: 'progressive', brackets: [{ min: 0, max: 2400, rate: 0.014 }, { min: 2400, max: 4800, rate: 0.032 }, { min: 4800, max: 9600, rate: 0.055 }, { min: 9600, max: 14400, rate: 0.064 }, { min: 14400, max: 19200, rate: 0.068 }, { min: 19200, max: 24000, rate: 0.072 }, { min: 24000, max: 36000, rate: 0.076 }, { min: 36000, max: 48000, rate: 0.079 }, { min: 48000, max: 150000, rate: 0.0825 }, { min: 150000, max: 175000, rate: 0.09 }, { min: 175000, max: 200000, rate: 0.10 }, { min: 200000, max: Infinity, rate: 0.11 }] },
  ID: { name: 'Idaho', type: 'flat', rate: 0.058 },
  IL: { name: 'Illinois', type: 'flat', rate: 0.0495 },
  IN: { name: 'Indiana', type: 'flat', rate: 0.0305 },
  IA: { name: 'Iowa', type: 'flat', rate: 0.038 },
  KS: { name: 'Kansas', type: 'progressive', brackets: [{ min: 0, max: 15000, rate: 0.031 }, { min: 15000, max: 30000, rate: 0.0525 }, { min: 30000, max: Infinity, rate: 0.057 }] },
  KY: { name: 'Kentucky', type: 'flat', rate: 0.04 },
  LA: { name: 'Louisiana', type: 'progressive', brackets: [{ min: 0, max: 12500, rate: 0.0185 }, { min: 12500, max: 50000, rate: 0.035 }, { min: 50000, max: Infinity, rate: 0.0425 }] },
  ME: { name: 'Maine', type: 'progressive', brackets: [{ min: 0, max: 24500, rate: 0.058 }, { min: 24500, max: 58050, rate: 0.0675 }, { min: 58050, max: Infinity, rate: 0.0715 }] },
  MD: { name: 'Maryland', type: 'progressive', brackets: [{ min: 0, max: 1000, rate: 0.02 }, { min: 1000, max: 2000, rate: 0.03 }, { min: 2000, max: 3000, rate: 0.04 }, { min: 3000, max: 100000, rate: 0.0475 }, { min: 100000, max: 125000, rate: 0.05 }, { min: 125000, max: 150000, rate: 0.0525 }, { min: 150000, max: 250000, rate: 0.055 }, { min: 250000, max: Infinity, rate: 0.0575 }] },
  MA: { name: 'Massachusetts', type: 'flat', rate: 0.05 },
  MI: { name: 'Michigan', type: 'flat', rate: 0.0405 },
  MN: { name: 'Minnesota', type: 'progressive', brackets: [{ min: 0, max: 30070, rate: 0.0535 }, { min: 30070, max: 98760, rate: 0.068 }, { min: 98760, max: 183340, rate: 0.0785 }, { min: 183340, max: Infinity, rate: 0.0985 }] },
  MS: { name: 'Mississippi', type: 'flat', rate: 0.047 },
  MO: { name: 'Missouri', type: 'progressive', brackets: [{ min: 0, max: 1207, rate: 0.02 }, { min: 1207, max: 2414, rate: 0.025 }, { min: 2414, max: 3621, rate: 0.03 }, { min: 3621, max: 4828, rate: 0.035 }, { min: 4828, max: 6035, rate: 0.04 }, { min: 6035, max: 7242, rate: 0.045 }, { min: 7242, max: 8449, rate: 0.05 }, { min: 8449, max: Infinity, rate: 0.048 }] },
  MT: { name: 'Montana', type: 'progressive', brackets: [{ min: 0, max: 20500, rate: 0.047 }, { min: 20500, max: Infinity, rate: 0.059 }] },
  NE: { name: 'Nebraska', type: 'progressive', brackets: [{ min: 0, max: 3700, rate: 0.0246 }, { min: 3700, max: 22170, rate: 0.0351 }, { min: 22170, max: 35730, rate: 0.0501 }, { min: 35730, max: Infinity, rate: 0.0584 }] },
  NV: { name: 'Nevada', type: 'none', rate: 0 },
  NH: { name: 'New Hampshire', type: 'none', rate: 0 },
  NJ: { name: 'New Jersey', type: 'progressive', brackets: [{ min: 0, max: 20000, rate: 0.014 }, { min: 20000, max: 35000, rate: 0.0175 }, { min: 35000, max: 40000, rate: 0.035 }, { min: 40000, max: 75000, rate: 0.05525 }, { min: 75000, max: 500000, rate: 0.0637 }, { min: 500000, max: 1000000, rate: 0.0897 }, { min: 1000000, max: Infinity, rate: 0.1075 }] },
  NM: { name: 'New Mexico', type: 'progressive', brackets: [{ min: 0, max: 5500, rate: 0.017 }, { min: 5500, max: 11000, rate: 0.032 }, { min: 11000, max: 16000, rate: 0.047 }, { min: 16000, max: 210000, rate: 0.049 }, { min: 210000, max: Infinity, rate: 0.059 }] },
  NY: { name: 'New York', type: 'progressive', brackets: [{ min: 0, max: 8500, rate: 0.04 }, { min: 8500, max: 11700, rate: 0.045 }, { min: 11700, max: 13900, rate: 0.0525 }, { min: 13900, max: 80650, rate: 0.0585 }, { min: 80650, max: 215400, rate: 0.0625 }, { min: 215400, max: 1077550, rate: 0.0685 }, { min: 1077550, max: 5000000, rate: 0.0965 }, { min: 5000000, max: 25000000, rate: 0.103 }, { min: 25000000, max: Infinity, rate: 0.109 }] },
  NC: { name: 'North Carolina', type: 'flat', rate: 0.045 },
  ND: { name: 'North Dakota', type: 'progressive', brackets: [{ min: 0, max: 44725, rate: 0.0195 }, { min: 44725, max: Infinity, rate: 0.025 }] },
  OH: { name: 'Ohio', type: 'progressive', brackets: [{ min: 0, max: 26050, rate: 0 }, { min: 26050, max: 100000, rate: 0.028 }, { min: 100000, max: Infinity, rate: 0.035 }] },
  OK: { name: 'Oklahoma', type: 'progressive', brackets: [{ min: 0, max: 1000, rate: 0.0025 }, { min: 1000, max: 2500, rate: 0.0075 }, { min: 2500, max: 3750, rate: 0.0175 }, { min: 3750, max: 4900, rate: 0.0275 }, { min: 4900, max: 7200, rate: 0.0375 }, { min: 7200, max: Infinity, rate: 0.0475 }] },
  OR: { name: 'Oregon', type: 'progressive', brackets: [{ min: 0, max: 4050, rate: 0.0475 }, { min: 4050, max: 10200, rate: 0.0675 }, { min: 10200, max: 125000, rate: 0.0875 }, { min: 125000, max: Infinity, rate: 0.099 }] },
  PA: { name: 'Pennsylvania', type: 'flat', rate: 0.0307 },
  RI: { name: 'Rhode Island', type: 'progressive', brackets: [{ min: 0, max: 73450, rate: 0.0375 }, { min: 73450, max: 166950, rate: 0.0475 }, { min: 166950, max: Infinity, rate: 0.0599 }] },
  SC: { name: 'South Carolina', type: 'progressive', brackets: [{ min: 0, max: 3460, rate: 0 }, { min: 3460, max: 17330, rate: 0.03 }, { min: 17330, max: Infinity, rate: 0.064 }] },
  SD: { name: 'South Dakota', type: 'none', rate: 0 },
  TN: { name: 'Tennessee', type: 'none', rate: 0 },
  TX: { name: 'Texas', type: 'none', rate: 0 },
  UT: { name: 'Utah', type: 'flat', rate: 0.0465 },
  VT: { name: 'Vermont', type: 'progressive', brackets: [{ min: 0, max: 45400, rate: 0.0335 }, { min: 45400, max: 110050, rate: 0.066 }, { min: 110050, max: 229550, rate: 0.076 }, { min: 229550, max: Infinity, rate: 0.0875 }] },
  VA: { name: 'Virginia', type: 'progressive', brackets: [{ min: 0, max: 3000, rate: 0.02 }, { min: 3000, max: 5000, rate: 0.03 }, { min: 5000, max: 17000, rate: 0.05 }, { min: 17000, max: Infinity, rate: 0.0575 }] },
  WA: { name: 'Washington', type: 'none', rate: 0 },
  WV: { name: 'West Virginia', type: 'progressive', brackets: [{ min: 0, max: 10000, rate: 0.0236 }, { min: 10000, max: 25000, rate: 0.0315 }, { min: 25000, max: 40000, rate: 0.0354 }, { min: 40000, max: 60000, rate: 0.0472 }, { min: 60000, max: Infinity, rate: 0.0512 }] },
  WI: { name: 'Wisconsin', type: 'progressive', brackets: [{ min: 0, max: 14320, rate: 0.035 }, { min: 14320, max: 28640, rate: 0.044 }, { min: 28640, max: 315310, rate: 0.053 }, { min: 315310, max: Infinity, rate: 0.0765 }] },
  WY: { name: 'Wyoming', type: 'none', rate: 0 },
  DC: { name: 'District of Columbia', type: 'progressive', brackets: [{ min: 0, max: 10000, rate: 0.04 }, { min: 10000, max: 40000, rate: 0.06 }, { min: 40000, max: 60000, rate: 0.065 }, { min: 60000, max: 250000, rate: 0.085 }, { min: 250000, max: 500000, rate: 0.0925 }, { min: 500000, max: 1000000, rate: 0.0975 }, { min: 1000000, max: Infinity, rate: 0.1075 }] },
};

/**
 * Calculate tax using progressive brackets
 */
export function calcProgressiveTax(taxableIncome, brackets) {
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxable = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxable * bracket.rate;
  }
  return tax;
}

/**
 * Calculate federal income tax
 */
export function calcFederalTax(taxableIncome, filingStatus = 'single', bracketsOverride = null) {
  const brackets = bracketsOverride || FEDERAL_BRACKETS_2026[filingStatus];
  return calcProgressiveTax(taxableIncome, brackets);
}

/**
 * Calculate the marginal federal tax rate
 */
export function getMarginalFederalRate(taxableIncome, filingStatus = 'single', bracketsOverride = null) {
  const brackets = bracketsOverride || FEDERAL_BRACKETS_2026[filingStatus];
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (taxableIncome > brackets[i].min) {
      return brackets[i].rate;
    }
  }
  return brackets[0].rate;
}

/**
 * Calculate FICA taxes (Social Security + Medicare)
 */
export function calcFICA(grossIncome, filingStatus = 'single', wageBaseOverride = null) {
  const wageBase = wageBaseOverride || SS_WAGE_BASE_2026;
  const ssIncome = Math.min(grossIncome, wageBase);
  const ssTax = ssIncome * FICA_RATES.socialSecurity;

  const medicareTax = grossIncome * FICA_RATES.medicare;
  const threshold = FICA_RATES.additionalMedicareThreshold[filingStatus];
  const additionalMedicare =
    grossIncome > threshold
      ? (grossIncome - threshold) * FICA_RATES.additionalMedicare
      : 0;
  return {
    socialSecurity: ssTax,
    medicare: medicareTax,
    additionalMedicare,
    total: ssTax + medicareTax + additionalMedicare,
  };
}

/**
 * Calculate state income tax
 */
export function calcStateTax(taxableIncome, stateCode) {
  const stateData = STATE_TAX_DATA[stateCode];
  if (!stateData || stateData.type === 'none') return 0;
  if (stateData.type === 'flat') return taxableIncome * stateData.rate;
  if (stateData.type === 'progressive') {
    return calcProgressiveTax(taxableIncome, stateData.brackets);
  }
  return 0;
}

/**
 * Get state tax rate description
 */
export function getStateTaxDescription(stateCode) {
  const stateData = STATE_TAX_DATA[stateCode];
  if (!stateData) return 'Unknown';
  if (stateData.type === 'none') return 'No state income tax';
  if (stateData.type === 'flat') return `Flat ${(stateData.rate * 100).toFixed(2)}%`;
  return 'Progressive brackets';
}

/**
 * Full tax calculation given all inputs
 */
export function calculateFullTax({
  grossIncome,
  preTax401k = 0,
  hsaContribution = 0,
  medicalPremium = 0,
  filingStatus = 'single',
  stateCode = 'WA',
  stateOverrideRate = null,
  taxConfig = {}, // New parameter for config overrides
}) {
  // Pre-tax deductions reduce taxable income
  const totalPreTaxDeductions = preTax401k + hsaContribution + medicalPremium;
  const adjustedGross = grossIncome - totalPreTaxDeductions;

  // Standard deduction
  const standardDeduction = taxConfig.standardDeduction 
    ? taxConfig.standardDeduction[filingStatus] 
    : STANDARD_DEDUCTION_2026[filingStatus];
  
  const federalTaxableIncome = Math.max(0, adjustedGross - standardDeduction);

  // Federal bracket overrides
  const federalBrackets = taxConfig.federalBrackets 
    ? taxConfig.federalBrackets[filingStatus] 
    : FEDERAL_BRACKETS_2026[filingStatus];

  // Federal tax
  const federalTax = calcFederalTax(federalTaxableIncome, filingStatus, federalBrackets);
  const marginalRate = getMarginalFederalRate(federalTaxableIncome, filingStatus, federalBrackets);
  const effectiveRate = grossIncome > 0 ? federalTax / grossIncome : 0;

  // FICA (allow wage base override)
  const fica = calcFICA(grossIncome, filingStatus, taxConfig.ssWageBase);

  // State tax

  let stateTax;
  if (stateOverrideRate !== null && stateOverrideRate !== undefined) {
    stateTax = adjustedGross * stateOverrideRate;
  } else {
    // Most states use AGI-like figure; simplified here
    stateTax = calcStateTax(adjustedGross, stateCode);
  }

  const totalTax = federalTax + fica.total + stateTax;
  const netIncome = grossIncome - totalTax - totalPreTaxDeductions;

  return {
    grossIncome,
    totalPreTaxDeductions,
    adjustedGross,
    standardDeduction,
    federalTaxableIncome,
    federalTax,
    marginalRate,
    effectiveRate,
    fica,
    stateTax,
    totalTax,
    netIncome,
  };
}
