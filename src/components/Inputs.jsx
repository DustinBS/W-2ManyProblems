import { ACTIONS } from '../state/reducer';

/**
 * Reusable input components for the finance planner
 */

export function NumberInput({ label, value, onChange, min, max, step, prefix = '$', suffix, className = '', helpText }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-sm font-medium text-gray-400">{label}</label>}
      <div className="flex items-center gap-1">
        {prefix && <span className="text-gray-500 text-sm">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step || 1}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
        />
        {suffix && <span className="text-gray-500 text-sm">{suffix}</span>}
      </div>
      {helpText && <span className="text-xs text-gray-500">{helpText}</span>}
    </div>
  );
}

export function SelectInput({ label, value, onChange, options, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-sm font-medium text-gray-400">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ToggleGroup({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-400">{label}</label>}
      <div className="flex rounded overflow-hidden border border-gray-700">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
              value === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500"
      />
      <span className="text-sm text-gray-400">{label}</span>
    </label>
  );
}

export function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg p-5 ${className}`}>
      {title && <h3 className="text-lg font-semibold text-gray-200 mb-4 pb-2 border-b border-gray-800">{title}</h3>}
      {children}
    </div>
  );
}

export function StatRow({ label, value, highlight, subtext }) {
  return (
    <div className="flex justify-between items-baseline py-1">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-mono ${highlight ? 'text-green-400 font-semibold' : 'text-gray-200'}`}>
          {value}
        </span>
        {subtext && <div className="text-xs text-gray-500">{subtext}</div>}
      </div>
    </div>
  );
}

export function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-gray-800" />
      {label && <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>}
      <div className="flex-1 h-px bg-gray-800" />
    </div>
  );
}

/**
 * Dispatch helper to set a field
 */
export function fieldSetter(dispatch, field) {
  return (value) => dispatch({ type: ACTIONS.SET_FIELD, field, value });
}
