import MissionConfig from '../MissionConfig.jsx';

export default function Sidebar() {
  return (
    <aside
      className="w-64 flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-surface)] overflow-y-auto"
    >
      <div className="px-4 pt-4 pb-2">
        <span className="label">configure mission</span>
      </div>
      <MissionConfig />
    </aside>
  );
}
