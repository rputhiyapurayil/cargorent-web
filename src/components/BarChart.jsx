import { useState } from 'react';

/**
 * Single-series vertical bar chart (one hue, no legend; the card title names the series).
 * rows: [{ label, value, sub }]. Hover/focus a column to see its exact value.
 */
export default function BarChart({ rows, format = (v) => v, height = 200, ariaLabel }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...rows.map((r) => Number(r.value)));
  const ticks = [max, max / 2, 0];
  const every = Math.ceil(rows.length / 8); // label at most ~8 x-axis ticks

  return (
    <div className="barchart" role="img" aria-label={ariaLabel}>
      <div className="barchart-y">{ticks.map((t, i) => <span key={i}>{format(t)}</span>)}</div>
      <div className="barchart-plot" style={{ height }}>
        <div className="barchart-grid"><i /><i /><i /></div>
        {rows.map((r, i) => (
          <div key={i} className={`barchart-col ${hover === i ? 'hover' : ''}`} tabIndex={0}
               onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
               onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
            <div className="barchart-bar" style={{ height: `${(Number(r.value) / max) * 100}%` }} />
            {hover === i && (
              <div className={`barchart-tip ${i > rows.length / 2 ? 'left' : ''}`}>
                <strong>{format(r.value)}</strong><span>{r.label}{r.sub ? ` · ${r.sub}` : ''}</span>
              </div>
            )}
            <div className="barchart-x">{i % every === 0 ? r.short ?? r.label : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Horizontal bars inside a table, so every value is readable as text too. */
export function BarTable({ rows, columns, valueKey, format }) {
  const max = Math.max(1, ...rows.map((r) => Number(r[valueKey])));
  return (
    <table className="table bar-table">
      <thead><tr>{columns.map((c) => <th key={c.key} className={c.num ? 'num' : ''}>{c.label}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {columns.map((c) => (
              <td key={c.key} className={c.num ? 'num' : ''}>
                {c.key === valueKey ? (
                  <div className="bar-cell">
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${(Number(r[valueKey]) / max) * 100}%` }} /></div>
                    <span>{format(r[valueKey])}</span>
                  </div>
                ) : c.render ? c.render(r) : r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
