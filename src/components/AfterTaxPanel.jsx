import { Card, NumberInput, CurrencyInput, fieldSetter } from './Inputs';

export default function AfterTaxPanel({ state, dispatch, irsLimits }) {
  const set = (field) => fieldSetter(dispatch, field);

  return (
    <Card title="After-Tax Investments">
      <div className="space-y-4">
        <CurrencyInput
          label="Roth IRA"
          value={state.rothIRA}
          onChange={set('rothIRA')}
          min={0}
          max={irsLimits.rothIRA}
          step={500}
          helpText={`${state.timelineYear} limit: $${irsLimits.rothIRA.toLocaleString()}`}
          payPeriod={state.payPeriod}
        />

        <CurrencyInput
          label="High-Yield Savings (HYSA)"
          value={state.hysa}
          onChange={set('hysa')}
          min={0}
          step={500}
          payPeriod={state.payPeriod}
        />

        <CurrencyInput
          label="Taxable Brokerage"
          value={state.brokerage}
          onChange={set('brokerage')}
          min={0}
          step={500}
          payPeriod={state.payPeriod}
        />
      </div>
    </Card>
  );
}
