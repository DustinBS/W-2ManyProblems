import { ACTIONS } from '../state/reducer';
import { MATCHING_TEMPLATES, IRS_LIMITS_2026 } from '../engine/retirementMatch';
import { Card, NumberInput, SelectInput, ToggleGroup, Checkbox, fieldSetter } from './Inputs';
import { fmt } from '../utils/format';

const TEMPLATE_OPTIONS = MATCHING_TEMPLATES.map((t) => ({
  value: t.id,
  label: t.name,
}));

export default function RetirementPanel({ state, dispatch, matchResult }) {
  const set = (field) => fieldSetter(dispatch, field);
  const selectedTemplate = MATCHING_TEMPLATES.find((t) => t.id === state.matchTemplateId);

  return (
    <Card title="Retirement Accounts">
      <div className="space-y-4">
        <ToggleGroup
          label="Account Type"
          value={state.retirementType}
          onChange={set('retirementType')}
          options={[
            { value: '401k', label: '401(k)' },
            { value: '403b', label: '403(b)' },
          ]}
        />

        <SelectInput
          label="Employer Match Template"
          value={state.matchTemplateId}
          onChange={(v) => dispatch({ type: ACTIONS.SET_MATCH_TEMPLATE, value: v })}
          options={TEMPLATE_OPTIONS}
        />

        {selectedTemplate && (
          <div className="text-xs text-gray-500">{selectedTemplate.description}</div>
        )}

        {state.matchTemplateId === 'custom' && (
          <CustomTiers state={state} dispatch={dispatch} />
        )}

        <NumberInput
          label={`Your Annual ${state.retirementType === '403b' ? '403(b)' : '401(k)'} Contribution`}
          value={state.employeeContribution}
          onChange={set('employeeContribution')}
          min={0}
          max={IRS_LIMITS_2026.electiveDeferralLimit + (state.employeeCatchUp ? IRS_LIMITS_2026.catchUpContribution : 0)}
          step={500}
          helpText={`2026 limit: $${IRS_LIMITS_2026.electiveDeferralLimit.toLocaleString()} (under 50) / $${(IRS_LIMITS_2026.electiveDeferralLimit + IRS_LIMITS_2026.catchUpContribution).toLocaleString()} (50+)`}
        />

        <Checkbox
          label="Age 50+ catch-up eligible"
          checked={state.employeeCatchUp}
          onChange={set('employeeCatchUp')}
        />

        {matchResult && (
          <div className="p-3 bg-gray-800/50 rounded border border-gray-800 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Your contribution</span>
              <span className="text-gray-200 font-mono">{fmt(matchResult.employeeContribution)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Employer match</span>
              <span className="text-green-400 font-mono">{fmt(matchResult.employerMatch)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium border-t border-gray-700 pt-1 mt-1">
              <span className="text-gray-300">Total retirement</span>
              <span className="text-gray-100 font-mono">{fmt(matchResult.totalRetirement)}</span>
            </div>
            <div className="text-xs text-gray-500">
              Unused {state.retirementType}: {fmt(IRS_LIMITS_2026.electiveDeferralLimit - matchResult.employeeContribution)}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function CustomTiers({ state, dispatch }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-400">Custom Match Tiers</div>

      <NumberInput
        label="Flat non-elective contribution %"
        value={state.customFlatPercent}
        onChange={(v) => dispatch({ type: ACTIONS.SET_FIELD, field: 'customFlatPercent', value: v })}
        min={0}
        max={100}
        step={0.5}
        prefix=""
        suffix="%"
      />

      {state.customMatchTiers.map((tier, i) => (
        <div key={i} className="flex flex-col gap-2 p-3 bg-gray-800/30 rounded border border-gray-800">
          <div className="flex items-end gap-2">
            <NumberInput
              label="Match %"
              value={tier.matchRate * 100}
              onChange={(v) =>
                dispatch({ type: ACTIONS.UPDATE_CUSTOM_TIER, index: i, field: 'matchRate', value: v / 100 })
              }
              min={0}
              max={200}
              step={5}
              prefix=""
              suffix="%"
              className="flex-1"
            />
            <button
              onClick={() => dispatch({ type: ACTIONS.REMOVE_CUSTOM_TIER, index: i })}
              className="text-gray-600 hover:text-red-400 text-lg pb-1"
            >
              x
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest font-medium">
            <span>Limit By</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="% of Salary"
              value={tier.upToPercent}
              onChange={(v) =>
                dispatch({ type: ACTIONS.UPDATE_CUSTOM_TIER, index: i, field: 'upToPercent', value: v })
              }
              min={0}
              max={100}
              step={1}
              prefix=""
              suffix="%"
            />
            <NumberInput
              label="Max Dollars"
              value={tier.maxMatchDollars || 0}
              onChange={(v) =>
                dispatch({ type: ACTIONS.UPDATE_CUSTOM_TIER, index: i, field: 'maxMatchDollars', value: v })
              }
              min={0}
              step={100}
              helpText="0 = no limit"
            />
          </div>
        </div>
      ))}

      <button
        onClick={() => dispatch({ type: ACTIONS.ADD_CUSTOM_TIER })}
        className="w-full py-1 text-sm border border-dashed border-gray-700 rounded text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
      >
        + Add Match Tier
      </button>

      <div className="text-xs text-gray-500 mt-2">
        Note: If &quot;Max Dollars&quot; is set, it caps the match amount for that tier. Set &quot;% of Salary&quot; to 100 for no salary percentage limit.
      </div>
    </div>
  );
}
