import { useEffect, useState } from 'react';
import Header from './components/layout/Header.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import MissionBar from './components/MissionBar.jsx';
import PorkchopPlot from './components/PorkchopPlot.jsx';
import OrbitVisualizer from './components/OrbitVisualizer.jsx';
import DeltaVBreakdown from './components/DeltaVBreakdown.jsx';
import LaunchVehicleTable from './components/LaunchVehicleTable.jsx';
import { useMission } from './hooks/useMission.jsx';
import { usePorkchop } from './hooks/usePorkchop.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('porkchop');
  const mission = useMission();
  const { compute } = usePorkchop();

  useEffect(() => {
    if (mission.missionType !== 'interplanetary') return;
    compute({
      origin: mission.origin,
      destination: mission.destination,
      launchWindow: mission.launchWindow,
      arrivalWindow: mission.arrivalWindow,
    });
  }, [
    mission.missionType, mission.origin, mission.destination,
    mission.launchWindow, mission.arrivalWindow, compute,
  ]);

  return (
    <div className="h-full flex flex-col bg-[var(--bg-base)]">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex min-h-0">
        <Sidebar />

        {/* Main content — each tab fills the pane */}
        <main className="flex-1 min-w-0 relative">

          {/* PORKCHOP — kept always-mounted so Plotly has dimensions */}
          <div
            className={`absolute inset-0 p-3 ${activeTab !== 'porkchop' ? 'invisible pointer-events-none' : ''}`}
          >
            <PorkchopPlot />
          </div>

          {/* TRAJECTORY — remounts on switch (Three.js needs fresh canvas) */}
          {activeTab === 'trajectory' && (
            <div className="absolute inset-0 p-3 flex flex-col gap-3">
              <div className="flex-1 min-h-0">
                <OrbitVisualizer />
              </div>
              <div className="flex-shrink-0" style={{ height: 196 }}>
                <DeltaVBreakdown />
              </div>
            </div>
          )}

          {/* VEHICLES */}
          <div
            className={`absolute inset-0 p-3 overflow-auto ${activeTab !== 'vehicles' ? 'hidden' : ''}`}
          >
            <LaunchVehicleTable />
          </div>

        </main>
      </div>

      <MissionBar />
    </div>
  );
}
