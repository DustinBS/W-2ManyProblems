/**
 * FIRE (Financial Independence, Retire Early) calculation engine
 * Uses a conservative 3% withdrawal rate for longer retirement horizons
 */

const DEFAULT_WITHDRAWAL_RATE = 0.03;
const DEFAULT_GROWTH_RATE = 0.07; // average stock market return (nominal)
const DEFAULT_INFLATION_RATE = 0.03;

/**
 * Calculate the FIRE target number
 * FIRE Target = Annual Expenses / Withdrawal Rate
 */
export function calcFIRETarget(annualExpenses, withdrawalRate = DEFAULT_WITHDRAWAL_RATE) {
  if (withdrawalRate <= 0) return Infinity;
  return annualExpenses / withdrawalRate;
}

/**
 * Calculate years to FIRE
 * Uses future value of annuity formula to find years to reach target
 *
 * @param {number} currentSavings - Current total investment portfolio
 * @param {number} annualContribution - Annual investment amount
 * @param {number} fireTarget - Target portfolio size
 * @param {number} realReturnRate - Real return rate (nominal - inflation)
 * @returns {number} Years to reach FIRE target, or Infinity if unreachable
 */
export function calcYearsToFIRE(
  currentSavings,
  annualContribution,
  fireTarget,
  realReturnRate = DEFAULT_GROWTH_RATE - DEFAULT_INFLATION_RATE
) {
  if (currentSavings >= fireTarget) return 0;
  if (annualContribution <= 0 && realReturnRate <= 0) return Infinity;

  const r = realReturnRate;

  if (r === 0) {
    // No growth: simple division
    const yearsNeeded = (fireTarget - currentSavings) / annualContribution;
    return yearsNeeded > 0 ? yearsNeeded : Infinity;
  }

  // FV = PV * (1+r)^n + PMT * ((1+r)^n - 1) / r
  // Solve for n: iterative approach since closed-form is complex
  let n = 0;
  let balance = currentSavings;
  const maxYears = 100;

  while (balance < fireTarget && n < maxYears) {
    balance = balance * (1 + r) + annualContribution;
    n++;
  }

  return n >= maxYears ? Infinity : n;
}

/**
 * Project wealth accumulation year by year
 */
export function projectWealth({
  currentSavings = 0,
  annualContribution,
  years = 30,
  nominalReturn = DEFAULT_GROWTH_RATE,
  inflationRate = DEFAULT_INFLATION_RATE,
}) {
  const projection = [];
  let balance = currentSavings;
  const realReturn = nominalReturn - inflationRate;

  for (let y = 1; y <= years; y++) {
    const growthAmount = balance * realReturn;
    balance = balance + growthAmount + annualContribution;
    projection.push({
      year: y,
      balance: Math.round(balance),
      contributions: Math.round(annualContribution * y + currentSavings),
      growth: Math.round(balance - (annualContribution * y + currentSavings)),
    });
  }

  return projection;
}

/**
 * Calculate investment ratios
 */
export function calcInvestmentRatios(totalInvestments, grossIncome, netIncome) {
  return {
    grossRatio: grossIncome > 0 ? totalInvestments / grossIncome : 0,
    netRatio: netIncome > 0 ? totalInvestments / netIncome : 0,
  };
}

/**
 * Calculate tax alpha from pre-tax contributions
 * Tax Alpha = the immediate tax savings from 401k/HSA contributions
 */
export function calcTaxAlpha(preTaxContributions, marginalRate) {
  return preTaxContributions * marginalRate;
}
