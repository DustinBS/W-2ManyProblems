import { IRS_LIMITS_2026 } from '../engine/retirementMatch';
import { Card, NumberInput, fieldSetter } from './Inputs';

export default function AfterTaxPanel({ state, dispatch }) {
  const set = (field) => fieldSetter(dispatch, field);

  return (
    <Card title="After-Tax Investments">
      <div className="space-y-4">
        <NumberInput
          label="Roth IRA"
          value={state.rothIRA}
          onChange={set('rothIRA')}
          min={0}
          max={IRS_LIMITS_2026.rothIRA}
          step={500}
          helpText={`2026 limit: $${IRS_LIMITS_2026.rothIRA.toLocaleString()}`}
        />

        <NumberInput
          label="High-Yield Savings (HYSA)"
          value={state.hysa}
          onChange={set('hysa')}
          min={0}
          step={500}
        />

        <NumberInput
          label="Taxable Brokerage"
          value={state.brokerage}
          onChange={set('brokerage')}
          min={0}
          step={500}
        />
      </div>
    </Card>
  );
}
