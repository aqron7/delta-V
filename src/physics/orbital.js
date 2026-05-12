/**
 * Vis-viva: orbital speed at radius r in an orbit with semi-major axis a.
 * v² = GM(2/r − 1/a)
 */
export function visViva(GM, r, a) {
  return Math.sqrt(GM * (2 / r - 1 / a));
}

/**
 * Circular orbit velocity at altitude h above a body of given radius.
 */
export function circularVelocity(GM, radius, altitude) {
  return Math.sqrt(GM / (radius + altitude));
}

/**
 * Hohmann transfer between two circular coplanar orbits.
 * Returns { dv1, dv2, dvTotal, tof } — m/s and seconds.
 */
export function hohmannTransfer(GM, r1, r2) {
  const a = (r1 + r2) / 2;
  const v1c = Math.sqrt(GM / r1);
  const v2c = Math.sqrt(GM / r2);
  const v1t = visViva(GM, r1, a);
  const v2t = visViva(GM, r2, a);
  const dv1 = Math.abs(v1t - v1c);
  const dv2 = Math.abs(v2c - v2t);
  const tof = Math.PI * Math.sqrt((a * a * a) / GM);
  return { dv1, dv2, dvTotal: dv1 + dv2, tof };
}

/**
 * Hyperbolic excess velocity from C3 (km²/s²) → returns km/s.
 */
export function c3ToVinf(c3) {
  return Math.sqrt(Math.max(0, c3));
}

/**
 * Delta-v to escape from a circular parking orbit onto a hyperbola of given C3.
 * v_hyp at periapsis = sqrt(v_inf² + v_esc²) = sqrt(v_inf² + 2·v_circ²).
 * @param {number} GM body GM (m³/s²)
 * @param {number} parkingRadius r from body center (m)
 * @param {number} c3 km²/s²
 * @returns m/s
 */
export function departureDeltaV(GM, parkingRadius, c3) {
  const vCircSq = GM / parkingRadius;
  const vCirc = Math.sqrt(vCircSq);
  const vInfSq = c3 * 1e6; // km²/s² → m²/s²
  const vHyp = Math.sqrt(vInfSq + 2 * vCircSq);
  return vHyp - vCirc;
}

/**
 * Delta-v to insert from a hyperbolic arrival into a circular parking orbit.
 * Symmetric to departure.
 */
export function arrivalDeltaV(GM, parkingRadius, vInfKms) {
  const vCircSq = GM / parkingRadius;
  const vCirc = Math.sqrt(vCircSq);
  const vInfSq = (vInfKms * 1000) ** 2;
  const vHyp = Math.sqrt(vInfSq + 2 * vCircSq);
  return vHyp - vCirc;
}

/**
 * Orbital period in seconds.
 */
export function orbitalPeriod(GM, sma) {
  return 2 * Math.PI * Math.sqrt((sma * sma * sma) / GM);
}

function dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
function cross(a, b) {
  return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
}
function norm(v) { return Math.sqrt(dot(v, v)); }

/**
 * State vector → classical Keplerian elements.
 * @param {number[]} r position vector (m)
 * @param {number[]} v velocity vector (m/s)
 * @param {number} GM gravitational parameter of central body
 * @returns {{ a:number, e:number, i:number, omega:number, RAAN:number, nu:number }}
 *   angles in radians, a in meters
 */
export function stateToKeplerian(r, v, GM) {
  const rMag = norm(r);
  const vMag = norm(v);
  const h = cross(r, v);
  const hMag = norm(h);
  const n = cross([0, 0, 1], h);
  const nMag = norm(n);

  const eVec = [
    ((vMag * vMag - GM / rMag) * r[0] - dot(r, v) * v[0]) / GM,
    ((vMag * vMag - GM / rMag) * r[1] - dot(r, v) * v[1]) / GM,
    ((vMag * vMag - GM / rMag) * r[2] - dot(r, v) * v[2]) / GM,
  ];
  const e = norm(eVec);

  const energy = (vMag * vMag) / 2 - GM / rMag;
  const a = -GM / (2 * energy);

  const i = Math.acos(h[2] / hMag);

  let RAAN = nMag > 0 ? Math.acos(n[0] / nMag) : 0;
  if (n[1] < 0) RAAN = 2 * Math.PI - RAAN;

  let omega = nMag > 0 && e > 0 ? Math.acos(Math.max(-1, Math.min(1, dot(n, eVec) / (nMag * e)))) : 0;
  if (e > 0 && eVec[2] < 0) omega = 2 * Math.PI - omega;

  let nu = e > 0 ? Math.acos(Math.max(-1, Math.min(1, dot(eVec, r) / (e * rMag)))) : 0;
  if (dot(r, v) < 0) nu = 2 * Math.PI - nu;

  return { a, e, i, omega, RAAN, nu };
}
