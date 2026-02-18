import { useReducer, useEffect, useMemo } from 'react';
import { appReducer, DEFAULT_STATE, ACTIONS } from './state/reducer';
import { saveState, loadState, clearState } from './state/persistence';
import { calculateFullTax, AVAILABLE_YEARS } from './engine/taxEngine';
import { getIRSLimits } from './engine/retirementMatch';
import { calculateTimelineIncome, calculateSimpleIncome } from './engine/incomeTimeline';
import { calculateEmployerMatch } from './engine/retirementMatch';
import { calcFIRETarget, calcYearsToFIRE, projectWealth } from './engine/fireCalc';
import IncomePanel from './components/IncomePanel';
import TaxSettingsPanel from './components/TaxSettingsPanel';
import DeductionsPanel from './components/DeductionsPanel';
import RetirementPanel from './components/RetirementPanel';
import AfterTaxPanel from './components/AfterTaxPanel';
import FIREPanel from './components/FIREPanel';
import ResultsPanel from './components/ResultsPanel';
import SyncPanel from './components/SyncPanel';
import { TaxBracketChart, WealthProjectionChart } from './components/Charts';
import { Card } from './components/Inputs';
import { PAY_PERIOD_OPTIONS } from './utils/payPeriod';

function getInitialState() {
  const saved = loadState();
  return saved ? { ...DEFAULT_STATE, ...saved } : DEFAULT_STATE;
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, null, getInitialState);

  // Persist to localStorage on every state change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Compute income
  const incomeResult = useMemo(() => {
    if (state.incomeMode === 'timeline') {
      return calculateTimelineIncome(state.timelineEvents, state.timelineYear);
    }
    return calculateSimpleIncome(state.annualSalary, state.annualBonus);
  }, [state.incomeMode, state.annualSalary, state.annualBonus, state.timelineEvents, state.timelineYear]);

  // Resolve IRS limits for the selected year
  const irsLimits = useMemo(() => getIRSLimits(state.timelineYear), [state.timelineYear]);

  // Compute employer match
  const matchResult = useMemo(() => {
    return calculateEmployerMatch(
      state.matchTemplateId,
      incomeResult.totalGross,
      state.employeeContribution,
      state.customMatchTiers,
      state.customFlatPercent,
      state.timelineYear
    );
  }, [state.matchTemplateId, incomeResult.totalGross, state.employeeContribution, state.customMatchTiers, state.customFlatPercent, state.timelineYear]);

  // Compute taxes
  const taxResult = useMemo(() => {
    return calculateFullTax({
      grossIncome: incomeResult.totalGross,
      preTax401k: matchResult.employeeContribution,
      hsaContribution: state.hsaContribution,
      medicalPremium: state.medicalPremium,
      dentalPremium: state.dentalPremium,
      visionPremium: state.visionPremium,
      otherPreTaxFees: state.otherPreTaxFees,
      filingStatus: state.filingStatus,
      stateCode: state.stateCode,
      stateOverrideRate: state.useStateOverride ? state.stateOverrideRate : null,
      taxConfig: state.customTaxConfig && state.customTaxConfig.enabled ? state.customTaxConfig : {},
      year: state.timelineYear
    });
  }, [incomeResult.totalGross, matchResult.employeeContribution, state.hsaContribution, state.medicalPremium, state.dentalPremium, state.visionPremium, state.otherPreTaxFees, state.filingStatus, state.stateCode, state.useStateOverride, state.stateOverrideRate, state.customTaxConfig, state.timelineYear]);

  // Total investments (pre-tax + after-tax)
  const totalInvestments = useMemo(() => {
    return (
      matchResult.totalRetirement +
      state.hsaContribution +
      state.rothIRA +
      state.hysa +
      state.brokerage
    );
  }, [matchResult.totalRetirement, state.hsaContribution, state.rothIRA, state.hysa, state.brokerage]);

  // Wealth projection
  const projection = useMemo(() => {
    return projectWealth({
      currentSavings: state.currentSavings,
      annualContribution: totalInvestments,
      years: state.projectionYears,
      nominalReturn: state.expectedReturn,
      inflationRate: state.inflationRate,
    });
  }, [state.currentSavings, totalInvestments, state.projectionYears, state.expectedReturn, state.inflationRate]);

  const fireTarget = calcFIRETarget(state.annualExpenses, state.withdrawalRate);

  function handleReset() {
    if (window.confirm('Reset all settings to defaults? This cannot be undone.')) {
      clearState();
      dispatch({ type: ACTIONS.RESET_STATE });
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800/60 bg-gray-950/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-100 tracking-tight">W-2 Many Problems</h1>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
               <span>US Personal Finance Planner /</span>
               <select 
                 value={state.timelineYear}
                 onChange={(e) => dispatch({ type: ACTIONS.SET_FIELD, field: 'timelineYear', value: parseInt(e.target.value) })}
                 className="bg-gray-900 border-none text-gray-400 text-xs py-0 focus:ring-0 cursor-pointer"
               >
                 {AVAILABLE_YEARS.map(year => (
                   <option key={year} value={year}>{year} Tax Year</option>
                 ))}
               </select>
               <span className="text-gray-600">|</span>
               <select
                 value={state.payPeriod}
                 onChange={(e) => dispatch({ type: ACTIONS.SET_FIELD, field: 'payPeriod', value: e.target.value })}
                 className="bg-gray-900 border-none text-gray-400 text-xs py-0 focus:ring-0 cursor-pointer"
               >
                 {PAY_PERIOD_OPTIONS.map(opt => (
                   <option key={opt.value} value={opt.value}>{opt.label}</option>
                 ))}
               </select>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 text-right">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500/60"></span>
            Auto-saved to browser
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: inputs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <IncomePanel state={state} dispatch={dispatch} />
              <TaxSettingsPanel state={state} dispatch={dispatch} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DeductionsPanel state={state} dispatch={dispatch} irsLimits={irsLimits} />
              <RetirementPanel state={state} dispatch={dispatch} matchResult={matchResult} irsLimits={irsLimits} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AfterTaxPanel state={state} dispatch={dispatch} irsLimits={irsLimits} />
              <FIREPanel
                state={state}
                dispatch={dispatch}
                taxResult={taxResult}
                totalInvestments={totalInvestments}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <TaxBracketChart
                  taxableIncome={taxResult.federalTaxableIncome}
                  grossIncome={taxResult.grossIncome}
                  filingStatus={state.filingStatus}
                />
              </Card>
              <Card>
                <WealthProjectionChart projection={projection} fireTarget={fireTarget} />
              </Card>
            </div>

            {/* Sync */}
            <SyncPanel state={state} dispatch={dispatch} onReset={handleReset} />
          </div>

          {/* Right column: results */}
          <div className="space-y-6">
            <div className="lg:sticky lg:top-16">
              <ResultsPanel
                taxResult={taxResult}
                incomeResult={incomeResult}
                matchResult={matchResult}
                state={state}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/40 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-gray-600">
          W-2 Many Problems -- Not financial advice. Tax calculations are estimates based on {state.timelineYear} IRS data. Consult a CPA for actual tax filing.
        </div>
      </footer>
    </div>
  );
}
