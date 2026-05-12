export const LAUNCH_VEHICLES = [
  {
    id: 'falcon9',
    name: 'Falcon 9 Block 5',
    operator: 'SpaceX',
    c3_curve: [
      [-20, 22800],
      [0,   16800],
      [5,   13150],
      [10,  10200],
      [20,   6200],
      [30,   3400],
    ],
    leoCapacity: 22800,
    status: 'operational',
  },
  {
    id: 'falcon-heavy',
    name: 'Falcon Heavy',
    operator: 'SpaceX',
    c3_curve: [
      [-20, 63800],
      [0,   37000],
      [10,  22200],
      [20,  13200],
      [30,   7500],
    ],
    leoCapacity: 63800,
    status: 'operational',
  },
  {
    id: 'vulcan-centaur',
    name: 'Vulcan Centaur',
    operator: 'ULA',
    c3_curve: [
      [0,  27200],
      [10, 17000],
      [20,  9900],
      [30,  5500],
    ],
    leoCapacity: 27200,
    status: 'operational',
  },
  {
    id: 'sls-block1',
    name: 'SLS Block 1',
    operator: 'NASA',
    c3_curve: [
      [0,  27000],
      [10, 20000],
      [20, 14000],
      [30,  9000],
    ],
    leoCapacity: 95000,
    status: 'operational',
  },
  {
    id: 'new-glenn',
    name: 'New Glenn',
    operator: 'Blue Origin',
    c3_curve: [
      [-5, 13000],
      [0,  10500],
      [10,  6200],
      [20,  3600],
    ],
    leoCapacity: 45000,
    status: 'operational',
  },
  {
    id: 'ariane-6',
    name: 'Ariane 64',
    operator: 'ArianeGroup',
    c3_curve: [
      [0,  8600],
      [10, 5300],
      [20, 3100],
    ],
    leoCapacity: 21650,
    status: 'operational',
  },
  {
    id: 'h3',
    name: 'H3-24L',
    operator: 'JAXA',
    c3_curve: [
      [0,  6500],
      [10, 4000],
      [20, 2300],
    ],
    leoCapacity: 16500,
    status: 'operational',
  },
];

/**
 * Linearly interpolate a vehicle's payload mass (kg) at a given C3 (km²/s²).
 * Returns 0 if C3 is above the curve's range; extrapolates flat below.
 */
export function payloadAtC3(vehicle, c3) {
  const curve = vehicle.c3_curve;
  if (c3 <= curve[0][0]) return curve[0][1];
  if (c3 >= curve[curve.length - 1][0]) return 0;
  for (let i = 0; i < curve.length - 1; i++) {
    const [x0, y0] = curve[i];
    const [x1, y1] = curve[i + 1];
    if (c3 >= x0 && c3 <= x1) {
      const t = (c3 - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  return 0;
}
