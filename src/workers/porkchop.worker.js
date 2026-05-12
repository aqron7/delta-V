import { lambert } from '../physics/lambert.js';
import { BODIES, GM_SUN, AU, PARKING_ORBIT } from '../physics/constants.js';
import { planetPosition, dateToJulian } from '../physics/ephemeris.js';
import { departureDeltaV, arrivalDeltaV } from '../physics/orbital.js';

// Planet velocity in circular coplanar orbit: perpendicular to radius, prograde (CCW from +z).
function planetVelocity(bodyName, julianDate) {
  const body = BODIES[bodyName];
  const r = planetPosition(bodyName, julianDate); // AU
  const rMag = Math.sqrt(r[0]*r[0] + r[1]*r[1]); // AU
  const speed = Math.sqrt(GM_SUN / (rMag * AU)); // m/s
  // tangent (CCW) = (-y, x) / |r|
  const tx = -r[1] / rMag;
  const ty =  r[0] / rMag;
  return [speed * tx, speed * ty, 0];
}

function compute({ launchTimes, arrivalTimes, origin, destination }, requestId) {
  const NL = launchTimes.length;
  const NA = arrivalTimes.length;

  const make2D = () => Array.from({ length: NA }, () => new Float32Array(NL));
  const dvTotal = make2D();
  const dvDep   = make2D();
  const dvArr   = make2D();
  const c3      = make2D();
  const vInfDep = make2D();
  const vInfArr = make2D();
  const tofArr  = make2D();

  const parkingOrigin = (BODIES[origin]?.radius || 0) + (PARKING_ORBIT[origin] || 200e3);
  const parkingDest   = (BODIES[destination]?.radius || 0) + (PARKING_ORBIT[destination] || 100e3);
  const GMo = BODIES[origin].GM;
  const GMd = BODIES[destination].GM;

  // Pre-compute origin state at each launch time, dest state at each arrival time.
  const r1arr = [], v1arr = [];
  const r2arr = [], v2arr = [];
  for (let i = 0; i < NL; i++) {
    const jd = dateToJulian(new Date(launchTimes[i]));
    const p = planetPosition(origin, jd);
    r1arr.push([p[0]*AU, p[1]*AU, p[2]*AU]);
    v1arr.push(planetVelocity(origin, jd));
  }
  for (let j = 0; j < NA; j++) {
    const jd = dateToJulian(new Date(arrivalTimes[j]));
    const p = planetPosition(destination, jd);
    r2arr.push([p[0]*AU, p[1]*AU, p[2]*AU]);
    v2arr.push(planetVelocity(destination, jd));
  }

  let progressEvery = Math.max(1, Math.floor(NA / 20));

  for (let j = 0; j < NA; j++) {
    for (let i = 0; i < NL; i++) {
      const tof = (arrivalTimes[j] - launchTimes[i]) / 1000; // seconds
      if (tof <= 86400 * 10) {                // require ≥ 10 days
        dvTotal[j][i] = NaN; continue;
      }
      const { v1, v2, converged } = lambert(r1arr[i], r2arr[j], tof, GM_SUN, true);
      if (!converged) {
        dvTotal[j][i] = NaN; continue;
      }
      // Hyperbolic excess at departure / arrival, in m/s
      const vid = [v1[0]-v1arr[i][0], v1[1]-v1arr[i][1], v1[2]-v1arr[i][2]];
      const via = [v2[0]-v2arr[j][0], v2[1]-v2arr[j][1], v2[2]-v2arr[j][2]];
      const vidMag = Math.sqrt(vid[0]*vid[0] + vid[1]*vid[1] + vid[2]*vid[2]);
      const viaMag = Math.sqrt(via[0]*via[0] + via[1]*via[1] + via[2]*via[2]);
      const C3 = (vidMag / 1000) ** 2; // km²/s²
      const viaKms = viaMag / 1000;

      const dvD = departureDeltaV(GMo, parkingOrigin, C3);
      const dvA = arrivalDeltaV(GMd, parkingDest, viaKms);
      const total = dvD + dvA;

      dvTotal[j][i] = total;
      dvDep[j][i]   = dvD;
      dvArr[j][i]   = dvA;
      c3[j][i]      = C3;
      vInfDep[j][i] = vidMag / 1000;
      vInfArr[j][i] = viaKms;
      tofArr[j][i]  = tof;
    }
    if (j % progressEvery === 0) {
      self.postMessage({ type: 'progress', pct: (j + 1) / NA, requestId });
    }
  }

  self.postMessage({ type: 'progress', pct: 1, requestId });
  self.postMessage({
    type: 'result',
    requestId,
    grid: { dvTotal, dvDep, dvArr, c3, vInfDep, vInfArr, tof: tofArr, launchTimes, arrivalTimes },
  });
}

self.onmessage = ({ data }) => {
  if (data?.type === 'compute') compute(data.params, data.requestId);
};
