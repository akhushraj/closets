// 3D room view (Three.js). Plan x -> three X, plan y -> three Z, height -> three Y. Units: inches.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { frame } from "../model/builders.js";

// Procedural rift-oak grain, adapted from ../kitchencabinets.
function oakCanvas() {
  const c = document.createElement("canvas"); c.width = 512; c.height = 1024;
  const g = c.getContext("2d");
  g.fillStyle = "#c4a174"; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 26; i++) {
    g.fillStyle = `rgba(${130 + Math.random() * 30 | 0},${100 + Math.random() * 25 | 0},60,${0.05 + Math.random() * 0.06})`;
    g.fillRect(Math.random() * c.width, 0, 4 + Math.random() * 14, c.height);
  }
  for (let i = 0; i < 220; i++) {
    const dark = Math.random() < 0.5;
    g.strokeStyle = `rgba(${dark ? 90 : 150},${dark ? 62 : 118},${dark ? 34 : 78},${0.06 + Math.random() * 0.18})`;
    g.lineWidth = 0.4 + Math.random() * 1.6;
    g.beginPath(); let x = Math.random() * c.width;
    for (let y = 0; y <= c.height; y += 10) { x += (Math.random() - 0.5) * 1.2; g.lineTo(x, y); }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// Scale box UVs to real inches and turn the grain to run along each face's long side.
const TEX_W = 20, TEX_H = 40;
function woodUV(geo, w, h, d) {
  const uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    const [a, b] = dims[f], swap = a > b;
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k, u = uv.getX(i), v = uv.getY(i);
      if (swap) uv.setXY(i, v * b / TEX_W, u * a / TEX_H); else uv.setXY(i, u * a / TEX_W, v * b / TEX_H);
    }
  }
  uv.needsUpdate = true;
}

const GARMENT = [0x2f3b4c, 0x6b7f8e, 0xd9d4c7, 0x8b3a3a, 0x3d5a45, 0x1f1f22, 0xa8927a];

export function createThreeView(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1c1d20);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(40, 1, 1, 3000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a7f70, 0.7);
  const key = new THREE.DirectionalLight(0xfff6ea, 1.1);
  key.position.set(160, 260, 220); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -120, right: 120, top: 160, bottom: -120, near: 10, far: 700 });
  key.shadow.bias = -0.0004;
  scene.add(hemi, key, key.target);

  const oakTex = oakCanvas();
  const mats = {
    oak: new THREE.MeshStandardMaterial({ map: oakTex, roughness: 0.6 }),
    walnut: new THREE.MeshStandardMaterial({ map: oakTex, color: 0x7a5236, roughness: 0.55 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf1eee8, roughness: 0.55 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xcbc5ba, roughness: 0.95 }),
    header: new THREE.MeshStandardMaterial({ color: 0xbfb9ae, roughness: 0.95, side: THREE.DoubleSide }),
    floor: new THREE.MeshStandardMaterial({ color: 0xb9a683, roughness: 0.85, side: THREE.DoubleSide }),
    kick: new THREE.MeshStandardMaterial({ color: 0x3a3530, roughness: 0.8 }),
    pull: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.6, roughness: 0.35 }),
    rod: new THREE.MeshStandardMaterial({ color: 0xbdbdbd, metalness: 0.9, roughness: 0.3 }),
    ledOn: new THREE.MeshBasicMaterial({ color: 0xfff0d2 }),
    ledOff: new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.4 }),
    hamper: new THREE.MeshStandardMaterial({ color: 0xb9a98c, roughness: 1 }),
    door: new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.5, transparent: true, opacity: 0.28, depthWrite: false }),
    hatch: new THREE.MeshStandardMaterial({ color: 0x5f574c, roughness: 0.9 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x2c2e33, metalness: 0.5, roughness: 0.45 }),
    appliance: new THREE.MeshStandardMaterial({ color: 0xeeece8, roughness: 0.35, metalness: 0.1 }),
    stone: new THREE.MeshStandardMaterial({ color: 0xdcd8d0, roughness: 0.25 }),
    panel: new THREE.MeshStandardMaterial({ color: 0x8c8f94, metalness: 0.6, roughness: 0.4 }),
    board: new THREE.MeshStandardMaterial({ color: 0xd9d5cc, roughness: 0.9 }),
    outlet: new THREE.MeshStandardMaterial({ color: 0xc8821f, emissive: 0x3a2405, roughness: 0.5 }),
    garments: GARMENT.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 })),
  };

  let root = null, framedFor = null, last = null, bounds = null, showWalls = true;
  const hiddenSides = new Set();   // wall ids whose contents are hidden, so you can look past them

  function addBox(p, mat, wood = false) {
    if (p.poly) {   // a flat part cut to a plan polygon: extrude it and lay it down
      const shape = new THREE.Shape(p.poly.map(([x, y]) => new THREE.Vector2(x, -y)));
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: p.z1 - p.z0, bevelEnabled: false }), mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(0, p.z0, 0);
      m.castShadow = m.receiveShadow = true;
      root.add(m);
      return m;
    }
    const turned = p.yaw != null;
    const w = turned ? p.len : p.x1 - p.x0, h = p.z1 - p.z0, d = turned ? p.thick : p.y1 - p.y0;
    const geo = new THREE.BoxGeometry(w, h, d);
    if (wood) woodUV(geo, w, h, d);
    const m = new THREE.Mesh(geo, mat);
    if (turned) m.rotation.y = p.yaw;
    m.position.set(turned ? p.cx : (p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2, turned ? p.cy : (p.y0 + p.y1) / 2);
    m.castShadow = m.receiveShadow = true;
    root.add(m);
    return m;
  }

  function wallPiece(w, u0, u1, z0, z1, header = false) {
    const f = frame(w), len = u1 - u0;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, z1 - z0), header ? mats.header : mats.wall);
    const um = (u0 + u1) / 2;
    m.position.set(f.ax + f.dx * um, (z0 + z1) / 2, f.ay + f.dy * um);
    m.rotation.y = Math.atan2(f.nx, f.ny);   // plane normal -> inward, so near walls cull away
    m.receiveShadow = true;
    m.userData.wall = !header;   // headers stay put when walls are hidden
    m.visible = showWalls;
    root.add(m);
  }

  function update(model) {
    last = model;
    if (root) { root.traverse(o => o.geometry && o.geometry.dispose()); scene.remove(root); }
    root = new THREE.Group(); scene.add(root);
    const c = model.closet, p = model.params, ceil = c.ceiling;
    const wood0 = mats[p.finish] || mats.oak;

    const shape = new THREE.Shape(c.outline.map(([x, y]) => new THREE.Vector2(x, -y)));
    const floor = new THREE.Mesh(new THREE.ShapeGeometry(shape), mats.floor);
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; root.add(floor);

    for (const w of c.walls) {
      const len = frame(w).len;
      const ds = model.doors.filter(d => d.wall === w.id).sort((a, b) => a.u0 - b.u0);
      let u = 0;
      for (const d of ds) { if (d.u0 > u) wallPiece(w, u, d.u0, 0, ceil); wallPiece(w, d.u0, d.u1, d.roH, ceil, true); u = d.u1; }
      if (u < len) wallPiece(w, u, len, 0, ceil);
    }
    for (const h of model.hatches || [])
      addBox({ x0: h.x0, x1: h.x1, y0: h.y0, y1: h.y1, z0: 0, z1: 0.12 }, mats.hatch).castShadow = false;

    const lights = [];
    for (const part of model.parts) {
      const wood = part.mat ? (mats[part.mat] || wood0) : wood0;   // bought boxes read differently
      const before = root.children.length;
      switch (part.kind) {
        case "carcass": case "shelf": case "front": addBox(part, wood, true); break;
        case "kick": addBox(part, mats.kick); break;
        case "pull": addBox(part, mats.pull); break;
        case "hamper": addBox(part, mats.hamper); break;
        case "cabinet": case "backboard": addBox(part, mats.white); break;
        case "outlet": addBox(part, mats.outlet).castShadow = false; break;
        case "rack": case "ups": addBox(part, mats.metal); break;
        case "device": addBox(part, part.tone === "light" ? mats.white : mats.metal); break;
        case "desktop": addBox(part, wood, true); break;
        case "nosing": case "cleat": addBox(part, wood, true); break;
        case "casing": addBox(part, mats.white); break;
        case "board": addBox(part, mats.board); break;
        case "appliance": case "sink": case "dresser": addBox(part, mats.appliance); break;
        case "dresserfront": addBox(part, mats.white); break;
        case "counter": addBox(part, mats.stone); break;
        case "elpanel": addBox(part, mats.panel); break;
        case "garment": addBox(part, mats.garments[part.tone % GARMENT.length]); break;
        case "led": addBox(part, p.lights ? mats.ledOn : mats.ledOff).castShadow = false; lights.push(part); break;
        case "rod": {
          const alongX = part.x1 - part.x0 > part.y1 - part.y0, L = alongX ? part.x1 - part.x0 : part.y1 - part.y0;
          const m = new THREE.Mesh(new THREE.CylinderGeometry(0.625, 0.625, L, 20), mats.rod);
          m.rotation[alongX ? "z" : "x"] = Math.PI / 2;
          m.position.set((part.x0 + part.x1) / 2, (part.z0 + part.z1) / 2, (part.y0 + part.y1) / 2);
          m.castShadow = true; root.add(m); break;
        }
        default: addBox(part, wood, true);
      }
      for (let i = before; i < root.children.length; i++) root.children[i].userData.side = part.wall;
    }

    // LED strips light the space below them
    if (p.lights) for (const s of lights) {
      const L = Math.max(s.x1 - s.x0, s.y1 - s.y0), n = L > 30 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const t = (i + 1) / (n + 1);
        const x = s.x1 - s.x0 > s.y1 - s.y0 ? s.x0 + (s.x1 - s.x0) * t : (s.x0 + s.x1) / 2;
        const z = s.y1 - s.y0 >= s.x1 - s.x0 ? s.y0 + (s.y1 - s.y0) * t : (s.y0 + s.y1) / 2;
        const pl = new THREE.PointLight(0xffd6a0, 22, 46, 1.25);
        pl.position.set(x, s.z0 - 1.5, z); root.add(pl);
      }
    }
    hemi.intensity = p.lights ? 0.45 : 0.75;
    key.intensity = p.lights ? 0.7 : 1.1;

    // doors, standing open 90 degrees (see-through so they never hide the closet)
    for (const d of model.doors) {
      if (d.swing === "slide") continue;   // sliding panels sit in the opening; nothing to show open
      const w = c.walls.find(x => x.id === d.wall), f = frame(w), out = d.swing === "out";
      const v = out ? -c.wallT : 0, s = out ? -1 : 1, other = d.hingeU < (d.u0 + d.u1) / 2 ? 1 : -1;
      const hx = f.ax + f.dx * d.hingeU + f.nx * v, hy = f.ay + f.dy * d.hingeU + f.ny * v;
      const dx = f.nx * s, dy = f.ny * s;
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(d.slab, d.h, 1.375), mats.door);
      leaf.rotation.y = Math.atan2(-dy, dx);
      leaf.position.set(hx + dx * d.slab / 2 + f.dx * other * 0.7, d.h / 2, hy + dy * d.slab / 2 + f.dy * other * 0.7);
      root.add(leaf);
    }

    const xs = c.outline.map(q => q[0]), ys = c.outline.map(q => q[1]);
    bounds = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    key.target.position.set((bounds.x0 + bounds.x1) / 2, 40, (bounds.y0 + bounds.y1) / 2);
    if (framedFor !== model.info.id) { hiddenSides.clear(); view("overview"); framedFor = model.info.id; }
    applySides();
  }

  // hide one wall's fittings so you can look straight at the one behind it
  function applySides() {
    if (root) root.traverse(o => { if (o.userData.side) o.visible = !hiddenSides.has(o.userData.side); });
  }
  function setSide(id, on) {
    if (on) hiddenSides.delete(id); else hiddenSides.add(id);
    applySides();
  }
  function sideShown(id) { return !hiddenSides.has(id); }

  function view(name) {
    if (!last || !bounds) return;
    // cameras stand outside the (first) door's wall, so that wall culls away and you look in
    const c = last.closet, d = last.doors[0];
    const cx = (bounds.x0 + bounds.x1) / 2, cy = (bounds.y0 + bounds.y1) / 2;
    const R = Math.max(bounds.x1 - bounds.x0, bounds.y1 - bounds.y0);
    const w = c.walls.find(x => x.id === d.wall), f = frame(w), um = (d.u0 + d.u1) / 2;
    const px = f.ax + f.dx * um, py = f.ay + f.dy * um;
    if (name === "door") {
      camera.position.set(px - f.nx * (R * 0.9 + 20), 66, py - f.ny * (R * 0.9 + 20));
      controls.target.set(cx + f.nx * 6, 50, cy + f.ny * 6);
    } else {
      const dist = Math.max(R * 1.25 + 20, 120), hgt = 60 + R * 0.45;
      camera.position.set(px - f.nx * dist + f.dx * R * 0.25, hgt, py - f.ny * dist + f.dy * R * 0.25);
      controls.target.set(cx, 46, cy);
    }
    controls.update();
  }

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });

  function setWalls(v) {
    showWalls = !!v;
    if (root) root.traverse(o => { if (o.userData.wall) o.visible = showWalls; });
  }

  return { update, resize, view, setWalls, setSide, sideShown };
}
