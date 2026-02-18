import { useState } from 'react';
import { ACTIONS } from '../state/reducer';
import { Card, NumberInput, Checkbox } from './Inputs';

export default function TaxConfigPanel({ state, dispatch }) {
  const [isOpen, setIsOpen] = useState(false);
  const config = state.customTaxConfig || { enabled: false, standardDeduction: {}, federalBrackets: { single: [], mfj: [] } };

  if (!isOpen) {
    return (
      <Card title="Advanced Tax Configuration">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {config.enabled ? 'Custom tax rates active' : 'Using default 2026 projected rates'}
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="px-3 py-1.5 text-xs font-medium border border-gray-700 rounded hover:bg-gray-800 transition-colors"
          >
            Edit Configuration
          </button>
        </div>
      </Card>
    );
  }

  const update = (field, value) => {
    dispatch({ type: ACTIONS.UPDATE_TAX_CONFIG, field, value });
  };

  const updateDeduction = (status, value) => {
    update('standardDeduction', { ...config.standardDeduction, [status]: value });
  };

  const updateBracket = (status, index, key, value) => {
    const newBrackets = [...config.federalBrackets[status]];
    newBrackets[index] = { ...newBrackets[index], [key]: value };
    // Auto-adjust next bracket min if max changed
    if (key === 'max' && index < newBrackets.length - 1) {
       newBrackets[index + 1].min = value;
    }
    update('federalBrackets', { ...config.federalBrackets, [status]: newBrackets });
  };

  return (
    <Card title="Advanced Tax Configuration" className="border-yellow-900/50">
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <Checkbox
            label="Enable Custom Tax Rates"
            checked={config.enabled}
            onChange={(v) => update('enabled', v)}
          />
          <button
            onClick={() => setIsOpen(false)}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            Close
          </button>
        </div>

        <div className={`space-y-4 ${config.enabled ? '' : 'opacity-50 pointer-events-none'}`}>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Standard Deduction</h4>
            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                label="Single"
                value={config.standardDeduction?.single || 0}
                onChange={(v) => updateDeduction('single', v)}
                min={0}
                step={100}
              />
              <NumberInput
                label="Married Filing Jointly"
                value={config.standardDeduction?.mfj || 0}
                onChange={(v) => updateDeduction('mfj', v)}
                min={0}
                step={100}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">FICA Limits</h4>
            <NumberInput
              label="Social Security Wage Base"
              value={config.ssWageBase || 0}
              onChange={(v) => update('ssWageBase', v)}
              min={0}
              step={100}
            />
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Federal Brackets ({state.filingStatus})</h4>
            <div className="space-y-2">
              {config.federalBrackets?.[state.filingStatus]?.map((bracket, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <NumberInput
                     label={i === 0 ? "Rate %" : ""}
                     value={bracket.rate * 100}
                     onChange={(v) => updateBracket(state.filingStatus, i, 'rate', v / 100)}
                     min={0}
                     max={100}
                     step={1}
                     suffix="%"
                     className="w-20"
                  />
                  <div className="flex-1 text-sm text-gray-400 pb-2 text-center">
                    {i === 0 ? 'up to' : i === config.federalBrackets[state.filingStatus].length - 1 ? 'over' : 'to'}
                  </div>
                  <NumberInput
                     label={i === 0 ? "Max Income" : ""}
                     value={bracket.max === Infinity ? 0 : bracket.max}
                     onChange={(v) => updateBracket(state.filingStatus, i, 'max', v || Infinity)} // 0 = Infinity for UX
                     min={0}
                     step={100}
                     className="flex-1"
                     helpText={bracket.max === Infinity ? "Infinity" : undefined}
                  />
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 italic">
              Note: Brackets must be contiguous. Adjusting a &quot;Max Income&quot; will update the start of the next bracket automatically. Set Max to 0 for Infinity.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
