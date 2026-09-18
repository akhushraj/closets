// Reusable closet builders. Every builder works in WALL-LOCAL coordinates:
//   u = distance along the wall from its start point `a` (left edge of its elevation)
//   v = distance out from the wall face into the closet
//   z = height above the finished floor
// and emits parts that also carry plan (x, y) boxes, so the plan, elevation and 3D
// views can all draw from the same list.
import { PLY, FRONT, slideFor } from "../lib/units.js";

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

// Tiny deterministic PRNG so garments look the same on every render.
function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }

/* ---------- single-level hanging run with a hat shelf above the rod ---------- */
export function hangRun(w, o) {
  const { u0, u1, depth = 24, rodZ = 70, shelfDepth = 14, coatsTo = u0, garments = true } = o;
  const parts = [];
  const rodV = Math.min(12, depth / 2), shelfZ = rodZ + 2;
  parts.push(box(w, "rod", u0 + 0.25, u1 - 0.25, rodV - 0.625, rodV + 0.625, rodZ - 0.625, rodZ + 0.625,
    { axis: "u", mark: true, label: "Rod" }));
  parts.push(box(w, "shelf", u0, u1, 0, shelfDepth, shelfZ, shelfZ + PLY, { mark: true, label: "Hat shelf" }));
  parts.push(box(w, "led", u0 + 1, u1 - 1, shelfDepth - 1.4, shelfDepth - 0.6, shelfZ - 0.35, shelfZ));
  if (garments) {
    const r = rng(7);
    let u = u0 + 1.5, i = 0;
    while (u < u1 - 1.5) {
      const coat = u < coatsTo;
      const type = coat ? "coat" : (r() < 0.55 ? "shirt" : "jacket");
      const t = { coat: 2.6, shirt: 1.1, jacket: 2.1 }[type];
      const len = { coat: 42, shirt: 30, jacket: 33 }[type] + (r() - 0.5) * 3;
      if (u + t > u1 - 1.5) break;
      parts.push(box(w, "garment", u, u + t, rodV - 9.5, rodV + 9.5, rodZ - len, rodZ - 1.2,
        { type, tone: i % 7 }));
      u += t + 0.35; i++;
    }
  }
  const mod = module(w, "hang", u0, u1, 0, depth,
    { label: "Hanging", rodLen: u1 - u0 - 0.5, rodZ, shelfZ, rodV });
  return { parts, module: mod };
}

/* ---------- drawer tower: toe kick, drawer stack, counter, open shelves ---------- */
export function drawerTower(w, o) {
  const { u0, u1, depth = 20, top = 88.75, kick = 4, fronts = [9, 8, 8, 7, 6], shelves = 2 } = o;
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
    const label = "D" + (fronts.length - i);
    parts.push(box(w, "front", u0 + 1 / 16, u1 - 1 / 16, cD, depth, z + 1 / 16, z + h - 1 / 16,
      { idx: i + 1, label, h, mark: true }));
    const zc = z + h / 2, um = (u0 + u1) / 2;
    parts.push(box(w, "pull", um - 3, um + 3, depth, depth + 1.1, zc - 0.25, zc + 0.25));
    const boxH = Math.max(2.5, Math.floor((h - 1.25) * 2) / 2);
    const boxW = W - 2 * PLY - 1;
    drawers.push({ idx: i + 1, label, z0: z, frontH: h - 1 / 8, frontW: W - 1 / 8,
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

  const mod = module(w, "tower", u0, u1, 0, depth,
    { label: "Drawer tower", drawerCount: fronts.length, slide, counterZ, top });
  return { parts, module: mod, drawers, counterZ };
}

/* ---------- open shelf stack between two gables (optional floor item below) ---------- */
export function shelfStack(w, o) {
  const { u0, u1, depth = 14, bottom = 30, top = 88.75, count = 4 } = o;
  const parts = [];
  parts.push(box(w, "carcass", u0, u0 + PLY, 0, depth, 0, top));
  parts.push(box(w, "carcass", u1 - PLY, u1, 0, depth, 0, top));
  parts.push(box(w, "carcass", u0 + PLY, u1 - PLY, 0, depth, top - PLY, top, { mark: true, label: "Stack top" }));
  const step = (top - PLY - bottom) / count;
  const ledUnder = [top - PLY];
  for (let i = 0; i < count; i++) {
    const zs = bottom + i * step;
    parts.push(box(w, "shelf", u0 + PLY, u1 - PLY, 0, depth - 0.5, zs, zs + PLY, { mark: true, label: "Shelf" }));
    if (i > 0) ledUnder.push(zs);
  }
  for (const zl of ledUnder)
    parts.push(box(w, "led", u0 + PLY + 0.5, u1 - PLY - 0.5, depth - 2.2, depth - 1.4, zl - 0.35, zl));
  return { parts, module: module(w, "shelves", u0, u1, 0, depth, { label: "Open shelves", bottom, count }) };
}

/* ---------- high storage band: plain shelves on cleats above the door head ---------- */
export function band(w, o) {
  const { u0, u1, depth = 12, levels = [88, 104], minZ = 0, led = true } = o;
  const parts = [];
  const lv = levels.filter(z => z >= minZ - 0.01);
  lv.forEach((z, i) => {
    parts.push(box(w, "shelf", u0, u1, 0, depth, z, z + PLY, { band: true, mark: true, label: "Upper shelf" }));
    if (led && i === 0) parts.push(box(w, "led", u0 + 1, u1 - 1, depth - 1.4, depth - 0.6, z - 0.35, z));
  });
  return { parts, module: module(w, "band", u0, u1, 0, depth, { label: "Upper band", levels: lv }) };
}

/* ---------- free-standing item on the floor (hamper, stool...) ---------- */
export function floorItem(w, kind, o) {
  const { u0, u1, v0 = 0, v1, h, label } = o;
  return { parts: [box(w, kind, u0, u1, v0, v1, 0, h, { label })],
           module: module(w, kind, u0, u1, v0, v1, { label, h }) };
}
