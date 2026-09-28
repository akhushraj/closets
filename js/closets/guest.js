// Guest reach-in, all plywood like Rohan's: one rod wall to wall, one shelf just below where the
// clothes end (IKEA dresser fits under it), plywood shelves above the rod. Double doors swing out.
import { box, fixedShelves, floorItem, collector } from "../model/builders.js";
import { PLY, frac, ftin } from "../lib/units.js";
import { shelfSlots, shelfControls, readShelves, spacingWarnings, LOOK, PLYWOOD_NOTE } from "./common.js";

export const INFO = { id: "guest", name: "Guest Closet", room: "Guest room", stuff: "folded", concept: "Rod + shelves, all plywood", rev: "" };

export const FIELD = { W: 54.1, D: 22.3, ceiling: 120, stubL: 2.1, opening: 50.1, stubR: 1.8, doorH: 96 };

export const DEFAULTS = {
  rodZ: 71, lowOn: false, lowZ: 35, lowDepth: 21, upDepth: 21, dresser: true, centre: "bracket",
  dresserW: 31.5, dresserD: 19, dresserH: 32,
  topOn: true, topZ: 88, topDepth: 12,
  ...shelfSlots("u", [73], [60, 84, 94]),
  finish: "white",
};

export const CONTROLS = [
  ["Hanging", [
    { key: "rodZ", label: "Rod height", min: 60, max: 80, step: 0.5 },
    { key: "lowOn", label: "Shelf below the clothes (you cannot reach past them)", type: "check" },
    { key: "lowZ", label: "Its height (top)", min: 24, max: 44, step: 0.5 },
    { key: "lowDepth", label: "Its depth", min: 10, max: 22, step: 0.5 },
    { key: "centre", label: "Centre support", type: "select",
      options: [["bracket", "Bracket under the rod only"], ["divider", "Full divider (splits the rod)"], ["none", "Nothing"]] },
  ]],
  ["Dresser on the floor", [
    { key: "dresser", label: "Show a dresser", type: "check" },
    { key: "dresserW", label: "Width", min: 24, max: 48, step: 0.5 },
    { key: "dresserD", label: "Depth", min: 14, max: 22, step: 0.5 },
    { key: "dresserH", label: "Height", min: 26, max: 40, step: 0.5 },
  ]],
  shelfControls("u", 4, "Shelves above the rod", [
    { key: "upDepth", label: "Their depth", min: 10, max: 22, step: 0.5 },
  ]),
  ["Shallow top shelf", [
    { key: "topOn", label: "Shelf just under the header", type: "check" },
    { key: "topZ", label: "Its height (top)", min: 80, max: 95, step: 1, gapFrom: "u", onKey: "topOn" },
    { key: "topDepth", label: "Its depth", min: 8, max: 22, step: 0.5 },
  ]],
  LOOK,
];

// IKEA MALM 3-drawer is 31-1/2 x 18-7/8 x 30-3/4 - the default, but any chest that fits the
// three limits below works: through the opening, shallower than the closet, under the clothes.

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

  const cx = W / 2, dv = p.centre === "divider";
  const DR = { w: p.dresserW, d: p.dresserD, h: p.dresserH };
  for (const [a, b] of dv ? [[0.25, cx - PLY / 2], [cx + PLY / 2, W - 0.25]] : [[0.25, W - 0.25]])
    parts.push(box(w.T, "rod", a, b, rodV - 0.625, rodV + 0.625, p.rodZ - 0.625, p.rodZ + 0.625, { axis: "u", mark: true, label: "Rod" }));
  let g = 1.5, k = 0;
  while (g < W - 3) {
    const t2 = k % 3 === 1 ? 2.1 : 1.1, len = k % 3 === 1 ? 33 : 30;
    parts.push(box(w.T, "garment", g, g + t2, rodV - 9.5, rodV + 9.5, p.rodZ - len, p.rodZ - 1.2, { tone: (k * 3) % 7 }));
    g += t2 + 0.9; k++;
  }
  modules.push(box(w.T, "hang", 0, W, 0, D, 0, 0, { label: "Hanging", sub: `rod ${frac(W - 0.5, 8)} at ${frac(p.rodZ, 8)}`, rods: [{ v: rodV }] }));

  const up = readShelves(p, "u", 4);
  // A shelf cleated along its back edge hardly bows - it cantilevers over its depth, not the
  // room. The rod is what sags. So the default is a short plate hung off the shelf above,
  // notched for the rod, instead of a full divider that would cut the rod in two.
  if (p.centre === "bracket") {
    const holdTo = up.length ? up[0] - PLY : (p.topOn ? p.topZ - PLY : p.rodZ + 12);
    parts.push(box(w.T, "carcass", cx - PLY / 2, cx + PLY / 2, 0, rodV + 1.5, p.rodZ - 2.5, holdTo,
      { mark: true, label: "Rod centre support, notched for the rod" }));
  }
  if (dv) {   // steps back to the top shelf's depth so its front edge lines up
    const base = p.lowOn ? p.lowZ : 0, stepAt = up.length ? up[up.length - 1] : (p.topOn ? p.topZ : 88);
    parts.push(box(w.T, "carcass", cx - PLY / 2, cx + PLY / 2, 0, p.upDepth, base, stepAt));
    if (p.topOn && p.topZ > stepAt) parts.push(box(w.T, "carcass", cx - PLY / 2, cx + PLY / 2, 0, p.topDepth, stepAt, p.topZ));
    // the pair of wall cleats the divider slots between
    const dTop = p.topOn ? p.topZ : stepAt;
    parts.push(box(w.T, "cleat", cx - PLY / 2 - 1.5, cx - PLY / 2, 0, PLY, base, dTop));
    parts.push(box(w.T, "cleat", cx + PLY / 2, cx + PLY / 2 + 1.5, 0, PLY, base, dTop));
  }
  add(fixedShelves(w.T, { u0: 0, u1: W, depth: p.upDepth, levels: up, label: "Upper shelves", led: false }));
  if (p.lowOn) parts.push(...fixedShelves(w.T, { u0: 0, u1: W, depth: p.lowDepth, levels: [p.lowZ], label: "Low shelf", led: false }).parts);
  const clearL = W - p.stubL - p.opening, clearR = W - p.stubL;   // the opening, in wall T's u
  if (p.dresser) {
    const a = Math.max(1, clearL + 0.5), b = a + DR.w, v1 = 0.5 + DR.d, fh = (DR.h - 2.5) / 3;
    parts.push(box(w.T, "dresser", a, b, 0.5, v1 - 0.6, 0, DR.h - 0.75, { label: "Dresser" }));
    parts.push(box(w.T, "dresser", a, b, 0.5, v1, DR.h - 0.75, DR.h, { mark: true, label: "Dresser top" }));
    for (let i = 0; i < 3; i++) {
      const z0 = 1 + i * (fh + 0.4);
      parts.push(box(w.T, "dresserfront", a + 0.4, b - 0.4, v1 - 0.6, v1, z0, z0 + fh));
    }
    modules.push(box(w.T, "dresser", a, b, 0.5, v1, 0, 0, { label: "Dresser", sub: `${frac(DR.w, 8)} × ${frac(DR.d, 8)} × ${frac(DR.h, 8)}` }));
    if (b > clearR - 0.5) warnings.push(`A ${frac(DR.w, 8)} chest runs past the door opening - its drawers would catch the right-hand frame.`);
    if (DR.w > p.opening - 2) warnings.push(`A ${frac(DR.w, 8)} chest will not go through the ${frac(p.opening, 8)} opening assembled. Keep it under ${frac(p.opening - 2, 8)}, or buy flat-pack.`);
    if (DR.d > D - 2) warnings.push(`A ${frac(DR.d, 8)} chest leaves only ${frac(D - DR.d, 8)} to the doors. Keep it under ${frac(D - 2, 8)}.`);
  }

  if (p.topOn) add(fixedShelves(w.T, { u0: 0, u1: W, depth: p.topDepth, levels: [p.topZ], label: "Top shelf", led: false }));

  const clothesBottom = p.rodZ - 1.2 - 34;
  if (p.lowOn && p.lowZ > clothesBottom) warnings.push(`Jackets hang down to about ${frac(clothesBottom, 8)}, so the low shelf at ${frac(p.lowZ, 8)} is in their way.`);
  if (p.lowOn && p.dresser && p.lowZ - PLY - 1.5 < DR.h + 0.5) warnings.push(`The dresser (${DR.h}") doesn't fit under the low shelf's cleats (${frac(p.lowZ - PLY - 1.5, 8)}).`);
  if (!p.lowOn && p.dresser) warnings.push(`Nothing over the dresser now, so anything up to about ${frac(clothesBottom - 1, 8)} tall fits there - the clothes are the only limit.`);
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
      { k: "Under the clothes", v: p.lowOn ? `shelf at ${frac(p.lowZ, 8)}` : "open", s: p.lowOn ? `${frac(p.lowZ - PLY - 1.5, 8)} clear under its cleats` : `clothes reach ${frac(clothesBottom, 8)}, so that is the headroom` },
      { k: "Upper shelves", v: `${up.length}`, s: up.length ? `tops at ${up.join(", ")}"` : "none on" },
      { k: "Beside the dresser", v: frac(W - 1 - DR.w - 1, 8), s: "floor space for suitcases and bags" },
    ],
    titleMeta: [
      { k: "Closet", v: `${ftin(W)} × ${ftin(D)}` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "Rod", v: frac(p.rodZ, 8) },
      { k: "Shelves", v: `${up.length + (p.lowOn ? 1 : 0)}` },
    ],
    gcText: [
      `GUEST CLOSET - 3/4" birch ply, painted.`,
      `Rod at ${frac(p.rodZ, 8)}${dv ? `, in two sections either side of a 3/4" ply divider (${frac(p.upDepth, 8)} deep, ${frac(p.lowZ, 8)} up to ${frac(p.topZ, 8)})` : `, one piece wall to wall${p.centre === "bracket" ? `. Centre support: a 3/4" ply plate ${frac(rodV + 1.5, 8)} deep, screwed up into the ${frac(up[0] || p.topZ, 8)} shelf, notched from below to take the rod.` : ""}`}`,
      ...(p.lowOn ? [`Shelf at ${frac(p.lowZ, 8)} under it, ${frac(p.lowDepth, 8)} deep - a ${frac(DR.h, 8)} chest fits below.`] : [`No shelf under the clothes - the floor is left open for a chest up to ${frac(clothesBottom - 1, 8)} tall.`]),
      `Above the rod: ${up.map(z => frac(z, 8)).join(", ")} at ${frac(p.upDepth, 8)} deep${p.topOn ? `, then ${frac(p.topZ, 8)} at ${frac(p.topDepth, 8)} deep` : ""}.`,
      `1x2 cleats into studs on all 3 walls; shelves sit loose. 1/4" x 3/4" poplar front edge.`,
      `Paint room colour, all sides. No lights.`,
    ].join("\n"),
    warnings,
    notes: [
      dv ? `Rod at ${frac(p.rodZ, 8)}, in two ${frac((W - 0.5 - PLY) / 2, 8)} sections either side of a centre divider.`
         : `Rod at ${frac(p.rodZ, 8)}, one piece ${frac(W - 0.5, 8)} wall to wall${p.centre === "bracket" ? ", supported at the middle" : " with nothing holding the middle"}.`,
      ...(p.centre === "bracket" ? [`The centre support is a short 3/4" plywood plate hung off the ${frac(up[0] || p.topZ, 8)} shelf and notched for the rod - not a divider running to the floor. The shelves do not need it: cleated along their back edge they cantilever over their ${frac(p.upDepth, 8)} depth, not across the room, and droop about 1/16" at the front whatever the closet is wide. The rod is the part that needs it - unsupported over ${frac(W - 0.5, 8)} a loaded rod sags about 3/4", and halving the span cuts that to about 1/20".`] : []),
      ...(p.centre === "none" ? [`Nothing holds the middle of the rod. Over ${frac(W - 0.5, 8)} a loaded rod sags about 3/4" - add the bracket.`] : []),
      ...(dv ? [`Centre divider: 3/4" plywood, ${frac(p.upDepth, 8)} deep up to the ${frac(up[up.length - 1] || 0, 8)} shelf, then ${frac(p.topDepth, 8)} deep to the top shelf, so its front edge follows the shelves. Fix it with a vertical 1x2 cleat screwed into the back-wall studs, plus screws up through the shelf below.`] : []),
      `${up.length + (p.lowOn ? 1 : 0)} shelves, 3/4" birch veneer-core plywood (paint grade), resting loose on 1×2 cleats screwed into the studs on three walls.`,
      "Front edge: 1/4\" × 3/4\" poplar strip, glued and pinned flush.",
      "Paint: same as the room, primer + 2 coats, all sides. Paint the shelves flat, then set them in.",
      `Floor: a chest (${frac(DR.w, 8)} x ${frac(DR.d, 8)} x ${frac(DR.h, 8)}) with ${frac(W - 2 - DR.w, 8)} beside it for suitcases. ${p.lowOn ? "" : `With no shelf over it, anything up to about ${frac(clothesBottom - 1, 8)} tall fits - a taller chest, or stacked baskets.`}`,
      "No lights, no outlet.",
    ],
  };
}
