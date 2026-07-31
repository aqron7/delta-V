import { Rocket } from 'lucide-react';
import { useMission } from '../../hooks/useMission.jsx';

const TABS = [
  { id: 'porkchop',   label: 'PORKCHOP' },
  { id: 'trajectory', label: 'TRAJECTORY' },
  { id: 'vehicles',   label: 'VEHICLES' },
];

const DEST_COLORS = {
  mars:    '#f87171',
  venus:   '#fbbf24',
  mercury: '#94a3b8',
  jupiter: '#fb923c',
};

export default function Header({ activeTab, setActiveTab }) {
  const { origin, destination, computing, progress } = useMission();
  const pct  = Math.round((progress || 0) * 100);
  const dCol = DEST_COLORS[destination] ?? 'var(--text-primary)';

  return (
    <header className="h-12 flex items-center border-b border-[var(--border)] bg-[var(--bg-surface)] flex-shrink-0">

      {/* Branding */}
      <div className="flex items-center gap-2 px-5 flex-shrink-0">
        <Rocket size={15} className="text-[var(--text-mono)]" />
        <span className="font-mono font-semibold tracking-[0.22em] text-[13px] text-[var(--text-mono)]">
          DELTA-V
        </span>
      </div>

      <div className="w-px h-5 bg-[var(--border)] flex-shrink-0" />

      {/* View tabs */}
      <nav className="flex h-full">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 h-full text-[11px] font-mono tracking-[0.14em] border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[var(--accent-cold)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Mission route */}
      <div className="flex items-center gap-1.5 px-5 flex-shrink-0">
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {origin.toUpperCase()}
        </span>
        <span className="text-[var(--text-secondary)] text-xs">→</span>
        <span className="font-mono text-xs font-medium" style={{ color: dCol }}>
          {destination.toUpperCase()}
        </span>
      </div>

      <div className="w-px h-5 bg-[var(--border)] flex-shrink-0" />

      {/* Computing status */}
      <div className="flex items-center gap-3 px-5 flex-shrink-0">
        {computing ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-hot)] animate-pulse flex-shrink-0" />
            <span className="label" style={{ color: 'var(--accent-hot)' }}>COMPUTING</span>
            <div className="flex items-center gap-1.5">
              <div className="w-20 h-0.5 bg-[var(--border)] rounded overflow-hidden">
                <div
                  className="h-full bg-[var(--accent-cold)] progress-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="label w-7 text-right">{pct}%</span>
            </div>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent-green)' }} />
            <span className="label" style={{ color: 'var(--accent-green)' }}>READY</span>
          </>
        )}
      </div>

    </header>
  );
}
