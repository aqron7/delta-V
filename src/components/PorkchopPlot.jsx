import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { useMission } from '../hooks/useMission.jsx';

function isoDays(t) { return new Date(t).toISOString().slice(0, 10); }

export default function PorkchopPlot() {
  const elRef = useRef(null);
  const { porkchop, computing, progress, dispatch } = useMission();

  useEffect(() => {
    if (!elRef.current || !porkchop) return;
    const g = porkchop;
    const x = Array.from(g.launchTimes,  isoDays);
    const y = Array.from(g.arrivalTimes, isoDays);
    const z = g.dvTotal.map((row) => Array.from(row, (v) => (isFinite(v) ? v / 1000 : null)));

    const trace = {
      type: 'contour',
      x, y, z,
      colorscale: [
        [0.0, '#22d3ee'], // cyan
        [0.3, '#34d399'], // green
        [0.5, '#facc15'], // yellow
        [0.75,'#f97316'], // orange
        [1.0, '#f87171'], // red
      ],
      contours: {
        coloring: 'heatmap',
        showlabels: true,
        labelfont: { family: 'JetBrains Mono', size: 10, color: '#0a0e1a' },
      },
      colorbar: {
        title: { text: 'Δv (km/s)', font: { color: '#6b7fa3', size: 10 } },
        tickfont: { color: '#6b7fa3', size: 10 },
        outlinewidth: 0,
      },
      hovertemplate: 'launch: %{x}<br>arrival: %{y}<br>Δv: %{z:.2f} km/s<extra></extra>',
    };

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: '#0a0e1a',
      font: { family: 'JetBrains Mono', color: '#e8f0ff', size: 11 },
      margin: { l: 80, r: 20, t: 36, b: 60 },
      height: 460,
      xaxis: { title: { text: 'launch date', font: { size: 11, color: '#6b7fa3' } }, gridcolor: '#1e2d45', color: '#6b7fa3' },
      yaxis: { title: { text: 'arrival date', font: { size: 11, color: '#6b7fa3' } }, gridcolor: '#1e2d45', color: '#6b7fa3' },
      title: { text: 'porkchop plot — total Δv (LEO → parking)', font: { size: 12, color: '#6b7fa3' }, x: 0.02 },
    };

    Plotly.react(elRef.current, [trace], layout, { displayModeBar: false, responsive: true });

    const el = elRef.current;
    const handler = (ev) => {
      const p = ev.points?.[0];
      if (!p) return;
      const i = p.pointIndex?.[1] ?? p.pointIndex; // x index
      const j = p.pointIndex?.[0];                 // y index
      if (i == null || j == null) return;
      dispatch({
        type: 'SET_SELECTED',
        value: {
          launchDate: new Date(g.launchTimes[i]),
          arrivalDate: new Date(g.arrivalTimes[j]),
        },
        results: {
          dvTotal:     g.dvTotal[j][i],
          dvDeparture: g.dvDep[j][i],
          dvArrival:   g.dvArr[j][i],
          c3:          g.c3[j][i],
          vInfDep:     g.vInfDep[j][i],
          vInfArr:     g.vInfArr[j][i],
          tof:         g.tof[j][i],
        },
      });
    };
    el.on?.('plotly_click', handler);
    return () => { el.removeAllListeners?.('plotly_click'); };
  }, [porkchop, dispatch]);

  return (
    <div className="panel p-3 relative">
      <div ref={elRef} style={{ minHeight: 460 }} />
      {computing && (
        <div className="absolute inset-3 flex items-center justify-center bg-[var(--bg-surface)]/80 rounded">
          <div className="text-center space-y-2">
            <div className="label">computing porkchop</div>
            <div className="w-64 h-1.5 bg-[var(--bg-base)] rounded overflow-hidden">
              <div
                className="h-full bg-[var(--text-mono)] transition-[width]"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="mono text-xs">{Math.round(progress * 100)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
