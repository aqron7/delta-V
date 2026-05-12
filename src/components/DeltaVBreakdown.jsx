import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { useMission } from '../hooks/useMission.jsx';

export default function DeltaVBreakdown() {
  const ref = useRef(null);
  const { results } = useMission();

  useEffect(() => {
    if (!ref.current) return;
    const phases = [];
    const values = [];

    if (results?.dvDeparture) {
      phases.push('Departure');
      values.push(results.dvDeparture);
    }
    if (results?.dvArrival) {
      phases.push('Arrival');
      values.push(results.dvArrival);
    }

    const cumulative = values.reduce((a, b) => a + b, 0);

    const trace = {
      type: 'bar',
      orientation: 'h',
      x: values,
      y: phases,
      marker: {
        color: values.map((v) => {
          // cyan → orange gradient (low dv → high dv)
          const t = Math.min(1, v / 4000);
          const r = Math.round(34 + (249 - 34) * t);
          const g = Math.round(211 + (115 - 211) * t);
          const b = Math.round(238 + (22 - 238) * t);
          return `rgb(${r}, ${g}, ${b})`;
        }),
      },
      text: values.map((v) => `${Math.round(v)} m/s`),
      textposition: 'outside',
      hoverinfo: 'x',
    };

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'JetBrains Mono, monospace', color: '#e8f0ff', size: 11 },
      margin: { l: 80, r: 80, t: 30, b: 40 },
      height: 240,
      xaxis: {
        title: { text: 'Δv (m/s)', font: { size: 10 } },
        gridcolor: '#1e2d45',
        zerolinecolor: '#1e2d45',
        color: '#6b7fa3',
      },
      yaxis: { color: '#e8f0ff', automargin: true },
      title: {
        text: `Δv breakdown — total ${Math.round(cumulative)} m/s`,
        font: { size: 12, color: '#6b7fa3' },
        x: 0.02,
      },
      showlegend: false,
    };

    Plotly.react(ref.current, [trace], layout, { displayModeBar: false, responsive: true });
  }, [results]);

  return (
    <div className="panel p-3">
      <div ref={ref} />
    </div>
  );
}
