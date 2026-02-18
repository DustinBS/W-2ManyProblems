import { useReducer, useEffect, useMemo } from 'react';
import { appReducer, DEFAULT_STATE, ACTIONS } from './state/reducer';
import { saveState, loadState, clearState } from './state/persistence';
import { calculateFullTax } from './engine/taxEngine';
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

  // Compute employer match
  const matchResult = useMemo(() => {
    return calculateEmployerMatch(
      state.matchTemplateId,
      incomeResult.totalGross,
      state.employeeContribution,
      state.customMatchTiers,
      state.customFlatPercent
    );
  }, [state.matchTemplateId, incomeResult.totalGross, state.employeeContribution, state.customMatchTiers, state.customFlatPercent]);

  // Compute taxes
  const taxResult = useMemo(() => {
    return calculateFullTax({
      grossIncome: incomeResult.totalGross,
      preTax401k: matchResult.employeeContribution,
      hsaContribution: state.hsaContribution,
      medicalPremium: state.medicalPremium,
      filingStatus: state.filingStatus,
      stateCode: state.stateCode,
      stateOverrideRate: state.useStateOverride ? state.stateOverrideRate : null,
    });
  }, [incomeResult.totalGross, matchResult.employeeContribution, state.hsaContribution, state.medicalPremium, state.filingStatus, state.stateCode, state.useStateOverride, state.stateOverrideRate]);

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
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-100 tracking-tight">W-2 Many Problems</h1>
            <p className="text-xs text-gray-500">US Personal Finance Planner / 2026 Tax Year</p>
          </div>
          <div className="text-xs text-gray-600 text-right">
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
              <DeductionsPanel state={state} dispatch={dispatch} />
              <RetirementPanel state={state} dispatch={dispatch} matchResult={matchResult} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AfterTaxPanel state={state} dispatch={dispatch} />
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
      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-gray-600">
          W-2 Many Problems -- Not financial advice. Tax calculations are estimates based on projected 2026 brackets. Consult a CPA for actual tax filing.
        </div>
      </footer>
    </div>
  );
}
