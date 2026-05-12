import { useMission } from '../hooks/useMission.jsx';
import { fmtDate } from '../utils/format.js';

function Stat({ label, value, unit }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mono text-2xl">
        {value}
        {unit && <span className="text-base ml-1 text-[var(--text-secondary)]">{unit}</span>}
      </div>
    </div>
  );
}

function fmt(n, d = 0) {
  if (n == null || !isFinite(n)) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function MissionSummary() {
  const { results, selected } = useMission();
  const r = results || {};

  return (
    <div className="card p-5 space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="total Δv" value={fmt(r.dvTotal)} unit="m/s" />
        <Stat label="c3" value={fmt(r.c3, 2)} unit="km²/s²" />
        <Stat label="tof" value={r.tof ? Math.round(r.tof / 86400) : '—'} unit="days" />
      </div>
      <div className="h-px bg-[var(--border)]" />
      <div className="grid grid-cols-2 gap-4">
        <Stat label="departure burn" value={fmt(r.dvDeparture)} unit="m/s" />
        <Stat label="arrival burn"   value={fmt(r.dvArrival)}   unit="m/s" />
      </div>
      <div className="h-px bg-[var(--border)]" />
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="label">launch</div>
          <div className="mono">{selected?.launchDate ? fmtDate(selected.launchDate) : '—'}</div>
        </div>
        <div>
          <div className="label">arrival</div>
          <div className="mono">{selected?.arrivalDate ? fmtDate(selected.arrivalDate) : '—'}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="label">v∞ departure</div>
          <div className="mono">{r.vInfDep != null ? `${r.vInfDep.toFixed(2)} km/s` : '—'}</div>
        </div>
        <div>
          <div className="label">v∞ arrival</div>
          <div className="mono">{r.vInfArr != null ? `${r.vInfArr.toFixed(2)} km/s` : '—'}</div>
        </div>
      </div>
    </div>
  );
}
