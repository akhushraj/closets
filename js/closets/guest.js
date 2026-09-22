// Guest reach-in, all plywood like Rohan's: one rod wall to wall, one shelf just below where the
// clothes end (IKEA dresser fits under it), plywood shelves above the rod. Double doors swing out.
import { box, fixedShelves, floorItem, collector } from "../model/builders.js";
import { PLY, frac, ftin } from "../lib/units.js";
import { shelfSlots, shelfControls, readShelves, spacingWarnings, LOOK, PLYWOOD_NOTE } from "./common.js";

export const INFO = { id: "guest", name: "Guest Closet", room: "Guest room", concept: "Rod + shelves, all plywood", rev: "" };

export const FIELD = { W: 54.1, D: 22.3, ceiling: 120, stubL: 2.1, opening: 50.1, stubR: 1.8, doorH: 96 };

export const DEFAULTS = {
  rodZ: 70, lowOn: true, lowZ: 34.5, lowDepth: 16, upDepth: 16, dresser: true,
  ...shelfSlots("u", [72, 86, 100], [112]),
  finish: "white", lights: false,
};

export const CONTROLS = [
  ["Hanging", [
    { key: "rodZ", label: "Rod height", min: 60, max: 80, step: 0.5 },
    { key: "lowOn", label: "Shelf below the clothes", type: "check" },
    { key: "lowZ", label: "Its height (top)", min: 24, max: 44, step: 0.5 },
    { key: "lowDepth", label: "Its depth", min: 10, max: 22, step: 0.5 },
    { key: "dresser", label: "Show an IKEA dresser (MALM 3-drawer)", type: "check" },
  ]],
  shelfControls("u", 4, "Shelves above the rod", [
    { key: "upDepth", label: "Their depth", min: 10, max: 20, step: 0.5 },
  ]),
  LOOK,
];

const MALM = { w: 31.5, d: 18.875, h: 30.75 };   // IKEA MALM 3-drawer chest

export function build(p) {
  p = { ...p, ...FIELD };
  const W = p.W, D = p.D, t = 4.5;
  const outline = [[0, 0], [W, 0], [W, D], [0, D]];
  const walls = [
    { id: "T", name: "Back wall", a: [0, 0], b: [W, 0] },
    { id: "R", name: "Right end", a: [W, 0], b: [W, D] },
    { id: "F", name: "Door wall", a: [W, D], b: [0, D], hidden: true },
    { id: "L", name: "Left end", a: [0, D], b: [0, 0] },
  ];
  const w = Object.fromEntries(walls.map(x => [x.id, x]));
  const { parts, modules, add } = collector();
  const warnings = [];
  const rodV = Math.min(12, D / 2);

  parts.push(box(w.T, "rod", 0.25, W - 0.25, rodV - 0.625, rodV + 0.625, p.rodZ - 0.625, p.rodZ + 0.625, { axis: "u", mark: true, label: "Rod" }));
  let g = 1.5, k = 0;
  while (g < W - 3) {
    const t2 = k % 3 === 1 ? 2.1 : 1.1, len = k % 3 === 1 ? 33 : 30;
    parts.push(box(w.T, "garment", g, g + t2, rodV - 9.5, rodV + 9.5, p.rodZ - len, p.rodZ - 1.2, { tone: (k * 3) % 7 }));
    g += t2 + 0.9; k++;
  }
  modules.push(box(w.T, "hang", 0, W, 0, D, 0, 0, { label: "Hanging", sub: `rod ${frac(W - 0.5, 8)} at ${frac(p.rodZ, 8)}`, rods: [{ v: rodV }] }));

  const up = readShelves(p, "u", 4);
  add(fixedShelves(w.T, { u0: 0, u1: W, depth: p.upDepth, levels: up, label: "Upper shelves" }));
  if (p.lowOn) {
    const r = fixedShelves(w.T, { u0: 0, u1: W, depth: p.lowDepth, levels: [p.lowZ], label: "Low shelf" });
    parts.push(...r.parts);
  }
  if (p.dresser) add(floorItem(w.T, "dresser", { u0: 1, u1: 1 + MALM.w, v0: 0.5, v1: 0.5 + MALM.d, h: MALM.h, label: "IKEA dresser" }));

  const clothesBottom = p.rodZ - 1.2 - 34;
  if (p.lowOn && p.lowZ > clothesBottom) warnings.push(`Jackets hang down to about ${frac(clothesBottom, 8)}, so the low shelf at ${frac(p.lowZ, 8)} is in their way.`);
  if (p.lowOn && p.dresser && p.lowZ - PLY - 1.5 < MALM.h + 0.5) warnings.push(`The dresser (${MALM.h}") doesn't fit under the low shelf's cleats (${frac(p.lowZ - PLY - 1.5, 8)}).`);
  if (up.length && up[0] < p.rodZ + 2) warnings.push("The first shelf above the rod is below the rod.");
  warnings.push(...spacingWarnings(up, "Upper shelves"));

  const f0 = W - (p.stubL + p.opening), f1 = W - p.stubL, mid = (f0 + f1) / 2, slab = p.opening / 2 - 1;
  const doors = [
    { wall: "F", u0: f0, u1: mid, slab, h: p.doorH, roH: p.doorH + 2.5, swing: "out", hingeU: f0 + 0.5, label: "" },
    { wall: "F", u0: mid, u1: f1, slab, h: p.doorH, roH: p.doorH + 2.5, swing: "out", hingeU: f1 - 0.5, label: "" },
  ];
  return {
    info: INFO, params: p,
    closet: { outline, walls, ceiling: p.ceiling, wallT: t, nbr: [] },
    parts, modules, doors, hatches: [],
    elevations: ["T", "L", "R"],
    planDims: [
      { a: [0, 0], b: [W, 0], label: frac(W, 8), off: -(t + 2.3) },
      { a: [W, 0], b: [W, D], label: frac(D, 8), off: -(t + 2.3) },
      { a: [0, D], b: [p.stubL + p.opening, D], label: `${frac(p.opening, 8)} opening`, off: t + 2.3 + p.opening / 2 },
    ],
    drawerGroups: [],
    stats: [
      { k: "Rod", v: frac(W - 0.5, 8), s: `at ${frac(p.rodZ, 8)}, wall to wall` },
      { k: "Low shelf", v: p.lowOn ? frac(p.lowZ, 8) : "off", s: p.lowOn ? `${frac(p.lowZ - PLY - 1.5, 8)} clear under its cleats` : "" },
      { k: "Upper shelves", v: `${up.length}`, s: up.length ? `tops at ${up.join(", ")}"` : "none on" },
      { k: "Beside the dresser", v: frac(W - 1 - MALM.w - 1, 8), s: "floor space for suitcases and bags" },
    ],
    titleMeta: [
      { k: "Closet", v: `${ftin(W)} × ${ftin(D)}` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "Rod", v: frac(p.rodZ, 8) },
      { k: "Shelves", v: `${up.length + (p.lowOn ? 1 : 0)}` },
    ],
    warnings,
    notes: [
      "A 54\" rod needs a middle support: a bracket hung from the shelf above, or a 1-5/16\" rod with a center bracket.",
      `The dresser shown is an IKEA MALM 3-drawer (${MALM.w}" W × ${MALM.d}" D × ${MALM.h}" H). The rest of the floor is for suitcases and bags.`,
      PLYWOOD_NOTE,
    ],
  };
}
