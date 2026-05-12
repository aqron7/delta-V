import { Rocket } from 'lucide-react';
import { useMission } from '../../hooks/useMission.jsx';

const TABS = [
  { id: 'interplanetary', label: 'Interplanetary' },
  { id: 'earth_orbit',    label: 'Earth Orbit' },
];

export default function Header() {
  const { missionType, dispatch } = useMission();
  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] px-6 h-14 bg-[var(--bg-surface)]">
      <div className="flex items-center gap-3">
        <Rocket size={20} className="text-[var(--text-mono)]" />
        <span className="font-mono text-[var(--text-mono)] text-base tracking-wide">delta-v</span>
        <span className="label ml-3">mission design</span>
      </div>
      <nav className="flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => dispatch({ type: 'SET_MISSION_TYPE', value: tab.id })}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              missionType === tab.id
                ? 'bg-[var(--bg-elevated)] text-[var(--text-mono)] border border-[var(--border)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="label">v0.1.0</div>
    </header>
  );
}
