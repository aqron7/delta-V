import { Rocket } from 'lucide-react';
import { useMission } from '../../hooks/useMission.jsx';

const TABS = [
  { id: 'interplanetary', label: 'Interplanetary' },
  { id: 'earth_orbit',    label: 'Earth Orbit' },
];

export default function Header() {
  const { missionType, computing, progress, dispatch } = useMission();
  const pct = Math.round((progress || 0) * 100);

  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] px-6 h-14 bg-[var(--bg-surface)] flex-shrink-0">
      <div className="flex items-center gap-3">
        <Rocket size={17} className="text-[var(--text-mono)]" />
        <span className="font-mono text-[var(--text-mono)] font-medium tracking-[0.18em] text-sm">DELTA-V</span>
        <span className="label opacity-50">|</span>
        <span className="label">mission design tool</span>
      </div>

      <nav className="flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => dispatch({ type: 'SET_MISSION_TYPE', value: tab.id })}
            className={`px-4 py-1.5 text-sm rounded transition-colors ${
              missionType === tab.id
                ? 'bg-[var(--bg-elevated)] text-[var(--text-mono)] border border-[var(--border)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        {computing ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-hot)] animate-pulse flex-shrink-0" />
            <span className="label" style={{ color: 'var(--accent-hot)' }}>COMPUTING</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-0.5 bg-[var(--border)] rounded overflow-hidden flex-shrink-0">
                <div
                  className="h-full bg-[var(--accent-cold)] progress-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="label w-8 text-right">{pct}%</span>
            </div>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] flex-shrink-0" />
            <span className="label" style={{ color: 'var(--accent-green)' }}>READY</span>
          </>
        )}
        <span className="label ml-1 opacity-40">v0.1.0</span>
      </div>
    </header>
  );
}
