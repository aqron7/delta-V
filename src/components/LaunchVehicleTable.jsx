import { Check, X } from 'lucide-react';
import { useMission } from '../hooks/useMission.jsx';
import { LAUNCH_VEHICLES, payloadAtC3 } from '../physics/vehicles.js';

export default function LaunchVehicleTable() {
  const { results, payloadMass } = useMission();
  const c3 = results?.c3 ?? 0;

  const rows = LAUNCH_VEHICLES
    .map((v) => {
      const capacity = payloadAtC3(v, c3);
      return { ...v, capacity, feasible: capacity >= payloadMass && payloadMass > 0 };
    })
    .sort((a, b) => b.capacity - a.capacity);

  const recommended = rows.find((r) => r.feasible)?.id;

  return (
    <div className="panel">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <div className="label mb-0.5">launch vehicle compatibility</div>
          <div className="text-xs text-[var(--text-secondary)]">
            ranked by payload capacity at mission C3
          </div>
        </div>
        <div className="text-right">
          <div className="mono text-sm">{c3.toFixed(2)} <span className="label">km²/s²</span></div>
          <div className="label mt-0.5">mission c3 · <span className="mono">{payloadMass.toLocaleString()} kg</span> payload</div>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-[var(--border)]">
            <th className="px-5 py-3 font-normal label w-8">#</th>
            <th className="px-5 py-3 font-normal label">Vehicle</th>
            <th className="px-5 py-3 font-normal label">Operator</th>
            <th className="px-5 py-3 font-normal label text-right">Capacity at C3</th>
            <th className="px-5 py-3 font-normal label text-center">Feasible</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id}
              className={`border-t border-[var(--border)] transition-colors hover:bg-[var(--bg-elevated)] ${
                recommended === row.id ? 'bg-[var(--bg-elevated)]' : ''
              }`}
            >
              <td className="px-5 py-3.5 label">{idx + 1}</td>
              <td className="px-5 py-3.5">
                <div className="font-medium">{row.name}</div>
                {recommended === row.id && (
                  <div className="text-xs mt-0.5" style={{ color: 'var(--accent-green)' }}>
                    recommended for this mission
                  </div>
                )}
              </td>
              <td className="px-5 py-3.5 text-[var(--text-secondary)]">{row.operator}</td>
              <td className="px-5 py-3.5 mono text-right">
                {Math.round(row.capacity).toLocaleString()}
                <span className="label ml-1.5">kg</span>
              </td>
              <td className="px-5 py-3.5 text-center">
                {row.feasible ? (
                  <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--accent-green)' }}>
                    <Check size={13} />
                    <span className="label" style={{ color: 'var(--accent-green)' }}>GO</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--accent-red)' }}>
                    <X size={13} />
                    <span className="label" style={{ color: 'var(--accent-red)' }}>NO-GO</span>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
