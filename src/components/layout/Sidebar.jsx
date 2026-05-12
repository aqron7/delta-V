import MissionConfig from '../MissionConfig.jsx';

export default function Sidebar() {
  return (
    <aside className="border-r border-[var(--border)] bg-[var(--bg-surface)] overflow-y-auto">
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <div className="label">mission configuration</div>
      </div>
      <MissionConfig />
    </aside>
  );
}
