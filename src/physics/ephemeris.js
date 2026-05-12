import { BODIES, AU } from './constants.js';

const DEG = Math.PI / 180;

// Mean longitude at J2000 epoch (degrees), and daily motion (degrees/day).
// Coplanar circular approximation — accurate to ~5% for inner planets.
const MEAN_LONGITUDE_J2000 = {
  mercury: 252.251,
  venus:   181.980,
  earth:   100.464,
  mars:    355.453,
  jupiter:  34.404,
};

const DAILY_MOTION = {
  mercury: 4.0923,
  venus:   1.6021,
  earth:   0.9856,
  mars:    0.5240,
  jupiter: 0.0831,
};

/**
 * Planet position [x, y, z] in AU at a given Julian date.
 * Circular coplanar approximation. z is always 0 in this model.
 */
export function planetPosition(bodyName, julianDate) {
  const body = BODIES[bodyName];
  if (!body) throw new Error(`Unknown body: ${bodyName}`);
  const days = julianDate - 2451545.0;
  const L0 = MEAN_LONGITUDE_J2000[bodyName] ?? 0;
  const rate = DAILY_MOTION[bodyName] ?? 0;
  const L = (L0 + rate * days) * DEG;
  const aAU = body.sma / AU;
  return [aAU * Math.cos(L), aAU * Math.sin(L), 0];
}

/**
 * Calendar date → Julian date (UT, ignoring leap seconds; accurate to ~1 sec for our use).
 * Accepts a JS Date object.
 */
export function dateToJulian(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Julian date → JS Date.
 */
export function julianToDate(jd) {
  return new Date((jd - 2440587.5) * 86400000);
}
