import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { BODIES, AU, GM_SUN } from '../physics/constants.js';
import { planetPosition, dateToJulian } from '../physics/ephemeris.js';
import { lambert } from '../physics/lambert.js';
import { useMission } from '../hooks/useMission.jsx';

const COLORS = {
  mercury: 0xa0aec0,
  venus:   0xfbbf24,
  earth:   0x3b82f6,
  mars:    0xef4444,
  jupiter: 0xea580c,
};

function ringGeometry(radius, segments = 256) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(radius * Math.cos(t), radius * Math.sin(t), 0));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

function planetVelocityAU(name, jd) {
  const r = planetPosition(name, jd);
  const rMag = Math.sqrt(r[0]*r[0] + r[1]*r[1]); // AU
  const speed = Math.sqrt(GM_SUN / (rMag * AU)); // m/s
  return [speed * -r[1]/rMag, speed * r[0]/rMag, 0]; // m/s, but only direction used here
}

function transferPoints(origin, destination, launchDate, arrivalDate, n = 200) {
  const jd1 = dateToJulian(launchDate);
  const jd2 = dateToJulian(arrivalDate);
  const tof = (jd2 - jd1) * 86400;
  const p1 = planetPosition(origin, jd1);
  const p2 = planetPosition(destination, jd2);
  const r1 = [p1[0]*AU, p1[1]*AU, p1[2]*AU];
  const r2 = [p2[0]*AU, p2[1]*AU, p2[2]*AU];
  const sol = lambert(r1, r2, tof, GM_SUN, true);
  if (!sol.converged) return null;

  // Two-body propagation from r1, v1 by Keplerian elements → discrete points.
  // Simpler: use universal Lagrange coefficients via small time steps. For viz, RK4 numerical.
  const dt = tof / (n - 1);
  const pts = new Array(n);
  let r = [...r1];
  let v = [...sol.v1];
  pts[0] = new THREE.Vector3(r[0]/AU, r[1]/AU, r[2]/AU);
  const accel = (rv) => {
    const rm = Math.hypot(rv[0], rv[1], rv[2]);
    const k = -GM_SUN / (rm*rm*rm);
    return [k*rv[0], k*rv[1], k*rv[2]];
  };
  for (let i = 1; i < n; i++) {
    // RK4
    const a1 = accel(r);
    const k1r = v;
    const k1v = a1;
    const r2_ = [r[0]+k1r[0]*dt/2, r[1]+k1r[1]*dt/2, r[2]+k1r[2]*dt/2];
    const v2_ = [v[0]+k1v[0]*dt/2, v[1]+k1v[1]*dt/2, v[2]+k1v[2]*dt/2];
    const a2 = accel(r2_);
    const k2r = v2_;
    const k2v = a2;
    const r3_ = [r[0]+k2r[0]*dt/2, r[1]+k2r[1]*dt/2, r[2]+k2r[2]*dt/2];
    const v3_ = [v[0]+k2v[0]*dt/2, v[1]+k2v[1]*dt/2, v[2]+k2v[2]*dt/2];
    const a3 = accel(r3_);
    const k3r = v3_;
    const k3v = a3;
    const r4_ = [r[0]+k3r[0]*dt, r[1]+k3r[1]*dt, r[2]+k3r[2]*dt];
    const v4_ = [v[0]+k3v[0]*dt, v[1]+k3v[1]*dt, v[2]+k3v[2]*dt];
    const a4 = accel(r4_);
    r = [
      r[0] + (dt/6)*(k1r[0] + 2*k2r[0] + 2*k3r[0] + v4_[0]),
      r[1] + (dt/6)*(k1r[1] + 2*k2r[1] + 2*k3r[1] + v4_[1]),
      r[2] + (dt/6)*(k1r[2] + 2*k2r[2] + 2*k3r[2] + v4_[2]),
    ];
    v = [
      v[0] + (dt/6)*(k1v[0] + 2*k2v[0] + 2*k3v[0] + a4[0]),
      v[1] + (dt/6)*(k1v[1] + 2*k2v[1] + 2*k3v[1] + a4[1]),
      v[2] + (dt/6)*(k1v[2] + 2*k2v[2] + 2*k3v[2] + a4[2]),
    ];
    pts[i] = new THREE.Vector3(r[0]/AU, r[1]/AU, r[2]/AU);
  }
  return pts;
}

export default function OrbitVisualizer() {
  const mountRef = useRef(null);
  const stateRef = useRef({});
  const { origin, destination, selected } = useMission();

  // One-time scene setup.
  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = 320;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
    camera.position.set(2, -2, 1.6);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // Starfield
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(1000 * 3);
    for (let i = 0; i < 1000; i++) {
      const r = 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i*3+2] = r * Math.cos(phi);
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starGeom, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, sizeAttenuation: false }));
    scene.add(stars);

    // Sun
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfcd34d }),
    );
    scene.add(sun);

    // Planet orbit rings (always shown)
    const ringGroup = new THREE.Group();
    Object.entries(BODIES).forEach(([name, body]) => {
      if (body.sma / AU > 6) return; // hide Jupiter rim by default for scale
      const ring = new THREE.LineLoop(
        ringGeometry(body.sma / AU),
        new THREE.LineBasicMaterial({ color: COLORS[name] ?? 0x6b7fa3, transparent: true, opacity: 0.25 }),
      );
      ringGroup.add(ring);
    });
    scene.add(ringGroup);

    // Planet markers
    const planetMarkers = {};
    Object.entries(BODIES).forEach(([name]) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 16, 16),
        new THREE.MeshBasicMaterial({ color: COLORS[name] ?? 0xffffff }),
      );
      planetMarkers[name] = mesh;
      scene.add(mesh);
    });

    // Transfer arc placeholder
    const arcMat = new THREE.LineBasicMaterial({ color: 0x22d3ee });
    const arcLine = new THREE.Line(new THREE.BufferGeometry(), arcMat);
    scene.add(arcLine);

    // Camera control: drag to orbit + slow auto-rotate.
    let phi = Math.atan2(camera.position.y, camera.position.x);
    let theta = Math.atan2(camera.position.z, Math.hypot(camera.position.x, camera.position.y));
    let radius = camera.position.length();
    let dragging = false;
    let last = { x: 0, y: 0 };

    const onDown = (e) => { dragging = true; last = { x: e.clientX, y: e.clientY }; };
    const onUp   = () => { dragging = false; };
    const onMove = (e) => {
      if (!dragging) return;
      phi   -= (e.clientX - last.x) * 0.005;
      theta += (e.clientY - last.y) * 0.005;
      theta = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, theta));
      last = { x: e.clientX, y: e.clientY };
    };
    const onWheel = (e) => {
      e.preventDefault();
      radius *= 1 + e.deltaY * 0.001;
      radius = Math.max(0.5, Math.min(20, radius));
    };
    renderer.domElement.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    let rafId;
    let t0 = performance.now();
    const animate = () => {
      const t = performance.now();
      const dt = (t - t0) / 1000; t0 = t;
      if (!dragging) phi += dt * 0.05; // slow auto-rotate
      camera.position.set(
        radius * Math.cos(theta) * Math.cos(phi),
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta),
      );
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth;
      renderer.setSize(w, height);
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    stateRef.current = { scene, planetMarkers, arcLine };

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      renderer.domElement.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Update planet positions + transfer arc whenever the selection changes.
  useEffect(() => {
    const { planetMarkers, arcLine } = stateRef.current;
    if (!planetMarkers || !arcLine) return;
    const launch = selected?.launchDate;
    const arrival = selected?.arrivalDate;
    const date = launch || new Date('2026-03-15');

    const jd = dateToJulian(date);
    Object.entries(planetMarkers).forEach(([name, mesh]) => {
      const p = planetPosition(name, jd);
      mesh.position.set(p[0], p[1], p[2]);
    });

    if (launch && arrival) {
      const pts = transferPoints(origin, destination, launch, arrival, 200);
      if (pts) {
        arcLine.geometry.dispose();
        arcLine.geometry = new THREE.BufferGeometry().setFromPoints(pts);
        arcLine.visible = true;
      } else {
        arcLine.visible = false;
      }
    } else {
      arcLine.visible = false;
    }
  }, [origin, destination, selected]);

  return (
    <div className="panel p-3">
      <div className="label mb-2">orbit visualizer</div>
      <div ref={mountRef} style={{ width: '100%', height: 320 }} />
    </div>
  );
}
