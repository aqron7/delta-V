import { useEffect } from 'react';
import Header from './components/layout/Header.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import MissionSummary from './components/MissionSummary.jsx';
import DeltaVBreakdown from './components/DeltaVBreakdown.jsx';
import PorkchopPlot from './components/PorkchopPlot.jsx';
import OrbitVisualizer from './components/OrbitVisualizer.jsx';
import LaunchVehicleTable from './components/LaunchVehicleTable.jsx';
import { useMission } from './hooks/useMission.jsx';
import { usePorkchop } from './hooks/usePorkchop.js';

export default function App() {
  const mission = useMission();
  const { compute } = usePorkchop();

  // Auto-compute on load and whenever the relevant inputs change.
  useEffect(() => {
    if (mission.missionType !== 'interplanetary') return;
    compute({
      origin: mission.origin,
      destination: mission.destination,
      launchWindow: mission.launchWindow,
      arrivalWindow: mission.arrivalWindow,
    });
  }, [
    mission.missionType,
    mission.origin,
    mission.destination,
    mission.launchWindow,
    mission.arrivalWindow,
    compute,
  ]);

  return (
    <div className="h-full flex flex-col bg-[var(--bg-base)]">
      <Header />
      <div className="flex-1 grid grid-cols-[280px_1fr_360px] min-h-0">
        <Sidebar />
        <main className="overflow-y-auto p-5 space-y-5 min-w-0">
          <PorkchopPlot />
          <div className="grid grid-cols-2 gap-5">
            <OrbitVisualizer />
            <DeltaVBreakdown />
          </div>
          <LaunchVehicleTable />
        </main>
        <aside className="border-l border-[var(--border)] bg-[var(--bg-surface)] overflow-y-auto p-5 space-y-5">
          <MissionSummary />
        </aside>
      </div>
    </div>
  );
}
