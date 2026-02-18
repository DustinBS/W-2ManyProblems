import { useState } from 'react';
import { Card, StatRow } from './Inputs';
import { fmt, pct } from '../utils/format';

function CollapsibleSection({ title, children, defaultOpen = false, summary }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-800 last:border-0 border-opacity-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2.5 px-1.5 hover:bg-gray-800/40 rounded-md transition-colors text-left group"
      >
        <div className="flex items-center gap-2">
           <span className={`text-gray-400 transform transition-transform text-xs ${isOpen ? 'rotate-90' : ''}`}>▶</span>
           <span className="text-sm font-medium text-gray-300 group-hover:text-white">{title}</span>
        </div>
        {summary && <span className="text-sm font-mono text-gray-500">{summary}</span>}
      </button>
      {isOpen && <div className="pb-3 pl-4 pr-1 space-y-1 animate-in slide-in-from-top-1 duration-100">{children}</div>}
    </div>
  );
}

export default function ResultsPanel({ taxResult, incomeResult, matchResult, state }) {
  if (!taxResult || !incomeResult) return null;

  const monthlyNet = taxResult.netIncome / 12;
  const monthlyGross = taxResult.grossIncome / 12;

  const totalAfterTax = state.rothIRA + state.hysa + state.brokerage;
  const totalPreTax = matchResult ? matchResult.totalRetirement + state.hsaContribution : state.hsaContribution;
  const totalInvested = totalPreTax + totalAfterTax;

  return (
    <Card title="Results Summary" className="border-blue-900/40 sticky top-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div className="space-y-1 divide-y divide-gray-800/50">
        
        <CollapsibleSection title="Income" summary={fmt(taxResult.grossIncome)}>
          <StatRow label="Gross Income" value={fmt(taxResult.grossIncome)} />
          {incomeResult.segments.length > 1 && (
            <StatRow label="Weighted Salary" value={fmt(incomeResult.weightedSalary)} />
          )}
          {incomeResult.totalBonuses > 0 && (
            <StatRow label="Total Bonuses" value={fmt(incomeResult.totalBonuses)} />
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Pre-Tax Deductions" summary={fmt(taxResult.totalPreTaxDeductions)}>
          <StatRow label="Medical Insurance" value={fmt(state.medicalPremium)} />
          <StatRow label="HSA Contribution" value={fmt(state.hsaContribution)} />
          {state.dentalPremium > 0 && <StatRow label="Dental Insurance" value={fmt(state.dentalPremium)} />}
          {state.visionPremium > 0 && <StatRow label="Vision Insurance" value={fmt(state.visionPremium)} />}
          {state.otherPreTaxFees > 0 && <StatRow label="Other Pre-Tax Fees" value={fmt(state.otherPreTaxFees)} />}
          <StatRow
            label={`${state.retirementType === '403b' ? '403(b)' : '401(k)'} (employee)`}
            value={fmt(matchResult?.employeeContribution || 0)}
          />
          {matchResult && (
            <StatRow
              label={`${state.retirementType === '403b' ? '403(b)' : '401(k)'} (match)`}
              value={fmt(matchResult.employerMatch)}
              highlight
            />
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Taxes" summary={fmt(taxResult.totalTax)}>
          <StatRow label="Adjusted Gross Income" value={fmt(taxResult.adjustedGross)} />
          <StatRow label="Standard Deduction" value={fmt(taxResult.standardDeduction)} />
          <StatRow label="Federal Taxable" value={fmt(taxResult.federalTaxableIncome)} />
          <div className="my-1 border-t border-gray-800 opacity-50" />
          <StatRow
            label="Federal Income Tax"
            value={fmt(taxResult.federalTax)}
            subtext={`Eff: ${pct(taxResult.effectiveRate)} / Marg: ${pct(taxResult.marginalRate)}`}
          />
          <StatRow label="FICA" value={fmt(taxResult.fica.total)} />
          <StatRow label="State Tax" value={fmt(taxResult.stateTax)} />
        </CollapsibleSection>

        <CollapsibleSection title="After-Tax Investments" summary={fmt(totalAfterTax)}>
          <StatRow label="Roth IRA" value={fmt(state.rothIRA)} />
          <StatRow label="HYSA" value={fmt(state.hysa)} />
          <StatRow label="Taxable Brokerage" value={fmt(state.brokerage)} />
        </CollapsibleSection>

        {/* Bottom Line always visible and prominent */}
        <div className="pt-4 mt-2">
          <StatRow label="Net Annual" value={fmt(taxResult.netIncome)} highlight />
          <StatRow label="Net Monthly" value={fmt(monthlyNet)} />
          
          <div className="my-3 border-t border-gray-700" />
          
          <div className="flex justify-between items-baseline py-1">
             <span className="text-sm text-gray-300">Total Invested</span>
             <div className="text-right">
               <span className="text-green-400 font-mono font-semibold">{fmt(totalInvested)}</span>
               <div className="text-xs text-gray-500">{pct(totalInvested / taxResult.grossIncome)} of gross</div>
             </div>
          </div>
          
          <div className="flex justify-between items-baseline py-1 mt-2 bg-gray-800/40 p-2.5 rounded-lg border border-gray-700/60">
             <span className="text-sm font-bold text-white">Liquid</span>
             <div className="text-right">
               <span className="text-white font-mono font-bold">{fmt(taxResult.netIncome - totalAfterTax)}</span>
               <div className="text-xs text-gray-400">{fmt((taxResult.netIncome - totalAfterTax) / 12)}/mo</div>
             </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
