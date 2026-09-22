// Pantry, oriented like the field sketch: door at the lower left (LHI, swings in).
// L-shaped 24"-deep quartz/porcelain counter on the back and right walls, outside the door swing;
// open plywood shelves under it (first shelf raised off the floor) and 12"-deep open shelves above.
import { box, fixedShelves, collector } from "../model/builders.js";
import { PLY, frac, ftin } from "../lib/units.js";
import { shelfSlots, shelfControls, readShelves, spacingWarnings, LOOK, PLYWOOD_NOTE } from "./common.js";

export const INFO = { id: "pantry", name: "Pantry", room: "Kitchen", concept: "L counter + open shelves", rev: "" };

export const FIELD = { W: 60.6, D: 53.8, ceiling: 120, doorAt: 2.5, doorRO: 27.9, doorSlab: 26, doorH: 80, outletZ: 42.4 };

export const DEFAULTS = {
  counterDepth: 24, counterZ: 36, top: "quartz", underOn: true, underZ: 16, upDepth: 12,
  ...shelfSlots("u", [54, 68, 82, 96, 110], [48]),
  finish: "white", lights: true,
};

export const CONTROLS = [
  ["Counter · L-shaped", [
    { key: "counterDepth", label: "Depth", min: 18, max: 26, step: 0.5 },
    { key: "counterZ", label: "Height (top)", min: 34, max: 38, step: 0.25 },
    { key: "top", label: "Top", type: "select", options: [["quartz", "Quartz (3 cm)"], ["porcelain", "Porcelain slab (12 mm on plywood)"]] },
    { key: "underOn", label: "Shelf under the counter", type: "check" },
    { key: "underZ", label: "Its height (top)", min: 8, max: 24, step: 0.5 },
  ]],
  shelfControls("u", 6, "Open shelves above the counter", [
    { key: "upDepth", label: "Their depth", min: 10, max: 16, step: 0.5 },
  ]),
  LOOK,
];

export function build(p) {
  p = { ...p, ...FIELD };
  const W = p.W, D = p.D, t = 4.5, cd = p.counterDepth, cz = p.counterZ;
  const outline = [[0, 0], [W, 0], [W, D], [0, D]];
  const walls = [
    { id: "T", name: "Back wall", a: [0, 0], b: [W, 0] },
    { id: "R", name: "Right wall", a: [W, 0], b: [W, D] },
    { id: "B", name: "Door wall", a: [W, D], b: [0, D], hidden: true },
    { id: "L", name: "Left wall", a: [0, D], b: [0, 0] },
  ];
  const w = Object.fromEntries(walls.map(x => [x.id, x]));
  const { parts, modules, add } = collector();
  const warnings = [];
  const topT = p.top === "quartz" ? 1.25 : 0.5, sub = cz - topT;

  // counter: plywood sub-top on wall cleats + a plywood upright under the inside corner
  const corner = W - cd;
  parts.push(box(w.T, "shelf", 0, W, 0, cd, sub - PLY, sub));
  parts.push(box(w.R, "shelf", cd, D, 0, cd, sub - PLY, sub));
  parts.push(box(w.T, "counter", 0, W, 0, cd + 1, sub, cz, { mark: true, label: p.top === "quartz" ? "Quartz top" : "Porcelain top" }));
  parts.push(box(w.R, "counter", cd + 1, D, 0, cd + 1, sub, cz));
  parts.push(box(w.T, "carcass", corner - PLY, corner, 0, cd, 0, sub - PLY));
  modules.push(box(w.T, "counter", 0, W, 0, cd, 0, 0, { label: "Counter", sub: `${frac(cd, 8)} deep at ${frac(cz, 8)}` }));
  modules.push(box(w.R, "counter", cd, D, 0, cd, 0, 0, { label: "Counter", sub: "right leg" }));

  if (p.underOn) {
    add(fixedShelves(w.T, { u0: 0, u1: corner - PLY, depth: cd - 1, levels: [p.underZ], label: "Under-counter shelf", led: false }));
    add(fixedShelves(w.R, { u0: 0, u1: D, depth: cd - 1, levels: [p.underZ], label: "Under-counter shelf", led: false }));
  }
  const up = readShelves(p, "u", 6);
  add(fixedShelves(w.T, { u0: 0, u1: W, depth: p.upDepth, levels: up, label: "Open shelves" }));
  add(fixedShelves(w.R, { u0: p.upDepth, u1: D, depth: p.upDepth, levels: up, label: "Open shelves" }));

  // door on the bottom wall, LHI: hinge on the left jamb, swings in along the left wall
  const u0 = W - (p.doorAt + p.doorRO), u1 = W - p.doorAt;
  const door = { wall: "B", u0, u1, slab: p.doorSlab, h: p.doorH, roH: p.doorH + 2.5, swing: "in", hingeU: u1 - 1, label: "LHI" };
  const swingTop = D - p.doorSlab - 1;
  if (cd > swingTop) warnings.push(`At ${frac(cd, 8)} deep, the back counter runs into the door swing (it reaches ${frac(swingTop, 8)} from the back wall).`);
  if (corner < p.doorAt + p.doorRO) warnings.push("The right leg of the counter reaches into the doorway.");
  if (up.length && up[0] < cz + 16) warnings.push(`Only ${frac(up[0] - cz - PLY, 8)} between the counter and the first shelf. Appliances want about 18".`);
  warnings.push(...spacingWarnings(up, "Open shelves"));

  return {
    info: INFO, params: p,
    closet: { outline, walls, ceiling: p.ceiling, wallT: t, nbr: [] },
    parts, modules, doors: [door], hatches: [],
    elevations: ["T", "R", "L"],
    planDims: [
      { a: [0, 0], b: [W, 0], label: frac(W, 8), off: -(t + 2.3) },
      { a: [W, 0], b: [W, D], label: frac(D, 8), off: -(t + 2.3) },
      { a: [0, D], b: [p.doorAt, D], label: frac(p.doorAt, 8), off: t + 2.3 },
      { a: [p.doorAt, D], b: [p.doorAt + p.doorRO, D], label: `${frac(p.doorRO, 8)} door`, off: t + 2.3 },
      { a: [p.doorAt + p.doorRO, D], b: [W, D], label: frac(W - p.doorAt - p.doorRO, 8), off: t + 2.3 },
      { a: [corner, 30], b: [W, 30], label: frac(cd, 8), off: 0 },
    ],
    drawerGroups: [],
    stats: [
      { k: "Counter", v: `${frac(W, 8)} + ${frac(D - cd, 8)}`, s: `L-shaped, ${frac(cd, 8)} deep, top at ${frac(cz, 8)}` },
      { k: "Under the counter", v: p.underOn ? `shelf at ${frac(p.underZ, 8)}` : "open", s: p.underOn ? `${frac(p.underZ - PLY - 1.5, 8)} clear below it` : "" },
      { k: "Open shelves", v: `${up.length} × ${frac(p.upDepth, 8)} deep`, s: up.length ? `tops at ${up.join(", ")}"` : "none on" },
      { k: "Door swing", v: "clear", s: `back leg stops ${frac(swingTop - cd, 8)} short of the swing` },
    ],
    titleMeta: [
      { k: "Pantry", v: `${ftin(W)} × ${ftin(D)}` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "Counter", v: `${frac(cd, 8)} deep` },
      { k: "Shelves", v: `${up.length}` },
    ],
    warnings,
    notes: [
      `The outlets at ${p.outletZ}" AFF land about ${frac(p.outletZ - cz, 8)} above the counter, which is good for appliances.`,
      "The counter sits on a 3/4\" plywood sub-top resting on wall cleats. A plywood upright under the inside corner carries the front edges.",
      "Quartz is usually cheapest as a remnant for a small L. A thin porcelain slab needs the full plywood sub-top under it.",
      PLYWOOD_NOTE,
    ],
  };
}
