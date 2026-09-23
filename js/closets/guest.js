// Guest reach-in, all plywood like Rohan's: one rod wall to wall, one shelf just below where the
// clothes end (IKEA dresser fits under it), plywood shelves above the rod. Double doors swing out.
import { box, fixedShelves, floorItem, collector } from "../model/builders.js";
import { PLY, frac, ftin } from "../lib/units.js";
import { shelfSlots, shelfControls, readShelves, spacingWarnings, LOOK, PLYWOOD_NOTE } from "./common.js";

export const INFO = { id: "guest", name: "Guest Closet", room: "Guest room", concept: "Rod + shelves, all plywood", rev: "" };

export const FIELD = { W: 54.1, D: 22.3, ceiling: 120, stubL: 2.1, opening: 50.1, stubR: 1.8, doorH: 96 };

export const DEFAULTS = {
  rodZ: 71, lowOn: true, lowZ: 35, lowDepth: 19, upDepth: 16, dresser: true,
  topOn: true, topZ: 88, topDepth: 12,
  ...shelfSlots("u", [72], [60, 84, 94]),
  finish: "white",
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
  ["Shallow top shelf", [
    { key: "topOn", label: "Shelf just under the header", type: "check" },
    { key: "topZ", label: "Its height (top)", min: 80, max: 95, step: 1 },
    { key: "topDepth", label: "Its depth", min: 8, max: 16, step: 0.5 },
  ]],
  LOOK,
];

const MALM = { w: 31.5, d: 18.875, h: 30.75 };   // IKEA MALM 3-drawer chest

export function build(p) {
  p = { ...p, ...FIELD, lights: false };   // no outlet in this closet
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
  add(fixedShelves(w.T, { u0: 0, u1: W, depth: p.upDepth, levels: up, label: "Upper shelves", led: false }));
  if (p.lowOn) parts.push(...fixedShelves(w.T, { u0: 0, u1: W, depth: p.lowDepth, levels: [p.lowZ], label: "Low shelf", led: false }).parts);
  if (p.dresser) {   // MALM 3-drawer: body, top, and three flush fronts
    const a = 1, b = a + MALM.w, v1 = 0.5 + MALM.d, fh = (MALM.h - 2.5) / 3;
    parts.push(box(w.T, "dresser", a, b, 0.5, v1 - 0.6, 0, MALM.h - 0.75, { label: "IKEA dresser" }));
    parts.push(box(w.T, "dresser", a, b, 0.5, v1, MALM.h - 0.75, MALM.h, { mark: true, label: "Dresser top" }));
    for (let i = 0; i < 3; i++) {
      const z0 = 1 + i * (fh + 0.4);
      parts.push(box(w.T, "dresserfront", a + 0.4, b - 0.4, v1 - 0.6, v1, z0, z0 + fh));
    }
    modules.push(box(w.T, "dresser", a, b, 0.5, v1, 0, 0, { label: "IKEA dresser", sub: `MALM 3-drawer · ${MALM.w} × ${MALM.d}` }));
  }

  if (p.topOn) add(fixedShelves(w.T, { u0: 0, u1: W, depth: p.topDepth, levels: [p.topZ], label: "Top shelf", led: false }));

  const clothesBottom = p.rodZ - 1.2 - 34;
  if (p.lowOn && p.lowZ > clothesBottom) warnings.push(`Jackets hang down to about ${frac(clothesBottom, 8)}, so the low shelf at ${frac(p.lowZ, 8)} is in their way.`);
  if (p.lowOn && p.dresser && p.lowZ - PLY - 1.5 < MALM.h + 0.5) warnings.push(`The dresser (${MALM.h}") doesn't fit under the low shelf's cleats (${frac(p.lowZ - PLY - 1.5, 8)}).`);
  if (up.length && up[0] < p.rodZ + 2) warnings.push("The first shelf above the rod is below the rod.");
  const blocked = up.filter(z => z > p.doorH - 1.5);
  if (blocked.length) warnings.push(`Shelves at ${blocked.join(", ")}" sit above the door header (about ${p.doorH}"), so you can't reach them through the opening.`);
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
    gcText: [
      `Guest closet: rod at ${frac(p.rodZ, 8)} wall to wall, with a shelf at ${frac(p.lowZ, 8)} under it (IKEA dresser fits below).`,
      `Shelves above the rod at ${up.map(z => frac(z, 8)).join(", ")}. All 3/4" birch plywood, ${frac(p.upDepth, 8)} deep.`,
      ...(p.topOn ? [`Plus one ${frac(p.topDepth, 8)}-deep shelf at ${frac(p.topZ, 8)}.`] : []),
      `1x2 cleats screwed into studs on all 3 walls; shelves sit loose on them.`,
      `1/4" x 3/4" poplar strip on each front edge.`,
      `Paint same as room, all sides. No lights.`,
    ].join("\n"),
    warnings,
    notes: [
      `Rod at ${frac(p.rodZ, 8)}, wall to wall. A 54" rod needs a middle support hung from the shelf above.`,
      `${up.length + (p.lowOn ? 1 : 0)} shelves, 3/4" birch veneer-core plywood (paint grade), resting loose on 1×2 cleats screwed into the studs on three walls.`,
      "Front edge: 1/4\" × 3/4\" poplar strip, glued and pinned flush.",
      "Paint: same as the room, primer + 2 coats, all sides. Paint the shelves flat, then set them in.",
      `Floor: an IKEA MALM 3-drawer (${MALM.w}" × ${MALM.d}" × ${MALM.h}") fits under the low shelf, with ${frac(W - 2 - MALM.w, 8)} beside it for suitcases.`,
      "No lights, no outlet.",
    ],
  };
}
