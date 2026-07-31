import { useMission } from '../hooks/useMission.jsx';
import { fmtDate } from '../utils/format.js';

function fmt(n, d = 0) {
  if (n == null || !isFinite(n)) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

function dvMeta(dvMs) {
  if (!dvMs || !isFinite(dvMs)) return { color: 'var(--text-secondary)', glow: '', label: 'NO SOLUTION' };
  const km = dvMs / 1000;
  if (km < 6)  return { color: 'var(--accent-green)',  glow: 'glow-green',  label: 'OPTIMAL' };
  if (km < 9)  return { color: 'var(--text-mono)',     glow: 'glow-cyan',   label: 'FEASIBLE' };
  if (km < 13) return { color: 'var(--accent-hot)',    glow: 'glow-orange', label: 'DEMANDING' };
  return           { color: 'var(--accent-red)',    glow: '',            label: 'HIGH COST' };
}

function StatRow({ label, value, unit, size = 'text-xl' }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className={`mono ${size} leading-tight`}>
        {value}
        {unit && <span className="text-sm ml-1.5 text-[var(--text-secondary)]">{unit}</span>}
      </div>
    </div>
  );
}

export default function MissionSummary() {
  const { results, selected } = useMission();
  const r = results || {};
  const meta = dvMeta(r.dvTotal);

  return (
    <div className="card p-5 space-y-5 relative overflow-hidden"
         style={{ borderTopColor: meta.color, borderTopWidth: 2 }}>

      {/* Status badge */}
      <div className="flex items-center justify-between">
        <span className="label">mission summary</span>
        <span className="text-xs font-mono" style={{ color: meta.color }}>
          ● {meta.label}
        </span>
      </div>

      {/* Hero ΔV */}
      <div className="text-center py-3">
        <div className="label mb-2">total mission ΔV</div>
        <div
          key={r.dvTotal}
          className={`mono font-medium leading-none num-flash ${meta.glow}`}
          style={{ fontSize: '3.5rem', color: meta.color }}
        >
          {fmt(r.dvTotal)}
        </div>
        <div className="label mt-2">m / s</div>
      </div>

      <div className="h-px bg-[var(--border)]" />

      {/* Departure / Arrival split */}
      <div className="grid grid-cols-2 gap-4">
        <StatRow label="departure burn" value={fmt(r.dvDeparture)} unit="m/s" />
        <StatRow label="arrival burn"   value={fmt(r.dvArrival)}   unit="m/s" />
      </div>

      <div className="h-px bg-[var(--border)]" />

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="label">c3</div>
          <div className="mono text-base leading-tight">{fmt(r.c3, 1)}</div>
          <div className="label">km²/s²</div>
        </div>
        <div>
          <div className="label">tof</div>
          <div className="mono text-base leading-tight">
            {r.tof ? Math.round(r.tof / 86400) : '—'}
          </div>
          <div className="label">days</div>
        </div>
        <div>
          <div className="label">v∞ arr</div>
          <div className="mono text-base leading-tight">
            {r.vInfArr != null ? r.vInfArr.toFixed(2) : '—'}
          </div>
          <div className="label">km/s</div>
        </div>
      </div>

      <div className="h-px bg-[var(--border)]" />

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="label">launch</div>
          <div className="mono text-xs mt-0.5">
            {selected?.launchDate ? fmtDate(selected.launchDate) : '—'}
          </div>
        </div>
        <div>
          <div className="label">arrival</div>
          <div className="mono text-xs mt-0.5">
            {selected?.arrivalDate ? fmtDate(selected.arrivalDate) : '—'}
          </div>
        </div>
      </div>

      <div className="h-px bg-[var(--border)]" />

      {/* v∞ departure */}
      <div>
        <div className="label">v∞ departure</div>
        <div className="mono text-base">
          {r.vInfDep != null ? `${r.vInfDep.toFixed(2)} km/s` : '—'}
        </div>
      </div>
    </div>
  );
}
