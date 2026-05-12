import { useMission } from '../hooks/useMission.jsx';
import { fmtDate } from '../utils/format.js';

const DESTINATIONS = [
  { id: 'mars',    label: 'Mars' },
  { id: 'venus',   label: 'Venus' },
  { id: 'mercury', label: 'Mercury' },
  { id: 'jupiter', label: 'Jupiter' },
];

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
      <label className="block space-y-1">
        <span className="label">Origin</span>
        <select value={m.origin} onChange={(e) => dispatch({ type: 'SET_ORIGIN', value: e.target.value })}>
          <option value="earth">Earth</option>
        </select>
      </label>

      <label className="block space-y-1">
        <span className="label">Destination</span>
        <select value={m.destination} onChange={(e) => dispatch({ type: 'SET_DESTINATION', value: e.target.value })}>
          {DESTINATIONS.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="label">Payload mass (kg)</span>
        <input
          type="number"
          min="0"
          step="100"
          value={m.payloadMass}
          onChange={(e) => dispatch({ type: 'SET_PAYLOAD', value: Math.max(0, Number(e.target.value) || 0) })}
        />
      </label>

      <div className="space-y-2">
        <div className="label">Launch window</div>
        <DateField label="start" value={m.launchWindow.start}
          onChange={(d) => dispatch({ type: 'SET_LAUNCH_WINDOW', value: { ...m.launchWindow, start: d } })} />
        <DateField label="end" value={m.launchWindow.end}
          onChange={(d) => dispatch({ type: 'SET_LAUNCH_WINDOW', value: { ...m.launchWindow, end: d } })} />
      </div>

      <div className="space-y-2">
        <div className="label">Arrival window</div>
        <DateField label="start" value={m.arrivalWindow.start}
          onChange={(d) => dispatch({ type: 'SET_ARRIVAL_WINDOW', value: { ...m.arrivalWindow, start: d } })} />
        <DateField label="end" value={m.arrivalWindow.end}
          onChange={(d) => dispatch({ type: 'SET_ARRIVAL_WINDOW', value: { ...m.arrivalWindow, end: d } })} />
      </div>

      <div className="space-y-2">
        <div className="label">Transfer type</div>
        <div className="flex flex-col gap-1.5 text-[var(--text-primary)]">
          {[
            { id: 'hohmann',     label: 'Hohmann' },
            { id: 'bi-elliptic', label: 'Bi-elliptic' },
            { id: 'lambert',     label: 'Lambert optimal' },
          ].map((t) => (
            <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="transferType"
                value={t.id}
                checked={m.transferType === t.id}
                onChange={() => dispatch({ type: 'SET_TRANSFER_TYPE', value: t.id })}
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
