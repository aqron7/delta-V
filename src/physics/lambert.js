/**
 * Izzo (2015) Lambert solver — single-revolution (N=0) prograde/retrograde.
 *
 * Given r1, r2 (m) and time of flight (s), finds the transfer-arc velocities
 * v1, v2 (m/s) around a central body with gravitational parameter GM.
 *
 * Reference: Izzo, D. (2015), "Revisiting Lambert's problem,"
 *   Celestial Mechanics and Dynamical Astronomy 121:1-15.
 */

function dot(a, b)  { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
function norm(v)    { return Math.sqrt(dot(v, v)); }
function cross(a, b) {
  return [
    a[1]*b[2] - a[2]*b[1],
    a[2]*b[0] - a[0]*b[2],
    a[0]*b[1] - a[1]*b[0],
  ];
}
function scale(v, s) { return [v[0]*s, v[1]*s, v[2]*s]; }
function add(a, b)   { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }

/**
 * Time-of-flight function and its first three derivatives in Izzo's
 * non-dimensional form. M = 0 (zero revolutions).
 */
function tofAndDerivs(x, lambda) {
  const xSq = x * x;
  const ySq = 1 - lambda * lambda * (1 - xSq);
  if (ySq < 0) return { T: NaN, Tp: NaN, Tpp: NaN };
  const y = Math.sqrt(ySq);

  let T;
  const oneMinusXSq = 1 - xSq;

  if (Math.abs(oneMinusXSq) < 1e-12) {
    // Parabolic limit.
    T = (2 / 3) * (1 - lambda * lambda * lambda);
  } else if (xSq < 1) {
    // Elliptic.
    const psi = Math.acos(Math.max(-1, Math.min(1, x * y + lambda * (1 - xSq))));
    T = (psi / Math.sqrt(oneMinusXSq) - x + lambda * y) / oneMinusXSq;
  } else {
    // Hyperbolic. acosh(z) = log(z + sqrt(z² - 1)).
    const z = x * y - lambda * (xSq - 1);
    const psi = Math.log(z + Math.sqrt(Math.max(0, z * z - 1)));
    T = (-psi / Math.sqrt(xSq - 1) - x + lambda * y) / oneMinusXSq;
  }

  // dT/dx, d²T/dx² via Izzo's recurrences.
  const Tp  = (3 * T * x - 2 + 2 * lambda * lambda * lambda * x / y) / oneMinusXSq;
  const Tpp = (3 * T + 5 * x * Tp + 2 * (1 - lambda * lambda) * lambda * lambda * lambda / (y * y * y)) / oneMinusXSq;

  return { T, Tp, Tpp };
}

function initialGuess(T, lambda) {
  // Zero-revolution initial guess from Izzo, eq. 30/31.
  const T0 = Math.acos(lambda) + lambda * Math.sqrt(1 - lambda * lambda);
  const T1 = (2 / 3) * (1 - lambda * lambda * lambda);

  if (T >= T0) {
    return Math.pow(T0 / T, 2 / 3) - 1;
  } else if (T <= T1) {
    return (5 / 2) * (T1 * (T1 - T)) / (T * (1 - Math.pow(lambda, 5))) + 1;
  } else {
    // Logarithmic interpolation between (T0,0) and (T1,1).
    return Math.pow(T0 / T, Math.log2(T1 / T0)) - 1;
  }
}

function halleyIterate(x0, Ttarget, lambda, maxIter = 30, tol = 1e-11) {
  let x = x0;
  for (let i = 0; i < maxIter; i++) {
    const { T, Tp, Tpp } = tofAndDerivs(x, lambda);
    if (!isFinite(T)) return { x, converged: false, iters: i };
    const f = T - Ttarget;
    if (Math.abs(f) < tol) return { x, converged: true, iters: i };
    const denom = 2 * Tp * Tp - f * Tpp;
    if (denom === 0) return { x, converged: false, iters: i };
    const dx = (2 * f * Tp) / denom;
    x = x - dx;
    if (Math.abs(dx) < tol) return { x, converged: true, iters: i + 1 };
  }
  return { x, converged: false, iters: maxIter };
}

/**
 * Solve Lambert's problem.
 * @param {number[]} r1 departure position (m)
 * @param {number[]} r2 arrival position (m)
 * @param {number}   tof time of flight (s), > 0
 * @param {number}   GM gravitational parameter (m³/s²)
 * @param {boolean}  prograde true for prograde (+Z angular momentum)
 * @returns {{ v1:number[], v2:number[], converged:boolean, iters:number }}
 */
export function lambert(r1, r2, tof, GM, prograde = true) {
  const r1n = norm(r1);
  const r2n = norm(r2);
  const dr = [r2[0] - r1[0], r2[1] - r1[1], r2[2] - r1[2]];
  const c = norm(dr);
  const s = (r1n + r2n + c) / 2;

  const ir1 = scale(r1, 1 / r1n);
  const ir2 = scale(r2, 1 / r2n);
  let ih = cross(ir1, ir2);
  const ihMag = norm(ih);
  if (ihMag < 1e-14) {
    return { v1: [NaN, NaN, NaN], v2: [NaN, NaN, NaN], converged: false, iters: 0 };
  }
  ih = scale(ih, 1 / ihMag);

  let lambda = Math.sqrt(Math.max(0, 1 - c / s));

  // Direction selection: if ih_z disagrees with desired sense, flip lambda and ih.
  let it1, it2;
  if ((prograde && ih[2] < 0) || (!prograde && ih[2] >= 0)) {
    lambda = -lambda;
    it1 = cross(ir1, ih);   // note: swap to keep right-handed tangent
    it2 = cross(ir2, ih);
  } else {
    it1 = cross(ih, ir1);
    it2 = cross(ih, ir2);
  }

  const T = Math.sqrt((2 * GM) / (s * s * s)) * tof;

  const x0 = initialGuess(T, lambda);
  const { x, converged, iters } = halleyIterate(x0, T, lambda);

  const ySq = 1 - lambda * lambda * (1 - x * x);
  const y = Math.sqrt(Math.max(0, ySq));
  const gamma = Math.sqrt((GM * s) / 2);
  const rho = (r1n - r2n) / c;
  const sigma = Math.sqrt(Math.max(0, 1 - rho * rho));

  const Vr1 =  gamma * ((lambda * y - x) - rho * (lambda * y + x)) / r1n;
  const Vr2 = -gamma * ((lambda * y - x) + rho * (lambda * y + x)) / r2n;
  const Vt1 =  gamma * sigma * (y + lambda * x) / r1n;
  const Vt2 =  gamma * sigma * (y + lambda * x) / r2n;

  const v1 = add(scale(ir1, Vr1), scale(it1, Vt1));
  const v2 = add(scale(ir2, Vr2), scale(it2, Vt2));

  return { v1, v2, converged, iters };
}
