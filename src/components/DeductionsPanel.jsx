import { IRS_LIMITS_2026 } from '../engine/retirementMatch';
import { Card, NumberInput, ToggleGroup, fieldSetter } from './Inputs';

export default function DeductionsPanel({ state, dispatch }) {
  const set = (field) => fieldSetter(dispatch, field);

  return (
    <Card title="Pre-Tax Deductions">
      <div className="space-y-4">
        <NumberInput
          label="Annual Medical Insurance Premium"
          value={state.medicalPremium}
          onChange={set('medicalPremium')}
          min={0}
          step={100}
          helpText="Pre-tax payroll deduction for health insurance"
        />

        <div className="space-y-2">
          <ToggleGroup
            label="HSA Account Type"
            value={state.hsaAccountType}
            onChange={set('hsaAccountType')}
            options={[
              { value: 'individual', label: 'Individual' },
              { value: 'family', label: 'Family' },
            ]}
          />

          <NumberInput
            label="Annual HSA Contribution"
            value={state.hsaContribution}
            onChange={set('hsaContribution')}
            min={0}
            max={state.hsaAccountType === 'family' ? IRS_LIMITS_2026.hsaFamily : IRS_LIMITS_2026.hsaIndividual}
            step={100}
            helpText={`2026 limit: ${state.hsaAccountType === 'family' ? '$' + IRS_LIMITS_2026.hsaFamily.toLocaleString() : '$' + IRS_LIMITS_2026.hsaIndividual.toLocaleString()}`}
          />
        </div>
      </div>
    </Card>
  );
}
