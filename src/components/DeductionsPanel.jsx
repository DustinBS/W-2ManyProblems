import { Card, NumberInput, CurrencyInput, ToggleGroup, fieldSetter } from './Inputs';

export default function DeductionsPanel({ state, dispatch, irsLimits }) {
  const set = (field) => fieldSetter(dispatch, field);

  return (
    <Card title="Pre-Tax Deductions">
      <div className="space-y-4">
        <CurrencyInput
          label="Medical Insurance Premium"
          value={state.medicalPremium}
          onChange={set('medicalPremium')}
          min={0}
          step={100}
          helpText="Pre-tax payroll deduction for health insurance"
          payPeriod={state.payPeriod}
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

          <CurrencyInput
            label="HSA Contribution"
            value={state.hsaContribution}
            onChange={set('hsaContribution')}
            min={0}
            max={state.hsaAccountType === 'family' ? irsLimits.hsaFamily : irsLimits.hsaIndividual}
            step={100}
            helpText={`${state.timelineYear} limit: ${state.hsaAccountType === 'family' ? '$' + irsLimits.hsaFamily.toLocaleString() : '$' + irsLimits.hsaIndividual.toLocaleString()}`}
            payPeriod={state.payPeriod}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <CurrencyInput
            label="Dental Premium"
            value={state.dentalPremium}
            onChange={set('dentalPremium')}
            min={0}
            step={50}
            helpText="Dental insurance"
            payPeriod={state.payPeriod}
          />
          <CurrencyInput
            label="Vision Premium"
            value={state.visionPremium}
            onChange={set('visionPremium')}
            min={0}
            step={50}
            helpText="Vision insurance"
            payPeriod={state.payPeriod}
          />
        </div>

        <CurrencyInput
          label="Other Pre-Tax Fees"
          value={state.otherPreTaxFees}
          onChange={set('otherPreTaxFees')}
          min={0}
          step={50}
          helpText="Other pre-tax payroll deductions (life ins, commuter, etc.)"
          payPeriod={state.payPeriod}
        />
      </div>
    </Card>
  );
}
