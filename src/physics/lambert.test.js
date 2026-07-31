import { describe, it, expect } from 'vitest';
import { lambert } from './lambert.js';
import { AU, GM_SUN } from './constants.js';

const TOL = 5; // m/s absolute tolerance for velocity comparisons

describe('lambert()', () => {
  it('departure and arrival velocities lie on the same transfer ellipse (vis-viva energy)', () => {
    // Fundamental invariant: specific orbital energy E = v²/2 − GM/r must be identical
    // at both endpoints — they must be on the same conic section.
    const r1  = [AU, 0, 0];
    const r2  = [0, 1.524 * AU, 0]; // 90° ahead, Mars distance
    const tof = 2e7;                  // ~231 days — well inside single-rev regime

    const { v1, v2, converged } = lambert(r1, r2, tof, GM_SUN, true);
    expect(converged).toBe(true);

    const r1Mag = AU;
    const r2Mag = 1.524 * AU;
    const a1 = -GM_SUN / (2 * (v1.reduce((s, x) => s + x ** 2, 0) / 2 - GM_SUN / r1Mag));
    const a2 = -GM_SUN / (2 * (v2.reduce((s, x) => s + x ** 2, 0) / 2 - GM_SUN / r2Mag));

    // SMA from departure and arrival must match to within 0.01%
    expect(Math.abs(a1 - a2) / Math.abs(a1)).toBeLessThan(1e-4);
    // Must be an elliptic (bound) orbit
    expect(a1).toBeGreaterThan(0);
  });

  it('arrival speed matches vis-viva using SMA inferred from departure', () => {
    const r1  = [AU, 0, 0];
    const r2  = [0, 1.524 * AU, 0];
    const tof = 2e7;

    const { v1, v2, converged } = lambert(r1, r2, tof, GM_SUN, true);
    expect(converged).toBe(true);

    const v1Sq = v1[0] ** 2 + v1[1] ** 2 + v1[2] ** 2;
    const a    = -GM_SUN / (2 * (v1Sq / 2 - GM_SUN / AU));

    const v2Expected = Math.sqrt(GM_SUN * (2 / (1.524 * AU) - 1 / a));
    const v2Actual   = Math.hypot(v2[0], v2[1], v2[2]);

    expect(Math.abs(v2Actual - v2Expected)).toBeLessThan(TOL);
  });

  it('180° anti-parallel geometry returns converged:false (degenerate transfer plane)', () => {
    // Anti-parallel r1, r2 → cross product ≈ 0 → angular momentum undefined.
    // Lambert's problem has infinitely many solutions in this degenerate case.
    const { converged } = lambert([AU, 0, 0], [-1.524 * AU, 0, 0], 2.237e7, GM_SUN, true);
    expect(converged).toBe(false);
  });

  it('collinear r1, r2 (same direction) returns converged:false', () => {
    const { converged } = lambert([AU, 0, 0], [1.524 * AU, 0, 0], 1e7, GM_SUN, true);
    expect(converged).toBe(false);
  });

  it('prograde and retrograde solutions have opposite-sign tangential velocity at r1', () => {
    const r1  = [AU, 0, 0];
    const r2  = [0, 1.5 * AU, 0]; // 90° ahead
    const tof = 2e7;

    const fwd = lambert(r1, r2, tof, GM_SUN, true);
    const rev = lambert(r1, r2, tof, GM_SUN, false);
    expect(fwd.converged).toBe(true);
    expect(rev.converged).toBe(true);

    // At r1 = [AU, 0, 0], prograde tangent is +y; retrograde is −y
    expect(fwd.v1[1]).toBeGreaterThan(0);
    expect(rev.v1[1]).toBeLessThan(0);
  });

  it('converges in ≤ 10 Halley iterations for a typical interplanetary transfer', () => {
    const { converged, iters } = lambert(
      [AU, 0, 0],
      [-1.2 * AU, 0.6 * AU, 0],
      2.2e7,
      GM_SUN,
      true,
    );
    expect(converged).toBe(true);
    expect(iters).toBeLessThanOrEqual(10);
  });
});
