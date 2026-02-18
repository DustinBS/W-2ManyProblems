import { ACTIONS } from '../state/reducer';
import { Card, NumberInput, ToggleGroup, CurrencyInput, fieldSetter } from './Inputs';

export default function IncomePanel({ state, dispatch }) {
  const set = (field) => fieldSetter(dispatch, field);

  return (
    <Card title="Income">
      <div className="space-y-4">
        <ToggleGroup
          label="Calculation Mode"
          value={state.incomeMode}
          onChange={(v) => dispatch({ type: ACTIONS.SET_INCOME_MODE, value: v })}
          options={[
            { value: 'simple', label: 'Annual Salary' },
            { value: 'timeline', label: 'Timeline' },
          ]}
        />

        {state.incomeMode === 'simple' ? (
          <SimpleMode state={state} set={set} />
        ) : (
          <TimelineMode state={state} dispatch={dispatch} set={set} />
        )}
      </div>
    </Card>
  );
}

function SimpleMode({ state, set }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <CurrencyInput
        label="Salary"
        value={state.annualSalary}
        onChange={set('annualSalary')}
        min={0}
        step={1000}
        payPeriod={state.payPeriod}
      />
      <CurrencyInput
        label="Bonus"
        value={state.annualBonus}
        onChange={set('annualBonus')}
        min={0}
        step={500}
        payPeriod={state.payPeriod}
      />
    </div>
  );
}

function TimelineMode({ state, dispatch, set }) {
  return (
    <div className="space-y-3">
      <NumberInput
        label="Tax Year"
        value={state.timelineYear}
        onChange={set('timelineYear')}
        min={2020}
        max={2040}
        prefix=""
        className="w-32"
      />

      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-400">Salary Events</div>
        {state.timelineEvents.map((event) => (
          <TimelineEvent
            key={event.id}
            event={event}
            dispatch={dispatch}
            canRemove={state.timelineEvents.length > 1}
          />
        ))}
      </div>

      <button
        onClick={() => dispatch({ type: ACTIONS.ADD_TIMELINE_EVENT })}
        className="w-full py-1.5 px-3 text-sm border border-dashed border-gray-700 rounded text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
      >
        + Add Salary Event
      </button>
    </div>
  );
}

function TimelineEvent({ event, dispatch, canRemove }) {
  const update = (field, value) =>
    dispatch({ type: ACTIONS.UPDATE_TIMELINE_EVENT, id: event.id, field, value });

  return (
    <div className="flex items-end gap-2 p-3 bg-gray-800/50 rounded border border-gray-800">
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-xs text-gray-500">Effective Date</label>
        <input
          type="date"
          value={event.effectiveDate}
          onChange={(e) => update('effectiveDate', e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-xs text-gray-500">Annual Salary</label>
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-sm">$</span>
          <input
            type="number"
            value={event.baseSalary}
            onChange={(e) => update('baseSalary', parseFloat(e.target.value) || 0)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1 w-28">
        <label className="text-xs text-gray-500">Bonus</label>
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-sm">$</span>
          <input
            type="number"
            value={event.oneTimeBonus}
            onChange={(e) => update('oneTimeBonus', parseFloat(e.target.value) || 0)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
      {canRemove && (
        <button
          onClick={() => dispatch({ type: ACTIONS.REMOVE_TIMELINE_EVENT, id: event.id })}
          className="text-gray-600 hover:text-red-400 text-lg leading-none pb-1"
          title="Remove event"
        >
          x
        </button>
      )}
    </div>
  );
}
