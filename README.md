# delta-v · mission design tool

**[Live demo →](https://delta-v-sable.vercel.app)**

A browser-based orbital mechanics calculator and interplanetary mission design tool built for aerospace engineers. Enter an origin, destination, and date windows — delta-v computes a full porkchop plot via Lambert's problem and tells you which launch vehicles can fly the mission at your payload mass.

---

## What it does

- **Porkchop plot** — 60×60 grid of Lambert solutions across all launch/arrival date combinations, rendered as a Δv contour plot in a Web Worker so the UI never blocks. Click any point to select that trajectory.
- **Orbit visualizer** — heliocentric Three.js scene showing planet positions on the selected date, with the transfer arc propagated via RK4 integration from the Lambert solution.
- **Δv breakdown** — waterfall chart of departure burn, deep-space maneuvers, and arrival insertion.
- **Launch vehicle table** — interpolates each vehicle's C3 curve against mission C3 and marks which vehicles can lift your payload.

## Physics

The core solver is the **Izzo (2015) Lambert algorithm** — a zero-revolution, single-arc solution using Halley's method on a non-dimensional time-of-flight equation. Planetary positions use a simplified circular-coplanar ephemeris accurate to ~5% for porkchop shape purposes.

Δv budget uses:
- Departure: `dv = √(v_circ² + C3) − v_circ` (hyperbolic injection from parking orbit)
- Arrival: `dv = √(v_circ² + v∞²) − v_circ` (capture into destination parking orbit)

References:
- Izzo, D. (2015). "Revisiting Lambert's problem." *Celestial Mechanics and Dynamical Astronomy* 121, 1–15.
- Bate, R., Mueller, D., White, J. (1971). *Fundamentals of Astrodynamics*. Dover.
- Vallado, D. (2013). *Fundamentals of Astrodynamics and Applications*, 4th ed. Microcosm Press.

## Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| 3D | Three.js r155 |
| Plots | Plotly.js |
| Math | mathjs |
| Deploy | Vercel |

## Local dev

```bash
git clone https://github.com/aqron7/delta-V
cd delta-V
npm install
npm run dev
```

Opens at `http://localhost:5173`. No environment variables needed — all computation is client-side.
