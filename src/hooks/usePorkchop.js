import { useCallback, useEffect, useRef } from 'react';
import PorkchopWorker from '../workers/porkchop.worker.js?worker';
import { useMission } from './useMission.jsx';

const GRID_SIZE = 60;

function linspaceTime(start, end, n) {
  const t0 = start.getTime();
  const t1 = end.getTime();
  const arr = new Float64Array(n);
  for (let i = 0; i < n; i++) arr[i] = t0 + ((t1 - t0) * i) / (n - 1);
  return arr;
}

export function usePorkchop() {
  const { dispatch } = useMission();
  const workerRef = useRef(null);
  const requestIdRef = useRef(0);
  const latestRef = useRef(0);

  useEffect(() => {
    const w = new PorkchopWorker();
    workerRef.current = w;
    w.onmessage = ({ data }) => {
      // Drop stale results from superseded requests.
      if (data?.requestId !== latestRef.current && data?.requestId != null) return;
      if (data.type === 'progress') {
        dispatch({ type: 'SET_PROGRESS', value: data.pct });
      } else if (data.type === 'result') {
        dispatch({ type: 'SET_PORKCHOP', value: data.grid });
        // Auto-select the global minimum cell so MissionSummary populates on first load.
        const g = data.grid;
        let bestI = -1, bestJ = -1, bestV = Infinity;
        for (let j = 0; j < g.dvTotal.length; j++) {
          for (let i = 0; i < g.dvTotal[j].length; i++) {
            const v = g.dvTotal[j][i];
            if (isFinite(v) && v < bestV) { bestV = v; bestI = i; bestJ = j; }
          }
        }
        if (bestI >= 0) {
          dispatch({
            type: 'SET_SELECTED',
            value: {
              launchDate: new Date(g.launchTimes[bestI]),
              arrivalDate: new Date(g.arrivalTimes[bestJ]),
            },
            results: {
              dvTotal: g.dvTotal[bestJ][bestI],
              dvDeparture: g.dvDep[bestJ][bestI],
              dvArrival: g.dvArr[bestJ][bestI],
              c3: g.c3[bestJ][bestI],
              vInfDep: g.vInfDep[bestJ][bestI],
              vInfArr: g.vInfArr[bestJ][bestI],
              tof: g.tof[bestJ][bestI],
            },
          });
        }
      }
    };
    return () => { w.terminate(); workerRef.current = null; };
  }, [dispatch]);

  const compute = useCallback(({ origin, destination, launchWindow, arrivalWindow }) => {
    if (!workerRef.current) return;
    const requestId = ++requestIdRef.current;
    latestRef.current = requestId;
    const launchTimes  = linspaceTime(launchWindow.start, launchWindow.end, GRID_SIZE);
    const arrivalTimes = linspaceTime(arrivalWindow.start, arrivalWindow.end, GRID_SIZE);
    dispatch({ type: 'SET_COMPUTING', value: true });
    workerRef.current.postMessage({
      type: 'compute',
      requestId,
      params: {
        origin,
        destination,
        launchTimes: Array.from(launchTimes),
        arrivalTimes: Array.from(arrivalTimes),
      },
    });
  }, [dispatch]);

  return { compute };
}
