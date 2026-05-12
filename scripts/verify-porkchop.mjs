// Stand-alone numeric verification of the Earth→Mars 2026 porkchop minimum.
// Should land around mid-March 2026 launch / December 2026 – January 2027 arrival.
import { lambert } from '../src/physics/lambert.js';
import { BODIES, GM_SUN, AU, PARKING_ORBIT } from '../src/physics/constants.js';
import { planetPosition, dateToJulian } from '../src/physics/ephemeris.js';
import { departureDeltaV, arrivalDeltaV } from '../src/physics/orbital.js';

function planetVel(name, jd) {
  const r = planetPosition(name, jd);
  const rMag = Math.hypot(r[0], r[1]);
  const speed = Math.sqrt(GM_SUN / (rMag * AU));
  return [speed * -r[1]/rMag, speed * r[0]/rMag, 0];
}

const origin = 'earth';
const destination = 'mars';
const lStart = new Date('2026-09-01T00:00:00Z').getTime();
const lEnd   = new Date('2027-02-01T00:00:00Z').getTime();
const aStart = new Date('2027-05-01T00:00:00Z').getTime();
const aEnd   = new Date('2027-12-01T00:00:00Z').getTime();
const N = 60;

const lts = Array.from({length: N}, (_,i) => lStart + (lEnd-lStart)*i/(N-1));
const ats = Array.from({length: N}, (_,j) => aStart + (aEnd-aStart)*j/(N-1));

const parkO = BODIES[origin].radius + PARKING_ORBIT[origin];
const parkD = BODIES[destination].radius + PARKING_ORBIT[destination];

let best = { dv: Infinity, li: 0, ai: 0, c3: 0, dvDep: 0, dvArr: 0, vInfArr: 0, tofDays: 0 };
let counted = 0, ok = 0;

for (let j = 0; j < N; j++) {
  for (let i = 0; i < N; i++) {
    const tof = (ats[j] - lts[i]) / 1000;
    if (tof <= 86400*10) continue;
    counted++;
    const jd1 = dateToJulian(new Date(lts[i]));
    const jd2 = dateToJulian(new Date(ats[j]));
    const p1 = planetPosition(origin, jd1);
    const p2 = planetPosition(destination, jd2);
    const r1 = [p1[0]*AU, p1[1]*AU, p1[2]*AU];
    const r2 = [p2[0]*AU, p2[1]*AU, p2[2]*AU];
    const sol = lambert(r1, r2, tof, GM_SUN, true);
    if (!sol.converged) continue;
    ok++;
    const vO = planetVel(origin, jd1);
    const vD = planetVel(destination, jd2);
    const vid = [sol.v1[0]-vO[0], sol.v1[1]-vO[1], sol.v1[2]-vO[2]];
    const via = [sol.v2[0]-vD[0], sol.v2[1]-vD[1], sol.v2[2]-vD[2]];
    const vidMag = Math.hypot(...vid);
    const viaMag = Math.hypot(...via);
    const c3 = (vidMag/1000)**2;
    const vInfArr = viaMag/1000;
    const dvD = departureDeltaV(BODIES[origin].GM, parkO, c3);
    const dvA = arrivalDeltaV(BODIES[destination].GM, parkD, vInfArr);
    const dvT = dvD + dvA;
    if (dvT < best.dv) best = { dv: dvT, li: i, ai: j, c3, dvDep: dvD, dvArr: dvA, vInfArr, tofDays: tof/86400 };
  }
}

const launchDate  = new Date(lts[best.li]).toISOString().slice(0,10);
const arrivalDate = new Date(ats[best.ai]).toISOString().slice(0,10);
console.log(`grid: ${N}x${N}, computed=${counted}, converged=${ok}`);
console.log(`best dv:       ${best.dv.toFixed(0)} m/s`);
console.log(`  departure:   ${best.dvDep.toFixed(0)} m/s`);
console.log(`  arrival:     ${best.dvArr.toFixed(0)} m/s`);
console.log(`  c3:          ${best.c3.toFixed(2)} km²/s²`);
console.log(`  v∞ arrival:  ${best.vInfArr.toFixed(2)} km/s`);
console.log(`  tof:         ${best.tofDays.toFixed(0)} days`);
console.log(`  launch:      ${launchDate}`);
console.log(`  arrival:     ${arrivalDate}`);
