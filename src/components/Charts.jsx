import { fmt, pct } from '../utils/format';
import { FEDERAL_BRACKETS_2026 } from '../engine/taxEngine';

/**
 * SVG-based bar chart for tax bracket visualization
 */
export function TaxBracketChart({ taxableIncome, filingStatus }) {
  const brackets = FEDERAL_BRACKETS_2026[filingStatus];
  if (!brackets || taxableIncome <= 0) return null;

  const maxIncome = Math.max(taxableIncome * 1.2, brackets[3]?.max || 200000);

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-400">Federal Tax Brackets</div>
      <div className="space-y-1">
        {brackets.map((bracket, i) => {
          if (bracket.min >= maxIncome) return null;
          const bracketWidth = Math.min(bracket.max, maxIncome) - bracket.min;
          const filledWidth = Math.max(0, Math.min(taxableIncome, bracket.max) - bracket.min);
          const widthPct = (bracketWidth / maxIncome) * 100;
          const filledPct = bracketWidth > 0 ? (filledWidth / bracketWidth) * 100 : 0;
          const isActive = taxableIncome > bracket.min;

          return (
            <div key={i} className="flex items-center gap-2">
              <div className="w-12 text-right text-xs text-gray-500 font-mono">
                {(bracket.rate * 100).toFixed(0)}%
              </div>
              <div
                className="h-5 bg-gray-800 rounded overflow-hidden relative"
                style={{ width: `${Math.max(widthPct, 5)}%` }}
              >
                <div
                  className={`h-full rounded transition-all ${isActive ? 'bg-blue-600' : 'bg-gray-700'}`}
                  style={{ width: `${filledPct}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 font-mono whitespace-nowrap">
                {bracket.max === Infinity ? `${fmt(bracket.min)}+` : `${fmt(bracket.min)} - ${fmt(bracket.max)}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Wealth projection mini-chart using SVG
 */
export function WealthProjectionChart({ projection, fireTarget }) {
  if (!projection || projection.length === 0) return null;

  const maxBalance = Math.max(
    ...projection.map((p) => p.balance),
    fireTarget || 0
  );
  const chartWidth = 600;
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const xScale = (i) => padding.left + (i / (projection.length - 1)) * innerW;
  const yScale = (v) => padding.top + innerH - (v / maxBalance) * innerH;

  // Balance line
  const balancePath = projection
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(p.balance).toFixed(1)}`)
    .join(' ');

  // Contributions line
  const contribPath = projection
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(p.contributions).toFixed(1)}`)
    .join(' ');

  // FIRE target line
  const fireY = fireTarget && fireTarget <= maxBalance ? yScale(fireTarget) : null;

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-400">Wealth Projection</div>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full"
        style={{ maxHeight: '200px' }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
          <g key={frac}>
            <line
              x1={padding.left}
              y1={yScale(maxBalance * frac)}
              x2={chartWidth - padding.right}
              y2={yScale(maxBalance * frac)}
              stroke="#1f2937"
              strokeWidth="1"
            />
            <text
              x={padding.left - 5}
              y={yScale(maxBalance * frac) + 4}
              textAnchor="end"
              fill="#6b7280"
              fontSize="9"
              fontFamily="monospace"
            >
              {fmt(maxBalance * frac)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {projection
          .filter((_, i) => i % 5 === 0 || i === projection.length - 1)
          .map((p, _, arr) => (
            <text
              key={p.year}
              x={xScale(p.year - 1)}
              y={chartHeight - 5}
              textAnchor="middle"
              fill="#6b7280"
              fontSize="9"
              fontFamily="monospace"
            >
              {p.year}y
            </text>
          ))}

        {/* Contributions area */}
        <path
          d={`${contribPath} L ${xScale(projection.length - 1).toFixed(1)} ${yScale(0).toFixed(1)} L ${xScale(0).toFixed(1)} ${yScale(0).toFixed(1)} Z`}
          fill="#1e40af"
          fillOpacity="0.15"
        />

        {/* Contributions line */}
        <path d={contribPath} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,3" />

        {/* Balance line */}
        <path d={balancePath} fill="none" stroke="#10b981" strokeWidth="2" />

        {/* FIRE target */}
        {fireY !== null && (
          <>
            <line
              x1={padding.left}
              y1={fireY}
              x2={chartWidth - padding.right}
              y2={fireY}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="6,4"
            />
            <text
              x={chartWidth - padding.right}
              y={fireY - 5}
              textAnchor="end"
              fill="#f59e0b"
              fontSize="9"
              fontFamily="monospace"
            >
              FIRE {fmt(fireTarget)}
            </text>
          </>
        )}
      </svg>
      <div className="flex gap-4 text-xs text-gray-500 justify-center">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-emerald-500" /> Portfolio
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-blue-500 border-dashed" style={{ borderTop: '1px dashed #3b82f6', height: 0 }} /> Contributions
        </span>
        {fireTarget > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-yellow-500" /> FIRE Target
          </span>
        )}
      </div>
    </div>
  );
}
