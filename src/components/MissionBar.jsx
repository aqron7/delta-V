import { useMission } from '../hooks/useMission.jsx';
import { fmtDate } from '../utils/format.js';

function fmt(n, d = 0) {
  if (n == null || !isFinite(n)) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

function dvAccentColor(dvMs) {
  if (!dvMs || !isFinite(dvMs)) return 'var(--text-secondary)';
  const km = dvMs / 1000;
  if (km < 6)  return 'var(--accent-green)';
  if (km < 9)  return 'var(--text-mono)';
  if (km < 13) return 'var(--accent-hot)';
  return 'var(--accent-red)';
}

function Cell({ label, value, unit, valueColor, large }) {
  return (
    <div className="flex items-baseline gap-1.5 flex-shrink-0">
      <span className="label">{label}</span>
      <span
        className={`mono ${large ? 'text-base' : 'text-sm'}`}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
      {unit && <span className="label">{unit}</span>}
    </div>
  );
}

function Sep() {
  return <div className="w-px h-4 bg-[var(--border)] flex-shrink-0" />;
}

export default function MissionBar() {
  const { results, selected, computeMs } = useMission();
  const r = results || {};
  const color = dvAccentColor(r.dvTotal);

  return (
    <div
      className="h-11 flex items-center px-5 gap-5 border-t bg-[var(--bg-surface)] flex-shrink-0 overflow-x-auto"
      style={{ borderColor: r.dvTotal ? color : 'var(--border)', borderTopWidth: 1 }}
    >
      <Cell
        label="Δv"
        value={fmt(r.dvTotal)}
        unit="m/s"
        valueColor={color}
        large
      />
      <Sep />
      <Cell label="dep" value={fmt(r.dvDeparture)} unit="m/s" />
      <Cell label="+" value="+" />
      <Cell label="arr" value={fmt(r.dvArrival)} unit="m/s" />
      <Sep />
      <Cell label="c3" value={fmt(r.c3, 1)} unit="km²/s²" />
      <Sep />
      <Cell label="tof" value={r.tof ? Math.round(r.tof / 86400) : '—'} unit="days" />
      <Sep />
      <Cell label="launch" value={selected?.launchDate ? fmtDate(selected.launchDate) : '—'} />
      <Sep />
      <Cell label="arrival" value={selected?.arrivalDate ? fmtDate(selected.arrivalDate) : '—'} />
      <Sep />
      <Cell label="v∞" value={r.vInfArr != null ? r.vInfArr.toFixed(2) : '—'} unit="km/s" />
      {computeMs != null && (
        <>
          <Sep />
          <Cell label="computed" value={`${computeMs} ms`} />
        </>
      )}
    </div>
  );
}
