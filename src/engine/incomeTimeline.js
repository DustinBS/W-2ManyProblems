/**
 * Timeline-based income calculator
 * Handles mid-year income changes by weighting salaries by days active
 */

/**
 * Calculate the number of days in a year
 */
function daysInYear(year) {
  return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
}

/**
 * Get the day-of-year (1-indexed) for a given date
 */
function dayOfYear(dateStr) {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate annual income from a timeline of salary events
 *
 * @param {Array} events - Array of { effectiveDate: 'YYYY-MM-DD', baseSalary: number, oneTimeBonus: number }
 * @param {number} year - The fiscal year to calculate for
 * @returns {{ totalGross: number, weightedSalary: number, totalBonuses: number, segments: Array }}
 */
export function calculateTimelineIncome(events, year) {
  if (!events || events.length === 0) {
    return { totalGross: 0, weightedSalary: 0, totalBonuses: 0, segments: [] };
  }

  const totalDays = daysInYear(year);
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  // Sort events by date
  const sorted = [...events]
    .map((e) => ({
      ...e,
      date: new Date(e.effectiveDate),
    }))
    .sort((a, b) => a.date - b.date);

  // Filter events relevant to this year
  // Include events from before this year (for carry-over salary)
  // and events within this year
  const segments = [];
  let totalBonuses = 0;

  for (let i = 0; i < sorted.length; i++) {
    const event = sorted[i];
    const nextEvent = sorted[i + 1];

    // Segment start: max of event date and year start
    const segStart = event.date < yearStart ? yearStart : event.date;

    // Segment end: min of next event date - 1 day, or year end
    let segEnd;
    if (nextEvent) {
      const nextDate = new Date(nextEvent.date);
      nextDate.setDate(nextDate.getDate() - 1);
      segEnd = nextDate > yearEnd ? yearEnd : nextDate;
    } else {
      segEnd = yearEnd;
    }

    // Skip if segment is entirely outside this year
    if (segStart > yearEnd || segEnd < yearStart) continue;

    const startDay = dayOfYear(segStart.toISOString().split('T')[0]);
    const endDay = dayOfYear(segEnd.toISOString().split('T')[0]);
    const segDays = endDay - startDay + 1;

    if (segDays > 0) {
      segments.push({
        startDate: segStart.toISOString().split('T')[0],
        endDate: segEnd.toISOString().split('T')[0],
        days: segDays,
        annualizedSalary: event.baseSalary,
        earnedSalary: (event.baseSalary / totalDays) * segDays,
      });
    }

    // Bonuses count if they fall within the year
    if (event.oneTimeBonus && event.date >= yearStart && event.date <= yearEnd) {
      totalBonuses += event.oneTimeBonus;
    }
  }

  const weightedSalary = segments.reduce((sum, s) => sum + s.earnedSalary, 0);
  const totalGross = weightedSalary + totalBonuses;

  return {
    totalGross,
    weightedSalary,
    totalBonuses,
    segments,
  };
}

/**
 * Simple annual salary calculation (no timeline)
 */
export function calculateSimpleIncome(annualSalary, bonus = 0) {
  return {
    totalGross: annualSalary + bonus,
    weightedSalary: annualSalary,
    totalBonuses: bonus,
    segments: [
      {
        startDate: null,
        endDate: null,
        days: 365,
        annualizedSalary: annualSalary,
        earnedSalary: annualSalary,
      },
    ],
  };
}
