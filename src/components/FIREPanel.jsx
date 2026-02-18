import { Card, NumberInput, fieldSetter } from './Inputs';
import { fmt, pct } from '../utils/format';
import { calcFIRETarget, calcYearsToFIRE, calcInvestmentRatios, calcTaxAlpha } from '../engine/fireCalc';

export default function FIREPanel({ state, dispatch, taxResult, totalInvestments }) {
  const set = (field) => fieldSetter(dispatch, field);

  const fireTarget = calcFIRETarget(state.annualExpenses, state.withdrawalRate);
  const annualContribution = totalInvestments;
  const yearsToFIRE = calcYearsToFIRE(
    state.currentSavings,
    annualContribution,
    fireTarget,
    state.expectedReturn - state.inflationRate
  );

  const ratios = calcInvestmentRatios(
    totalInvestments,
    taxResult?.grossIncome || 0,
    taxResult?.netIncome || 0
  );

  const preTaxContributions = state.employeeContribution + state.hsaContribution;
  const taxAlpha = calcTaxAlpha(preTaxContributions, taxResult?.marginalRate || 0);

  return (
    <Card title="FIRE Planning">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <NumberInput
            label="Annual Expenses"
            value={state.annualExpenses}
            onChange={set('annualExpenses')}
            min={0}
            step={1000}
          />
          <NumberInput
            label="Current Savings"
            value={state.currentSavings}
            onChange={set('currentSavings')}
            min={0}
            step={5000}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <NumberInput
            label="Withdrawal Rate"
            value={state.withdrawalRate * 100}
            onChange={(v) => set('withdrawalRate')(v / 100)}
            min={1}
            max={10}
            step={0.5}
            prefix=""
            suffix="%"
          />
          <NumberInput
            label="Expected Return"
            value={state.expectedReturn * 100}
            onChange={(v) => set('expectedReturn')(v / 100)}
            min={0}
            max={20}
            step={0.5}
            prefix=""
            suffix="%"
          />
          <NumberInput
            label="Inflation Rate"
            value={state.inflationRate * 100}
            onChange={(v) => set('inflationRate')(v / 100)}
            min={0}
            max={15}
            step={0.5}
            prefix=""
            suffix="%"
          />
        </div>

        <div className="p-4 bg-gray-800/50 rounded border border-gray-800 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">FIRE Target (3% rule)</span>
            <span className="text-yellow-400 font-mono font-semibold">{fmt(fireTarget)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Years to FIRE</span>
            <span className={`font-mono font-semibold ${yearsToFIRE === Infinity ? 'text-red-400' : yearsToFIRE <= 15 ? 'text-green-400' : 'text-yellow-400'}`}>
              {yearsToFIRE === Infinity ? 'Not reachable' : `${yearsToFIRE} years`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Annual Investments</span>
            <span className="text-gray-200 font-mono">{fmt(totalInvestments)}</span>
          </div>

          <div className="border-t border-gray-700 pt-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Gross Savings Rate</span>
              <span className="text-gray-200 font-mono">{pct(ratios.grossRatio)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Net Savings Rate</span>
              <span className="text-gray-200 font-mono">{pct(ratios.netRatio)}</span>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tax Alpha (pre-tax savings)</span>
              <span className="text-green-400 font-mono">{fmt(taxAlpha)}</span>
            </div>
            <div className="text-xs text-gray-500">
              Immediate tax savings from {fmt(preTaxContributions)} in pre-tax contributions at {pct(taxResult?.marginalRate || 0)} marginal rate
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
