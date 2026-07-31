import { describe, it, expect } from 'vitest';
import {
  visViva,
  circularVelocity,
  hohmannTransfer,
  orbitalPeriod,
  departureDeltaV,
  arrivalDeltaV,
  stateToKeplerian,
} from './orbital.js';
import { AU, GM_SUN, BODIES, PARKING_ORBIT } from './constants.js';

describe('hohmannTransfer()', () => {
  it('Earth→Mars matches textbook values (Bate, Mueller & White, §6.3)', () => {
    const { dv1, dv2, dvTotal, tof } = hohmannTransfer(GM_SUN, AU, 1.524 * AU);
    expect(dv1  / 1000).toBeCloseTo(2.94, 1);  // km/s ±0.05
    expect(dv2  / 1000).toBeCloseTo(2.65, 1);  // km/s ±0.05
    expect(tof  / 86400).toBeCloseTo(259, 0);  // days ±0.5
  });

  it('is symmetric: dv1 + dv2 === dvTotal', () => {
    const { dv1, dv2, dvTotal } = hohmannTransfer(GM_SUN, AU, 1.524 * AU);
    expect(Math.abs(dv1 + dv2 - dvTotal)).toBeLessThan(1e-6);
  });
});

describe('circularVelocity()', () => {
  it('Earth at 1 AU heliocentric ≈ 29.78 km/s', () => {
    const v = circularVelocity(GM_SUN, 0, AU);
    expect(v / 1000).toBeCloseTo(29.78, 1);
  });
});

describe('orbitalPeriod()', () => {
  it('Earth at 1 AU heliocentric ≈ 365.25 days', () => {
    const T = orbitalPeriod(GM_SUN, AU);
    expect(T / 86400).toBeCloseTo(365.25, 0);
  });

  it('Mars at 1.524 AU heliocentric ≈ 686.97 days', () => {
    const T = orbitalPeriod(GM_SUN, 1.524 * AU);
    expect(T / 86400).toBeCloseTo(686.97, 0);
  });
});

describe('visViva()', () => {
  it('at circular orbit r=a equals circularVelocity', () => {
    const vv = visViva(GM_SUN, AU, AU);
    const vc = circularVelocity(GM_SUN, 0, AU);
    expect(Math.abs(vv - vc)).toBeLessThan(0.001); // within 1 mm/s
  });
});

describe('departureDeltaV()', () => {
  it('C3=0 from 200 km LEO equals (√2 − 1) × v_circ (parabolic escape)', () => {
    const { GM, radius } = BODIES.earth;
    const r = radius + PARKING_ORBIT.earth;
    const vCirc = Math.sqrt(GM / r);
    const expected = (Math.SQRT2 - 1) * vCirc;
    const result = departureDeltaV(GM, r, 0);
    expect(Math.abs(result - expected)).toBeLessThan(1); // ±1 m/s
  });

  it('higher C3 requires more dv', () => {
    const { GM, radius } = BODIES.earth;
    const r = radius + PARKING_ORBIT.earth;
    expect(departureDeltaV(GM, r, 10)).toBeGreaterThan(departureDeltaV(GM, r, 0));
  });
});

describe('arrivalDeltaV()', () => {
  it('v∞=0 from 100 km LMO equals (√2 − 1) × v_circ (parabolic capture)', () => {
    const { GM, radius } = BODIES.mars;
    const r = radius + PARKING_ORBIT.mars;
    const vCirc = Math.sqrt(GM / r);
    const expected = (Math.SQRT2 - 1) * vCirc;
    const result = arrivalDeltaV(GM, r, 0);
    expect(Math.abs(result - expected)).toBeLessThan(1);
  });
});

describe('stateToKeplerian()', () => {
  it('circular Earth orbit at 1 AU has e≈0 and a≈1 AU', () => {
    const r = [AU, 0, 0];
    const vCirc = circularVelocity(GM_SUN, 0, AU);
    const v = [0, vCirc, 0]; // prograde tangential
    const { a, e } = stateToKeplerian(r, v, GM_SUN);
    expect(Math.abs(a - AU) / AU).toBeLessThan(1e-6);  // within 0.0001%
    expect(e).toBeCloseTo(0, 6);
  });
});
