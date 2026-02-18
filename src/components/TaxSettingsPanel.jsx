import { STATE_TAX_DATA, getStateTaxDescription } from '../engine/taxEngine';
import { Card, NumberInput, SelectInput, ToggleGroup, Checkbox, fieldSetter } from './Inputs';

const STATE_OPTIONS = Object.entries(STATE_TAX_DATA)
  .sort((a, b) => a[1].name.localeCompare(b[1].name))
  .map(([code, data]) => ({
    value: code,
    label: `${code} - ${data.name}`,
  }));

const FILING_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'mfj', label: 'Married Filing Jointly' },
];

export default function TaxSettingsPanel({ state, dispatch }) {
  const set = (field) => fieldSetter(dispatch, field);

  return (
    <Card title="Tax Settings">
      <div className="space-y-4">
        <ToggleGroup
          label="Filing Status"
          value={state.filingStatus}
          onChange={set('filingStatus')}
          options={FILING_OPTIONS}
        />

        <SelectInput
          label="State"
          value={state.stateCode}
          onChange={set('stateCode')}
          options={STATE_OPTIONS}
        />

        <div className="text-xs text-gray-500">
          {getStateTaxDescription(state.stateCode)}
        </div>

        <Checkbox
          label="Override state tax with custom rate"
          checked={state.useStateOverride}
          onChange={set('useStateOverride')}
        />

        {state.useStateOverride && (
          <NumberInput
            label="State Tax Rate Override"
            value={state.stateOverrideRate !== null ? state.stateOverrideRate * 100 : 0}
            onChange={(v) => set('stateOverrideRate')(v / 100)}
            min={0}
            max={20}
            step={0.1}
            prefix=""
            suffix="%"
          />
        )}
      </div>
    </Card>
  );
}
