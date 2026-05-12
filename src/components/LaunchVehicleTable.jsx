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
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <div className="label">launch vehicle compatibility</div>
        <div className="text-xs text-[var(--text-secondary)]">
          C3 = <span className="mono">{c3.toFixed(2)}</span> km²/s² · payload <span className="mono">{payloadMass}</span> kg
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="text-[var(--text-secondary)]">
          <tr className="text-left">
            <th className="px-4 py-2 font-normal label">Vehicle</th>
            <th className="px-4 py-2 font-normal label">Operator</th>
            <th className="px-4 py-2 font-normal label text-right">Capacity @ C3</th>
            <th className="px-4 py-2 font-normal label">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={`border-t border-[var(--border)] ${
                recommended === row.id ? 'bg-[var(--bg-elevated)]' : ''
              }`}
            >
              <td className="px-4 py-2">
                {row.name}
                {recommended === row.id && (
                  <span className="ml-2 text-xs text-[var(--accent-green)]">recommended</span>
                )}
              </td>
              <td className="px-4 py-2 text-[var(--text-secondary)]">{row.operator}</td>
              <td className="px-4 py-2 mono text-right">{Math.round(row.capacity).toLocaleString()} kg</td>
              <td className="px-4 py-2">
                {row.feasible ? (
                  <span className="inline-flex items-center gap-1 text-[var(--accent-green)]">
                    <Check size={14} /> go
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[var(--accent-red)]">
                    <X size={14} /> no-go
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
