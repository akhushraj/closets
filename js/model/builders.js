// Reusable closet builders. Every builder works in WALL-LOCAL coordinates:
//   u = distance along the wall from its start point `a` (left edge of its elevation)
//   v = distance out from the wall face into the closet
//   z = height above the finished floor
// and emits parts that also carry plan (x, y) boxes, so the plan, elevation and 3D
// views can all draw from the same list. Each builder also returns a plan `module`
// (footprint + label/sub text); an optional `ghost` on a module is drawn dashed in plan
// (an open drawer, a folded-down board).
import { PLY, FRONT, slideFor, frac } from "../lib/units.js";

export function frame(w) {
  const [ax, ay] = w.a, [bx, by] = w.b;
  const len = Math.hypot(bx - ax, by - ay);
  const dx = (bx - ax) / len, dy = (by - ay) / len;
  return { ax, ay, dx, dy, nx: -dy, ny: dx, len };   // n = inward normal (plan is y-down)
}

export function box(w, kind, u0, u1, v0, v1, z0, z1, extra = {}) {
  const f = frame(w);
  const p = (u, v) => [f.ax + f.dx * u + f.nx * v, f.ay + f.dy * u + f.ny * v];
  const [xA, yA] = p(u0, v0), [xB, yB] = p(u1, v1);
  return { kind, wall: w.id, u0, u1, v0, v1, z0, z1,
    x0: Math.min(xA, xB), x1: Math.max(xA, xB), y0: Math.min(yA, yB), y1: Math.max(yA, yB), ...extra };
}

const module = (w, kind, u0, u1, v0, v1, extra = {}) => box(w, kind, u0, u1, v0, v1, 0, 0, extra);

/* ---------- a flat part whose plan outline is a polygon: a shelf cut to a diagonal.
   `pts` are plan points in order; z0/z1 are its underside and top. ---------- */
export function polyPart(w, kind, pts, z0, z1, extra = {}) {
  const f = frame(w);
  const us = pts.map(([x, y]) => (x - f.ax) * f.dx + (y - f.ay) * f.dy);
  const vs = pts.map(([x, y]) => (x - f.ax) * f.nx + (y - f.ay) * f.ny);
  const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
  return { kind, wall: w.id, z0, z1,
    u0: Math.min(...us), u1: Math.max(...us), v0: Math.min(...vs), v1: Math.max(...vs),
    x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys),
    poly: pts, ...extra };
}

/* ---------- a panel that runs on the diagonal in plan (across a blind corner).
   `a` and `b` are plan points; the panel is `thick` thick, centred on that line.
   It carries the same bbox/u/v fields as box() so elevations and bounds still work,
   plus yaw/len/thick for the 3D view and `diag` for the plan. ---------- */
export function diagPanel(w, kind, a, b, thick, z0, z1, extra = {}) {
  const f = frame(w);
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
  const hx = -(dy / len) * thick / 2, hy = (dx / len) * thick / 2;
  const xs = [a[0] + hx, a[0] - hx, b[0] + hx, b[0] - hx];
  const ys = [a[1] + hy, a[1] - hy, b[1] + hy, b[1] - hy];
  const us = xs.map((x, i) => (x - f.ax) * f.dx + (ys[i] - f.ay) * f.dy);
  const vs = xs.map((x, i) => (x - f.ax) * f.nx + (ys[i] - f.ay) * f.ny);
  return { kind, wall: w.id, z0, z1,
    u0: Math.min(...us), u1: Math.max(...us), v0: Math.min(...vs), v1: Math.max(...vs),
    x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys),
    yaw: Math.atan2(-dy, dx), len, thick, cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2,
    diag: [a, b], ...extra };
}

// Tiny deterministic PRNG so garments look the same on every render.
function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }

function garmentsOnRod(parts, w, r, ia, ib, rodV, z, kind, toneBase) {
  const spec = { shirt: [1.1, 31, 4], jacket: [2.1, 34, 3], coat: [2.6, 42, 3], pants: [1.3, 24, 3], long: [2.2, 52, 10] };
  let g = ia + 1.2, k = 0;
  while (g < ib - 1.2) {
    const kk = kind === "mixed" ? (r() < 0.55 ? "shirt" : "jacket") : kind;
    const [t, L, jit] = spec[kk];
    const len = L + (r() - 0.5) * jit;
    if (g + t > ib - 1.2) break;
    parts.push(box(w, "garment", g, g + t, rodV - 9.5, rodV + 9.5, z - len, z - 1.2, { type: kk, tone: (toneBase + k) % 7 }));
    g += t + 0.35; k++;
  }
}

/* ---------- single-level hanging run with a hat shelf above the rod ---------- */
export function hangRun(w, o) {
  const { u0, u1, depth = 24, rodZ = 70, shelfDepth = 14, coatsTo = u0, garments = true } = o;
  const parts = [], r = rng(7);
  const rodV = Math.min(12, depth / 2), shelfZ = rodZ + 2;
  parts.push(box(w, "rod", u0 + 0.25, u1 - 0.25, rodV - 0.625, rodV + 0.625, rodZ - 0.625, rodZ + 0.625,
    { axis: "u", mark: true, label: "Rod" }));
  parts.push(box(w, "shelf", u0, u1, 0, shelfDepth, shelfZ, shelfZ + PLY, { mark: true, label: "Hat shelf" }));
  parts.push(box(w, "led", u0 + 1, u1 - 1, shelfDepth - 1.4, shelfDepth - 0.6, shelfZ - 0.35, shelfZ));
  if (garments) {
    if (coatsTo > u0 + 3) garmentsOnRod(parts, w, r, u0, coatsTo, rodV, rodZ, "coat", 0);
    garmentsOnRod(parts, w, r, Math.max(u0, coatsTo - 1.2), u1, rodV, rodZ, "mixed", 2);
  }
  const rodLen = u1 - u0 - 0.5;
  return { parts, module: module(w, "hang", u0, u1, 0, depth,
    { label: "Hanging", sub: `rod ${frac(rodLen, 8)} at ${frac(rodZ, 8)}`, rodLen, rodZ, rodV, rods: [{ v: rodV }] }) };
}

/* ---------- hanging run split into sections (long / double) with gables and a top shelf ---------- */
export function hangSections(w, o) {
  const { u0, depth = 24, shelfZ = 84, shelfDepth = 16, upperRod = 82, lowerRod = 41, sections, seed = 11 } = o;
  const parts = [], modules = [], r = rng(seed);
  const rodV = Math.min(12, depth / 2);
  const u1 = u0 + sections.reduce((s, x) => s + x.len, 0);
  parts.push(box(w, "shelf", u0, u1, 0, shelfDepth, shelfZ, shelfZ + PLY, { mark: true, label: "Top shelf" }));
  parts.push(box(w, "led", u0 + 1, u1 - 1, shelfDepth - 1.4, shelfDepth - 0.6, shelfZ - 0.35, shelfZ));
  let u = u0, rodTotal = 0;
  sections.forEach((s, i) => {
    const a = u, b = u + s.len, last = i === sections.length - 1;
    u = b;
    if (!last) parts.push(box(w, "carcass", b - PLY / 2, b + PLY / 2, 0, depth, 0, shelfZ));
    const ia = a + (i > 0 ? PLY / 2 : 0), ib = b - (last ? 0 : PLY / 2);
    const rods = s.type === "double" ? [upperRod, lowerRod] : [upperRod];
    for (const z of rods) {
      parts.push(box(w, "rod", ia + 0.25, ib - 0.25, rodV - 0.625, rodV + 0.625, z - 0.625, z + 0.625,
        { axis: "u", mark: true, label: z === lowerRod && rods.length > 1 ? "Lower rod" : "Rod" }));
      garmentsOnRod(parts, w, r, ia, ib, rodV, z, s.type === "long" ? "long" : z === lowerRod ? "pants" : "shirt", i * 3);
      rodTotal += ib - ia - 0.5;
    }
    modules.push(module(w, "hang", a, b, 0, depth, { label: s.owner || "Hanging",
      sub: `${s.type} · ${frac(s.len, 8)}`, rodV, owner: s.owner, type: s.type, rods: [{ v: rodV }] }));
  });
  return { parts, modules, rodTotal };
}

/* ---------- drawer tower: toe kick, drawer stack, counter, open shelves ---------- */
export function drawerTower(w, o) {
  const { u0, u1, depth = 20, top = 88.75, kick = 4, fronts = [9, 8, 8, 7, 6], shelves = 2,
    label = "Drawer tower", prefix = "D" } = o;
  const parts = [], drawers = [];
  const cD = depth - FRONT, W = u1 - u0;
  parts.push(box(w, "carcass", u0, u0 + PLY, 0, cD, 0, top));
  parts.push(box(w, "carcass", u1 - PLY, u1, 0, cD, 0, top));
  parts.push(box(w, "carcass", u0 + PLY, u1 - PLY, 0, cD, top - PLY, top, { mark: true, label: "Tower top" }));
  parts.push(box(w, "carcass", u0 + PLY, u1 - PLY, 0, cD, kick, kick + PLY));
  parts.push(box(w, "kick", u0 + PLY, u1 - PLY, cD - 3 - PLY, cD - 3, 0, kick, { mark: true, label: "Toe kick" }));

  const slide = slideFor(cD - 0.5);
  let z = kick;
  // `fronts` run bottom -> top; labels count from the top (D1 = top drawer).
  fronts.forEach((h, i) => {
    const lab = prefix + (fronts.length - i);
    parts.push(box(w, "front", u0 + 1 / 16, u1 - 1 / 16, cD, depth, z + 1 / 16, z + h - 1 / 16,
      { idx: i + 1, label: lab, h, mark: true }));
    const zc = z + h / 2, um = (u0 + u1) / 2, pw = Math.min(3, W / 2 - 2);
    parts.push(box(w, "pull", um - pw, um + pw, depth, depth + 1.1, zc - 0.25, zc + 0.25));
    const boxH = Math.max(2.5, Math.floor((h - 1.25) * 2) / 2);
    const boxW = W - 2 * PLY - 1;
    drawers.push({ idx: i + 1, label: lab, z0: z, frontH: h - 1 / 8, frontW: W - 1 / 8,
      boxH, boxW, boxL: slide, inH: boxH - 0.5, inW: boxW - 1, inL: slide - 1, slide });
    z += h;
  });
  parts.push(box(w, "shelf", u0 + PLY, u1 - PLY, 0, cD, z, z + PLY, { mark: true, label: "Counter" }));
  const counterZ = z + PLY;

  const open0 = counterZ, open1 = top - PLY, gap = (open1 - open0) / (shelves + 1);
  const ledUnder = [top - PLY];
  for (let i = 1; i <= shelves; i++) {
    const zs = open0 + gap * i - PLY / 2;
    parts.push(box(w, "shelf", u0 + PLY, u1 - PLY, 0, cD - 0.5, zs, zs + PLY, { mark: true, label: "Adj. shelf" }));
    ledUnder.push(zs);
  }
  for (const zl of ledUnder)
    parts.push(box(w, "led", u0 + PLY + 0.5, u1 - PLY - 0.5, cD - 2.2, cD - 1.4, zl - 0.35, zl));

  const mod = module(w, "tower", u0, u1, 0, depth, {
    label, sub: `${fronts.length} × ${slide}" deep`, drawerCount: fronts.length, slide, counterZ, top,
    ghost: { u0, u1, v0: depth, v1: depth + slide + 1.1, label: "drawer fully open" } });
  return { parts, module: mod, drawers, counterZ };
}

/* ---------- hanging over drawers: plywood gables full height, drawer base with a counter,
   one rod + hat shelf above, and upper shelves. `fronts` run bottom -> top. ---------- */
export function dressSection(w, o) {
  const { u0, u1, depth = 24, fronts = [10, 9, 8, 7], kick = 4, rodZ = 80, hatDepth = 14, upper = [96, 110],
    top = 116, label = "Section", prefix = "D", garment = "shirt", seed = 3 } = o;
  const parts = [], drawers = [], W = u1 - u0, cD = depth - FRONT;
  parts.push(box(w, "carcass", u0, u0 + PLY, 0, depth, 0, top));
  parts.push(box(w, "carcass", u1 - PLY, u1, 0, depth, 0, top));
  parts.push(box(w, "carcass", u0 + PLY, u1 - PLY, 0, cD, kick, kick + PLY));
  parts.push(box(w, "kick", u0 + PLY, u1 - PLY, cD - 3 - PLY, cD - 3, 0, kick, { mark: true, label: "Toe kick" }));
  const slide = slideFor(cD - 0.5);
  let z = kick;
  fronts.forEach((h, i) => {
    const lab = prefix + (fronts.length - i);
    parts.push(box(w, "front", u0 + 1 / 16, u1 - 1 / 16, cD, depth, z + 1 / 16, z + h - 1 / 16, { idx: i + 1, label: lab, h, mark: true }));
    const zc = z + h / 2, um = (u0 + u1) / 2, pw = Math.min(3, W / 2 - 2);
    parts.push(box(w, "pull", um - pw, um + pw, depth, depth + 1.1, zc - 0.25, zc + 0.25));
    const boxH = Math.max(2.5, Math.floor((h - 1.25) * 2) / 2), boxW = W - 2 * PLY - 1;
    drawers.push({ idx: i + 1, label: lab, z0: z, frontH: h - 1 / 8, frontW: W - 1 / 8,
      boxH, boxW, boxL: slide, inH: boxH - 0.5, inW: boxW - 1, inL: slide - 1, slide });
    z += h;
  });
  parts.push(box(w, "shelf", u0 + PLY, u1 - PLY, 0, depth, z, z + PLY, { mark: true, label: "Counter" }));
  const counterZ = z + PLY, ia = u0 + PLY, ib = u1 - PLY, rodV = Math.min(12, depth / 2);
  parts.push(box(w, "rod", ia + 0.25, ib - 0.25, rodV - 0.625, rodV + 0.625, rodZ - 0.625, rodZ + 0.625, { axis: "u", mark: true, label: "Rod" }));
  parts.push(box(w, "shelf", ia, ib, 0, hatDepth, rodZ + 2, rodZ + 2 + PLY, { mark: true, label: "Hat shelf" }));
  parts.push(box(w, "led", ia + 1, ib - 1, hatDepth - 1.4, hatDepth - 0.6, rodZ + 2 - 0.35, rodZ + 2));
  garmentsOnRod(parts, w, rng(seed), ia, ib, rodV, rodZ, garment, seed);
  for (const zt of upper) if (zt < top - 1)
    parts.push(box(w, "shelf", ia, ib, 0, depth - 0.5, zt - PLY, zt, { mark: true, label: "Upper shelf" }));
  return { parts, drawers, counterZ, module: module(w, "dress", u0, u1, 0, depth,
    { label, sub: `${fronts.length} drawers · rod ${frac(rodZ, 8)}`, rods: [{ v: rodV }], slide }) };
}

/* ---------- run of shelf cabinets with hinged doors (lower + upper), swing shown in plan ---------- */
export function cabinetRun(w, o) {
  const { u0, u1, depth = 15, units = 4, top = 96, kick = 4, split = 48, levels = [20, 34, 62, 76], label = "Cab" } = o;
  const parts = [], modules = [], cD = depth - FRONT, uw = (u1 - u0) / units;
  for (let i = 0; i < units; i++) {
    const a = u0 + i * uw, b = a + uw;
    parts.push(box(w, "carcass", a, a + PLY, 0, cD, 0, top));
    parts.push(box(w, "carcass", b - PLY, b, 0, cD, 0, top));
    parts.push(box(w, "carcass", a + PLY, b - PLY, 0, cD, top - PLY, top, { mark: i === 0, label: "Cabinet top" }));
    parts.push(box(w, "carcass", a + PLY, b - PLY, 0, cD, kick, kick + PLY));
    parts.push(box(w, "kick", a + PLY, b - PLY, cD - 3 - PLY, cD - 3, 0, kick));
    for (const zt of levels) if (zt > kick + 2 && zt < top - 2 && Math.abs(zt - split) > 1)
      parts.push(box(w, "shelf", a + PLY, b - PLY, 0, cD - 0.5, zt - PLY, zt, { mark: i === 0, label: "Shelf" }));
    const hingeRight = i % 2 === 1;
    for (const [z0, z1] of [[kick, split], [split, top]]) {
      parts.push(box(w, "cabdoor", a + 1 / 16, b - 1 / 16, cD, depth, z0 + 1 / 16, z1 - 1 / 16,
        { mark: i === 0, label: z0 === kick ? "Lower door" : "Upper door" }));
      const pu = hingeRight ? a + 1.5 : b - 1.5, pz = z0 === kick ? z1 - 4 : z0 + 4;
      parts.push(box(w, "pull", pu - 0.4, pu + 0.4, depth, depth + 1.1, pz - 2.5, pz + 2.5));
    }
    modules.push(module(w, "cabinets", a, b, 0, depth, { label: `${label} ${i + 1}`, sub: `${frac(b - a, 8)} doors`,
      ghost: { u0: a, u1: b, v0: depth, v1: depth + (b - a), label: "door swing" } }));
  }
  return { parts, modules };
}

/* ---------- East Star factory closet cabinets: stock widths in an 84" or 94" box, chipboard
   carcass on a 1/4" plywood back, floor-standing (the back is too thin to hang from).
   `bays` is a list of { w, rods, levels, fronts, label }; fronts run bottom -> top.
   Every part carries mat:"oak" so the 3D view tells the bought boxes from site-built plywood. ---------- */
export const ES = 0.625;   // chipboard side, top and bottom
export const ES_WIDTHS = [36, 30, 24, 21, 18, 15];

// The widest set of stock widths that fits a run. Everything is a multiple of 3, so the
// filler is whatever the run has left over above the nearest achievable multiple.
const packMemo = new Map();
function compose(t) {
  if (t === 0) return [];
  if (packMemo.has(t)) return packMemo.get(t);
  let out = null;
  for (const wd of ES_WIDTHS) { if (wd > t) continue; const rest = compose(t - wd); if (rest) { out = [wd, ...rest]; break; } }
  packMemo.set(t, out);
  return out;
}
export function packStock(run) {
  for (let t = Math.floor(run / 3) * 3; t >= 15; t -= 3) { const r = compose(t); if (r) return r; }
  return [];
}

export function esRun(w, o) {
  const { u0 = 0, depth = 24, top = 94, z0 = 0, doors = true, bays = [], prefix = "E", seed = 4,
          doorsOpen = false, drawersOut = false, mat = "oak" } = o;
  const parts = [], modules = [], drawers = [], r = rng(seed), cD = depth - FRONT;
  const f = frame(w), P = (u, v) => [f.ax + f.dx * u + f.nx * v, f.ay + f.dy * u + f.ny * v];
  const oak = x => ({ ...x, mat });
  const rodV = Math.min(12, cD / 2), slide = slideFor(cD - 1);
  let u = u0, n = 0;
  for (const bay of bays) {
    const a = u, b = u + bay.w, ia = a + ES, ib = b - ES; u = b; n++;
    parts.push(box(w, "carcass", a, a + ES, 0, cD, z0, top, oak({})));
    parts.push(box(w, "carcass", b - ES, b, 0, cD, z0, top, oak({})));
    parts.push(box(w, "carcass", ia, ib, 0, cD, z0, z0 + ES, oak({})));
    parts.push(box(w, "carcass", ia, ib, 0, cD, top - ES, top, oak({ mark: n === 1, label: `East Star ${frac(top, 8)} cabinet` })));
    parts.push(box(w, "carcass", ia, ib, 0, 0.25, z0 + ES, top - ES, oak({})));   // 1/4" back

    let z = z0;
    for (const [i, h] of (bay.fronts || []).entries()) {
      const lab = `${prefix}${n}-${bay.fronts.length - i}`, um = (a + b) / 2, pw = Math.min(3, bay.w / 2 - 2);
      const boxH = Math.max(2.5, Math.floor((h - 1.25) * 2) / 2), boxW = bay.w - 2 * ES - 1;
      const out = drawersOut ? slide : 0;
      parts.push(box(w, "front", ia + 1 / 16, ib - 1 / 16, cD + out, depth + out, z + 1 / 16, z + h - 1 / 16,
        oak({ idx: i + 1, label: lab, h, mark: true })));
      parts.push(box(w, "pull", um - pw, um + pw, depth + out, depth + out + 1.1, z + h / 2 - 0.25, z + h / 2 + 0.25));
      if (out) {   // the tray that comes with it: bottom and two sides
        const zb = z + 0.75;
        parts.push(box(w, "carcass", ia + 0.5, ib - 0.5, cD - slide + out, cD + out, zb, zb + 0.5, oak({})));
        parts.push(box(w, "carcass", ia + 0.5, ia + 1, cD - slide + out, cD + out, zb, zb + boxH, oak({})));
        parts.push(box(w, "carcass", ib - 1, ib - 0.5, cD - slide + out, cD + out, zb, zb + boxH, oak({})));
      }
      drawers.push({ idx: i + 1, label: lab, z0: z, frontH: h - 1 / 8, frontW: bay.w - 1 / 8,
        boxH, boxW, boxL: slide, inH: boxH - 0.5, inW: boxW - 1, inL: slide - 1, slide });
      z += h;
    }
    const base = Math.max(z, z0);

    for (const zt of bay.levels || []) if (zt > base + 2 && zt < top - 2)
      parts.push(box(w, "shelf", ia, ib, 0, cD - 0.5, zt - ES, zt, oak({ mark: n === 1, label: "Shelf" })));
    for (const zr of bay.rods || []) {
      parts.push(box(w, "rod", ia + 0.25, ib - 0.25, rodV - 0.625, rodV + 0.625, zr - 0.625, zr + 0.625,
        { axis: "u", mark: n === 1, label: "Rod" }));
      garmentsOnRod(parts, w, r, ia, ib, rodV, zr, bay.garment || (zr < 60 ? "pants" : "shirt"), n * 3);
    }

    const leaves = doors ? (bay.w > 24 ? 2 : 1) : 0, lw = leaves ? (bay.w - 1 / 8) / leaves : 0;
    for (let k = 0; k < leaves; k++) {
      const da = a + 1 / 16 + k * lw, pz = Math.min(top - 8, base + 42);
      if (doorsOpen) {   // swung 90 degrees: a pair opens from the middle out
        const hinge = leaves === 2 ? (k === 0 ? da : da + lw) : da;
        parts.push(diagPanel(w, "cabdoor", P(hinge, depth), P(hinge, depth + lw), FRONT, base + 1 / 16, top - 1 / 16,
          oak({ mark: n === 1, label: "Door, open" })));
        continue;
      }
      parts.push(box(w, "cabdoor", da, da + lw, cD, depth, base + 1 / 16, top - 1 / 16,
        oak({ mark: n === 1, label: "Door" })));
      const pu = leaves === 2 ? (k === 0 ? da + lw - 1.5 : da + 1.5) : da + lw - 1.5;
      parts.push(box(w, "pull", pu - 0.4, pu + 0.4, depth, depth + 1.1, pz - 2.5, pz + 2.5));
    }

    modules.push(module(w, "cabinets", a, b, 0, depth, { label: bay.label || `East Star ${frac(bay.w, 8)}`,
      sub: `${frac(bay.w, 8)} × ${frac(top - z0, 8)}${leaves ? `, ${leaves} door${leaves > 1 ? "s" : ""}` : ""}`,
      ...(leaves ? { ghost: { u0: a, u1: b, v0: depth, v1: depth + bay.w / leaves, label: "door swing" } } : {}) }));
  }
  return { parts, modules, drawers, end: u, slide };
}

/* ---------- open shelf stack between two gables (floor stays open below `bottom`) ---------- */
export function shelfStack(w, o) {
  const { u0, u1, depth = 14, bottom = 30, top = 88.75, count = 4, label = "Open shelves" } = o;
  const parts = [];
  parts.push(box(w, "carcass", u0, u0 + PLY, 0, depth, 0, top));
  parts.push(box(w, "carcass", u1 - PLY, u1, 0, depth, 0, top));
  parts.push(box(w, "carcass", u0 + PLY, u1 - PLY, 0, depth, top - PLY, top, { mark: true, label: "Stack top" }));
  const step = (top - PLY - bottom) / count;
  const ledUnder = [top - PLY], shelfZs = [];
  for (let i = 0; i < count; i++) {
    const zs = bottom + i * step;
    shelfZs.push(zs);
    parts.push(box(w, "shelf", u0 + PLY, u1 - PLY, 0, depth - 0.5, zs, zs + PLY, { mark: true, label: "Shelf" }));
    if (i > 0) ledUnder.push(zs);
  }
  for (const zl of ledUnder)
    parts.push(box(w, "led", u0 + PLY + 0.5, u1 - PLY - 0.5, depth - 2.2, depth - 1.4, zl - 0.35, zl));
  return { parts, shelfZs, module: module(w, "shelves", u0, u1, 0, depth,
    { label, sub: `shelves from ${frac(bottom, 8)} up`, bottom, count }) };
}

/* ---------- fixed plywood shelves wall-to-wall: no gables, cleats on back + both sides,
   solid-wood nosing on the front edge. `levels` are shelf-top heights AFF. ---------- */
export function fixedShelves(w, o) {
  const { u0, u1, depth, levels, nosing = 1.5, nosingT = PLY, cleat = 1.5, led = true, label = "Fixed shelves" } = o;
  const parts = [], zs = [...levels].sort((a, b) => a - b);
  for (const top of zs) {
    const z0 = top - PLY;
    parts.push(box(w, "shelf", u0, u1, 0, depth - (nosing > 0 ? nosingT : 0), z0, top, { mark: true, label: "Shelf" }));
    if (nosing > 0) parts.push(box(w, "nosing", u0, u1, depth - nosingT, depth, top - nosing, top));
    parts.push(box(w, "cleat", u0, u1, 0, PLY, z0 - cleat, z0));
    parts.push(box(w, "cleat", u0, u0 + PLY, PLY, depth - 2.5, z0 - cleat, z0));
    parts.push(box(w, "cleat", u1 - PLY, u1, PLY, depth - 2.5, z0 - cleat, z0));
    if (led) parts.push(box(w, "led", u0 + 1, u1 - 1, depth - nosingT - 1.2, depth - nosingT - 0.4, z0 - 0.35, z0));
  }
  return { parts, shelfZs: zs, module: module(w, "shelves", u0, u1, 0, depth,
    { label, sub: `${zs.length} ${zs.length === 1 ? "shelf" : "shelves"} · ${frac(depth, 8)} deep`, levels: zs }) };
}

/* ---------- high storage band: plain shelves on cleats ---------- */
export function band(w, o) {
  const { u0, u1, depth = 12, levels = [88, 104], minZ = 0, led = true, labels = [] } = o;
  const parts = [], kept = [];
  levels.forEach((z, i) => {
    if (z < minZ - 0.01) return;
    parts.push(box(w, "shelf", u0, u1, 0, depth, z, z + PLY, { band: true, mark: true, label: labels[i] || "Upper shelf" }));
    if (led && !kept.length) parts.push(box(w, "led", u0 + 1, u1 - 1, depth - 1.4, depth - 0.6, z - 0.35, z));
    kept.push(z);
  });
  return { parts, module: module(w, "band", u0, u1, 0, depth, { label: "Upper band", levels: kept }) };
}

/* ---------- surface-mounted fold-down ironing ("press") board cabinet ---------- */
export function pressBoard(w, o) {
  const { u0, width = 15, depth = 5, z0 = 18, h = 52, boardLen = 42, boardW = 13, boardZ = 34, down = false } = o;
  const u1 = u0 + width, bu0 = u0 + (width - boardW) / 2, bu1 = bu0 + boardW, parts = [];
  parts.push(box(w, "cabinet", u0, u1, 0, depth, z0, z0 + h, { mark: true, label: "Press board cabinet" }));
  if (down) parts.push(box(w, "board", bu0, bu1, depth, depth + boardLen, boardZ - 1, boardZ, { mark: true, label: "Board, down" }));
  return { parts, module: module(w, "press", u0, u1, 0, depth, { label: "Press board", sub: "folds down",
    ghost: { u0: bu0, u1: bu1, v0: depth, v1: depth + boardLen, label: "board down" } }) };
}

/* ---------- wall-hung fold-down desk: shallow cabinet, top folds down into a work surface ---------- */
export function foldDesk(w, o) {
  const { u0, u1, z = 29.5, cabDepth = 5, cabH = 24, depth = 20, down = true } = o;
  const parts = [box(w, "cabinet", u0, u1, 0, cabDepth, z, z + cabH, { mark: true, label: "Desk cabinet" })];
  if (down) parts.push(box(w, "desktop", u0 + 0.5, u1 - 0.5, cabDepth, depth, z - 1, z, { mark: true, label: "Desk top, down" }));
  parts.push(box(w, "led", u0 + 1, u1 - 1, cabDepth - 1.2, cabDepth - 0.4, z - 0.35, z));
  return { parts, module: module(w, "desk", u0, u1, 0, cabDepth, { label: "Fold-down desk", sub: `${frac(u1 - u0, 8)} wide at ${frac(z, 8)}`,
    ghost: { u0: u0 + 0.5, u1: u1 - 0.5, v0: cabDepth, v1: depth, label: "desk down" } }) };
}

/* ---------- free-standing item on the floor (hamper, stool...) ---------- */
export function floorItem(w, kind, o) {
  const { u0, u1, v0 = 0, v1, h, label } = o;
  return { parts: [box(w, kind, u0, u1, v0, v1, 0, h, { label })],
           module: module(w, kind, u0, u1, v0, v1, { label, h }) };
}

/* ---------- checks ---------- */
const FLOOR_KINDS = new Set(["carcass", "kick", "front", "hamper"]);
export function hatchClashes(parts, hatches) {
  return hatches.filter(h => parts.some(p => p.z0 < 1 && FLOOR_KINDS.has(p.kind) &&
    p.x0 < h.x1 - 0.1 && p.x1 > h.x0 + 0.1 && p.y0 < h.y1 - 0.1 && p.y1 > h.y0 + 0.1));
}

// Collects builder results into flat parts/modules lists.
export function collector() {
  const parts = [], modules = [];
  const add = r => { parts.push(...r.parts); if (r.modules) modules.push(...r.modules); if (r.module) modules.push(r.module); return r; };
  return { parts, modules, add };
}
