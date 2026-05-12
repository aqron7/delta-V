# CLAUDE.md — delta-v project specification

## Mission

Build `delta-v`: a browser-based orbital mechanics calculator and mission design tool.
The audience is aerospace engineering students, hobbyists, and defense/space industry recruiters.
The tone is **technical instrument** — think mission control readout, not consumer app.
Deploy target: Vercel (static, no backend).

---

## Tech stack (non-negotiable)

| Layer | Choice | Reason |
|---|---|---|
| Framework | React 18 + Vite | Fast HMR, static build for Vercel |
| Styling | Tailwind CSS v3 | Utility-first, consistent spacing |
| Math | mathjs | Arbitrary precision, matrix ops for orbital math |
| 2D plots | Plotly.js | Contour plots (porkchop), waterfall charts |
| 3D orbits | Three.js r155 | Orbit visualizer, no OrbitControls — implement manually |
| Fonts | Space Grotesk (display) + JetBrains Mono (data) | Mission control aesthetic |
| Icons | Lucide React | Consistent outline style |
| Deploy | Vercel | `vercel.json` in repo root |

Install command:
```bash
npm create vite@latest delta-v -- --template react
cd delta-v
npm install mathjs plotly.js-dist-min three lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## Repo structure (build every file listed)

```
delta-v/
├── CLAUDE.md                        ← this file
├── public/
│   └── favicon.svg                  ← rocket SVG icon
├── src/
│   ├── main.jsx
│   ├── App.jsx                      ← routing + layout shell
│   ├── index.css                    ← Tailwind directives + custom CSS vars
│   │
│   ├── physics/                     ← pure functions, no React, fully tested
│   │   ├── constants.js             ← GM values, planet data, physical constants
│   │   ├── orbital.js               ← Hohmann, vis-viva, orbital period, etc.
│   │   ├── lambert.js               ← Izzo Lambert solver (core of porkchop)
│   │   ├── ephemeris.js             ← simplified planetary positions (VSOP87 truncated)
│   │   └── vehicles.js              ← launch vehicle database
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx           ← nav bar with mission type tabs
│   │   │   └── Sidebar.jsx          ← mission config inputs panel
│   │   ├── MissionConfig.jsx        ← input form: origin, destination, date range
│   │   ├── DeltaVBreakdown.jsx      ← waterfall bar chart of mission phases
│   │   ├── PorkchopPlot.jsx         ← contour plot, launch date vs arrival date
│   │   ├── OrbitVisualizer.jsx      ← Three.js 3D orbit viewer
│   │   ├── LaunchVehicleTable.jsx   ← vehicle vs mission feasibility table
│   │   └── MissionSummary.jsx       ← hero card: total ΔV, TOF, C3
│   │
│   ├── hooks/
│   │   ├── useMission.js            ← global mission state (useContext + useReducer)
│   │   └── usePorkchop.js           ← web worker wrapper for Lambert computation grid
│   │
│   ├── workers/
│   │   └── porkchop.worker.js       ← offloaded Lambert solver grid (no UI thread block)
│   │
│   └── utils/
│       ├── units.js                 ← km↔AU, m/s↔km/s, days↔seconds conversions
│       └── format.js                ← number formatting for display
│
├── vercel.json
└── package.json
```

---

## Design system

### Color palette

```css
/* src/index.css */
:root {
  --bg-base:        #0a0e1a;   /* deep space navy */
  --bg-surface:     #111827;   /* panel background */
  --bg-elevated:    #1a2235;   /* card background */
  --border:         #1e2d45;   /* subtle border */
  --text-primary:   #e8f0ff;   /* near-white with blue tint */
  --text-secondary: #6b7fa3;   /* muted label */
  --text-mono:      #7dd3fc;   /* data readout color — sky blue */
  --accent-hot:     #f97316;   /* high delta-v — orange */
  --accent-cold:    #22d3ee;   /* low delta-v — cyan */
  --accent-green:   #34d399;   /* feasible / go */
  --accent-red:     #f87171;   /* infeasible / no-go */
}
```

### Typography

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

body { font-family: 'Space Grotesk', sans-serif; background: var(--bg-base); color: var(--text-primary); }
.mono { font-family: 'JetBrains Mono', monospace; color: var(--text-mono); }
```

### Component aesthetic rules

- All panels: dark surface, 1px border, no drop shadows
- Data values: always monospace, cyan (`--text-mono`)
- Labels: uppercase, 11px, letter-spacing 0.08em, muted color
- Input fields: dark background, cyan border on focus, monospace value text
- Buttons: ghost style (border only) for secondary, solid cyan for primary CTA
- No rounded corners larger than `rounded-lg` (8px)
- Grid layout: 3-column on desktop (sidebar 280px | main canvas | results panel)

---

## Physics layer — implement exactly as specified

### `src/physics/constants.js`

```js
export const G  = 6.674e-11;       // m³ kg⁻¹ s⁻²
export const GM_SUN  = 1.327124e20; // m³/s²
export const AU = 1.496e11;         // m

export const BODIES = {
  mercury: { GM: 2.203e13, radius: 2.44e6,  sma: 0.387 * AU, period: 87.97   },
  venus:   { GM: 3.249e14, radius: 6.05e6,  sma: 0.723 * AU, period: 224.7   },
  earth:   { GM: 3.986e14, radius: 6.371e6, sma: 1.000 * AU, period: 365.25  },
  mars:    { GM: 4.283e13, radius: 3.39e6,  sma: 1.524 * AU, period: 686.97  },
  jupiter: { GM: 1.267e17, radius: 71.49e6, sma: 5.203 * AU, period: 4332.59 },
};

export const PARKING_ORBIT = {
  earth: 200e3,   // 200 km LEO parking altitude (m)
  mars:  100e3,   // 100 km LMO parking altitude (m)
};
```

### `src/physics/orbital.js`

Implement these functions with JSDoc:

```js
/**
 * Vis-viva equation: orbital speed at radius r in an orbit with semi-major axis a
 * v² = GM(2/r - 1/a)
 */
export function visViva(GM, r, a) { ... }

/**
 * Circular orbit velocity at altitude h above body with given radius and GM
 */
export function circularVelocity(GM, radius, altitude) { ... }

/**
 * Hohmann transfer between two circular coplanar orbits
 * Returns { dv1, dv2, dvTotal, tof } all in m/s and seconds
 */
export function hohmannTransfer(GM, r1, r2) { ... }

/**
 * Hyperbolic excess velocity from C3
 * C3 = v_inf² (km²/s²)
 */
export function c3ToVinf(c3) { return Math.sqrt(Math.max(0, c3)); }

/**
 * Delta-v to escape from circular parking orbit given C3
 * dv = sqrt(v_circ² + C3) - v_circ
 */
export function departureDetlaV(GM, parkingRadius, c3) { ... }

/**
 * Orbital period in seconds
 * T = 2π√(a³/GM)
 */
export function orbitalPeriod(GM, sma) { ... }

/**
 * Convert state vector [rx, ry, rz, vx, vy, vz] to Keplerian elements
 * Returns { a, e, i, omega, RAAN, nu }
 */
export function stateToKeplerian(r, v, GM) { ... }
```

### `src/physics/ephemeris.js`

Implement simplified circular-orbit planetary positions. For the porkchop grid, we don't need full VSOP87 — circular coplanar approximation is sufficient for a portfolio tool.

```js
/**
 * Planet position as [x, y, z] in AU at a given Julian date
 * Uses circular orbit approximation with known mean longitudes
 * Accurate to within ~5% for Mars, sufficient for porkchop shape
 */
export function planetPosition(bodyName, julianDate) {
  const body = BODIES[bodyName];
  const T = (julianDate - 2451545.0) / 36525; // Julian centuries from J2000
  // Use mean longitude from J2000 epoch + motion rate
  // Mean longitudes at J2000 and daily rates (degrees):
  const MEAN_LONGITUDE_J2000 = { earth: 100.464, mars: 355.453 };
  const DAILY_MOTION = { earth: 0.9856, mars: 0.5240 };
  ...
}

/**
 * Convert calendar date to Julian date
 */
export function dateToJulian(date) { ... }
```

### `src/physics/lambert.js`

Implement the **Izzo (2015) Lambert solver**. This is the most important piece of math in the project.

Lambert's problem: given two position vectors r1, r2 and a time of flight, find the velocity vectors v1, v2 of the connecting transfer arc.

```js
/**
 * Izzo Lambert solver
 * @param {number[]} r1 - departure position vector [m, m, m]
 * @param {number[]} r2 - arrival position vector [m, m, m]
 * @param {number} tof  - time of flight in seconds
 * @param {number} GM   - gravitational parameter of central body (m³/s²)
 * @param {boolean} prograde - true for prograde transfer
 * @returns {{ v1: number[], v2: number[], converged: boolean }}
 */
export function lambert(r1, r2, tof, GM, prograde = true) {
  // Izzo algorithm steps:
  // 1. Compute chord c = |r2 - r1|, semiperimeter s = (|r1| + |r2| + c) / 2
  // 2. Compute lambda: lambda² = 1 - c/s
  // 3. Compute non-dimensional TOF T
  // 4. Find x via Halley iteration on Lagrange equation
  // 5. Recover v1, v2 from x using Lagrange coefficients
  ...
}
```

Reference: Izzo, D. (2015). "Revisiting Lambert's problem." Celestial Mechanics and Dynamical Astronomy.
Search for open-source JavaScript implementations to validate against — the math is well-documented.

### `src/physics/vehicles.js`

```js
export const LAUNCH_VEHICLES = [
  {
    id: "falcon9",
    name: "Falcon 9 Block 5",
    operator: "SpaceX",
    c3_curve: [           // [C3 km²/s², payload kg] pairs — interpolate between
      [-20, 22800],
      [0,   16800],
      [5,   13150],
      [10,  10200],
      [20,   6200],
      [30,   3400],
    ],
    leoCapacity: 22800,   // kg to LEO
    status: "operational",
  },
  {
    id: "falcon-heavy",
    name: "Falcon Heavy",
    operator: "SpaceX",
    c3_curve: [
      [-20, 63800],
      [0,   37000],
      [10,  22200],
      [20,  13200],
      [30,   7500],
    ],
    leoCapacity: 63800,
    status: "operational",
  },
  {
    id: "vulcan-centaur",
    name: "Vulcan Centaur",
    operator: "ULA",
    c3_curve: [
      [0,  27200],
      [10, 17000],
      [20,  9900],
      [30,  5500],
    ],
    leoCapacity: 27200,
    status: "operational",
  },
  {
    id: "sls-block1",
    name: "SLS Block 1",
    operator: "NASA",
    c3_curve: [
      [0,  27000],
      [10, 20000],
      [20, 14000],
      [30,  9000],
    ],
    leoCapacity: 95000,
    status: "operational",
  },
  // Add New Glenn, Ariane 6, H3
];
```

---

## Component specifications

### `MissionConfig.jsx`

Input panel with these fields:

```
Mission type:    [dropdown] Earth Orbit | Interplanetary
Origin:          [dropdown] Earth (other bodies for future)
Destination:     [dropdown] LEO | GEO | Moon | Mars | Venus | Jupiter
Payload mass:    [number input] kg
Launch window:   [date range picker] start / end dates
Arrival window:  [date range picker] (interplanetary only)
Transfer type:   [radio] Hohmann | Bi-elliptic | Lambert optimal
```

On any change, dispatch to `useMission` context. Validate: arrival date must be after launch date + minimum TOF.

### `MissionSummary.jsx`

Hero card at the top of the results panel. Shows:
```
TOTAL ΔV          C3              TOF
4,782 m/s    8.7 km²/s²      259 days
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPARTURE BURN    ARRIVAL BURN
2,994 m/s         1,788 m/s
```
All values monospace cyan. Labels uppercase muted. Update live as inputs change.

### `DeltaVBreakdown.jsx`

Horizontal waterfall bar chart (Plotly) showing delta-v stack:
- Parking orbit departure burn
- Deep space maneuver (if bi-elliptic)
- Arrival insertion burn
- Color: gradient from cyan (low dv) to orange (high dv)
- Show cumulative total on the right

### `PorkchopPlot.jsx`

This is the centerpiece. Contour plot where:
- X axis: launch date
- Y axis: arrival date  
- Z (color): total delta-v in m/s
- Colorscale: `cyan → green → yellow → orange → red` (low to high dv)
- Contour lines labeled in km/s
- Click anywhere on plot → update MissionSummary with that specific trajectory

Grid computation: 60×60 date grid (3600 Lambert calls). Run in `porkchop.worker.js` to avoid blocking the UI thread. Show progress bar while computing.

```js
// workers/porkchop.worker.js
self.onmessage = ({ data: { launchDates, arrivalDates, origin, destination } }) => {
  // For each (launch, arrival) pair:
  // 1. Get planet positions via ephemeris
  // 2. Call lambert(r1, r2, tof, GM_SUN)
  // 3. Compute departure C3, arrival v_inf, total dv
  // Post progress updates every 10 rows
  self.postMessage({ type: 'progress', pct: row / totalRows });
  // Post final grid
  self.postMessage({ type: 'result', grid });
};
```

### `OrbitVisualizer.jsx`

Three.js scene:
- Black background, star field (1000 random points)
- Sun at origin: yellow sphere, scale relative
- Planet orbits: faint ellipses (line segments)
- Transfer arc: bright cyan dashed arc from departure to arrival
- Planets shown at their positions on selected launch date
- Auto-rotate camera slowly; allow click-drag to orbit

```jsx
useEffect(() => {
  const scene = new THREE.Scene();
  // ... Three.js setup
  // Draw sun, planet orbits, transfer arc
  // Animation loop: TWEEN camera rotation
}, [mission]);
```

### `LaunchVehicleTable.jsx`

Table with columns: Vehicle | Operator | Max Payload to this C3 | Feasible?

Interpolate each vehicle's C3 curve against mission C3. Mark feasible (green check) if payload capacity > user's payload mass. Sort by capacity descending. Highlight recommended vehicle.

---

## State management — `hooks/useMission.js`

```js
const initialState = {
  missionType: 'interplanetary',   // 'earth_orbit' | 'interplanetary'
  destination: 'mars',
  payloadMass: 1000,               // kg
  launchDate: null,
  arrivalDate: null,
  results: null,                   // { dvTotal, dv1, dv2, c3, tof, converged }
  porkchopGrid: null,
  computing: false,
};
```

Reducer handles: `SET_DESTINATION`, `SET_DATES`, `SET_RESULTS`, `SET_PORKCHOP`, `SET_COMPUTING`.

---

## Build and deployment

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

```json
// package.json scripts
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

Environment: no env vars needed. All computation is client-side.

---

## Build order — follow this sequence exactly

1. **`src/physics/`** — all physics modules first, no React deps
2. **`src/utils/`** — unit conversions and formatting
3. **`src/hooks/useMission.js`** — state management
4. **`src/index.css`** — design tokens and Tailwind config
5. **`src/components/layout/`** — Header and Sidebar shell
6. **`src/App.jsx`** — layout grid wiring components together
7. **`src/components/MissionConfig.jsx`** — inputs, connected to context
8. **`src/components/MissionSummary.jsx`** — results hero card
9. **`src/components/DeltaVBreakdown.jsx`** — Plotly waterfall
10. **`src/workers/porkchop.worker.js`** — Lambert grid computation
11. **`src/components/PorkchopPlot.jsx`** — Plotly contour, reads worker output
12. **`src/components/OrbitVisualizer.jsx`** — Three.js scene (build last)
13. **`src/components/LaunchVehicleTable.jsx`** — vehicle comparison

---

## Default mission on load

Show Earth → Mars with these defaults:
- Launch window: Jan 1 2026 → Jun 1 2026
- Arrival window: Jun 1 2026 → Mar 1 2027
- Payload: 1000 kg
- Auto-compute porkchop on load

The 2026 Earth–Mars launch window is real and opens around Feb 2026. The porkchop should show a characteristic "eye" shape. If the output doesn't look like an eye centered around ~Mar 2026 launch / ~Jan 2027 arrival, the Lambert solver or ephemeris has a bug.

---

## Quality bars — do not ship without these

- [ ] Porkchop plot renders without freezing UI (web worker required)
- [ ] Clicking porkchop point updates MissionSummary instantly
- [ ] LaunchVehicleTable updates when payload mass changes
- [ ] OrbitVisualizer shows planets at correct relative positions for selected date
- [ ] All delta-v values in m/s internally, displayed as km/s with 2 decimal places
- [ ] Mobile: stacked layout, porkchop plot 100% width
- [ ] Dark mode only — no light mode toggle needed

---

## README.md (write this too)

Include:
- One-paragraph description
- Live demo link (Vercel URL placeholder)
- Screenshot placeholder
- Physics references:
  - Izzo (2015), "Revisiting Lambert's problem"
  - Bate, Mueller, White — Fundamentals of Astrodynamics
  - NASA Planetary Fact Sheet for constants
- Local dev instructions: `npm install && npm run dev`
