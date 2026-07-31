import { useMission } from '../hooks/useMission.jsx';
import { fmtDate } from '../utils/format.js';

const DESTINATIONS = [
  { id: 'mars',    label: 'Mars',    color: '#f87171', symbol: '♂' },
  { id: 'venus',   label: 'Venus',   color: '#fbbf24', symbol: '♀' },
  { id: 'mercury', label: 'Mercury', color: '#94a3b8', symbol: '☿' },
  { id: 'jupiter', label: 'Jupiter', color: '#fb923c', symbol: '♃' },
];

const TRANSFER_TYPES = [
  { id: 'lambert',     label: 'Lambert optimal' },
  { id: 'hohmann',     label: 'Hohmann' },
  { id: 'bi-elliptic', label: 'Bi-elliptic' },
];

function SectionHeader({ children }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-[var(--text-mono)] text-xs font-mono opacity-60">›</span>
      <span className="label">{children}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <label className="block space-y-1">
      <span className="label">{label}</span>
      <input
        type="date"
        value={fmtDate(value)}
        onChange={(e) => onChange(new Date(e.target.value + 'T00:00:00Z'))}
      />
    </label>
  );
}

export default function MissionConfig() {
  const m = useMission();
  const { dispatch } = m;

  return (
    <div className="px-5 py-4 space-y-5 text-sm">

      <div className="space-y-2">
        <SectionHeader>origin</SectionHeader>
        <select
          value={m.origin}
          onChange={(e) => dispatch({ type: 'SET_ORIGIN', value: e.target.value })}
        >
          <option value="earth">Earth</option>
        </select>
      </div>

      <div className="space-y-2">
        <SectionHeader>destination</SectionHeader>
        <div className="grid grid-cols-2 gap-1.5">
          {DESTINATIONS.map((d) => {
            const active = m.destination === d.id;
            return (
              <button
                key={d.id}
                onClick={() => dispatch({ type: 'SET_DESTINATION', value: d.id })}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-all"
                style={active ? {
                  border: `1px solid ${d.color}`,
                  background: `${d.color}18`,
                  color: d.color,
                } : {
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span className="font-mono text-xs">{d.symbol}</span>
                <span>{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <SectionHeader>payload</SectionHeader>
        <label className="block space-y-1">
          <span className="label">mass (kg)</span>
          <input
            type="number"
            min="0"
            step="100"
            value={m.payloadMass}
            onChange={(e) => dispatch({ type: 'SET_PAYLOAD', value: Math.max(0, Number(e.target.value) || 0) })}
          />
        </label>
      </div>

      <div className="space-y-2">
        <SectionHeader>launch window</SectionHeader>
        <DateField label="start" value={m.launchWindow.start}
          onChange={(d) => dispatch({ type: 'SET_LAUNCH_WINDOW', value: { ...m.launchWindow, start: d } })} />
        <DateField label="end" value={m.launchWindow.end}
          onChange={(d) => dispatch({ type: 'SET_LAUNCH_WINDOW', value: { ...m.launchWindow, end: d } })} />
      </div>

      <div className="space-y-2">
        <SectionHeader>arrival window</SectionHeader>
        <DateField label="start" value={m.arrivalWindow.start}
          onChange={(d) => dispatch({ type: 'SET_ARRIVAL_WINDOW', value: { ...m.arrivalWindow, start: d } })} />
        <DateField label="end" value={m.arrivalWindow.end}
          onChange={(d) => dispatch({ type: 'SET_ARRIVAL_WINDOW', value: { ...m.arrivalWindow, end: d } })} />
      </div>

      <div className="space-y-2">
        <SectionHeader>transfer type</SectionHeader>
        <div className="flex flex-col gap-1">
          {TRANSFER_TYPES.map((t) => {
            const active = m.transferType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => dispatch({ type: 'SET_TRANSFER_TYPE', value: t.id })}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-sm transition-all"
                style={active ? {
                  border: '1px solid var(--text-mono)',
                  background: 'rgba(125, 211, 252, 0.08)',
                  color: 'var(--text-mono)',
                } : {
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: active ? 'var(--text-mono)' : 'var(--border)' }} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
