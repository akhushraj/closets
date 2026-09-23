// Master bath linen closet: fixed birch-plywood shelves wall to wall on cleats, no lights
// (there's no outlet). Door is 1'-10" x 8'-0" and swings out; nothing above the header is reachable.
import { fixedShelves, collector } from "../model/builders.js";
import { PLY, frac, ftin } from "../lib/units.js";
import { shelfSlots, shelfControls, readShelves, spacingWarnings } from "./common.js";

export const INFO = { id: "masterbath", name: "Master Bath Closet", room: "Master bath", concept: "Birch plywood shelves", rev: "" };

export const FIELD = { W: 27.9, D: 23.7, ceiling: 120, opening: 24.3, doorSlab: 22, doorH: 96 };

export const DEFAULTS = {
  depth: 22, edge: "poplar", topOn: true, topZ: 88, topDepth: 18,
  ...shelfSlots("s", [24, 40, 56, 72], [10, 16, 88, 94]),
  finish: "white",
};

export const CONTROLS = [
  shelfControls("s", 8, "Shelves · top of each, AFF", [
    { key: "depth", label: "Shelf depth", min: 12, max: 23, step: 0.5 },
    { key: "edge", label: "Front edge", type: "select", options: [["poplar", "1/4\" × 3/4\" poplar strip"], ["none", "None: fill, sand, paint"]] },
  ]),
  ["Shallow top shelf", [
    { key: "topOn", label: "Shelf just under the header", type: "check" },
    { key: "topZ", label: "Its height (top)", min: 80, max: 95, step: 1 },
    { key: "topDepth", label: "Its depth", min: 8, max: 23, step: 0.5 },
  ]],
  ["Look", [{ key: "finish", label: "Finish", type: "select", options: [["white", "Painted white"], ["oak", "White oak"], ["walnut", "Walnut"]] }]],
];

export function build(p) {
  p = { ...p, ...FIELD, lights: false };
  const W = p.W, D = p.D, t = 4.5, stub = (W - p.opening) / 2;
  const outline = [[0, 0], [W, 0], [W, D], [0, D]];
  const walls = [
    { id: "T", name: "Back wall", a: [0, 0], b: [W, 0] },
    { id: "R", name: "Right side", a: [W, 0], b: [W, D] },
    { id: "F", name: "Door wall", a: [W, D], b: [0, D], hidden: true },
    { id: "L", name: "Left side", a: [0, D], b: [0, 0] },
  ];
  const w = Object.fromEntries(walls.map(x => [x.id, x]));
  const { parts, modules, add } = collector();
  const lv = readShelves(p, "s", 8);
  add(fixedShelves(w.T, { u0: 0, u1: W, depth: p.depth, levels: lv, label: "Shelves",
    nosing: p.edge === "poplar" ? PLY : 0, nosingT: 0.25, led: false }));

  if (p.topOn) add(fixedShelves(w.T, { u0: 0, u1: W, depth: p.topDepth, levels: [p.topZ], label: "Top shelf",
    nosing: p.edge === "poplar" ? PLY : 0, nosingT: 0.25, led: false }));

  const door = { wall: "F", u0: stub, u1: W - stub, slab: p.doorSlab, h: p.doorH, roH: p.doorH + 2.5, swing: "out", hingeU: W - stub - 0.5, label: "1'-10\" × 8'" };
  const warnings = spacingWarnings(lv, "Shelves");
  const blocked = lv.filter(z => z > p.doorH - 1.5);
  if (blocked.length) warnings.push(`Shelves at ${blocked.join(", ")}" sit above the door header (about ${p.doorH}"), so you can't reach them through the opening.`);
  if (p.depth > D - 1.5) warnings.push(`At ${frac(p.depth, 8)} deep the shelves reach the door jamb. The walls run ${frac(D, 8)}–24", so leave about 1-1/2".`);

  const sheets = Math.ceil(lv.length * (W * p.depth) / (48 * 96) * 1.25);
  return {
    info: INFO, params: p,
    closet: { outline, walls, ceiling: p.ceiling, wallT: t, nbr: [] },
    parts, modules, doors: [door], hatches: [],
    elevations: ["T", "L", "R"],
    planDims: [
      { a: [0, 0], b: [W, 0], label: frac(W, 8), off: -(t + 2.3) },
      { a: [W, 0], b: [W, D], label: frac(D, 8), off: -(t + 2.3) },
      { a: [stub, D], b: [W - stub, D], label: `${frac(p.opening, 8)} centered`, off: t + 2.3 + p.doorSlab },
    ],
    drawerGroups: [],
    stats: [
      { k: "Shelves", v: `${lv.length} × ${frac(p.depth, 8)} deep`, s: lv.length ? `tops at ${lv.join(", ")}"` : "none on" },
      { k: "Span", v: frac(W, 8), s: "wall to wall, cleats on three sides" },
      { k: "Front edge", v: p.edge === "poplar" ? "poplar strip" : "filled + painted", s: p.edge === "poplar" ? "1/4\" × 3/4\", glued and pinned flush" : "no edging" },
      { k: "Plywood", v: `~${sheets} sheets`, s: "3/4\" birch, 4 × 8" },
    ],
    titleMeta: [
      { k: "Closet", v: `${ftin(W)} × ${ftin(D)}` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "Shelves", v: `${lv.length}` },
      { k: "Depth", v: frac(p.depth, 8) },
    ],
    gcText: [
      `Master bath closet: ${lv.length} shelves, 3/4" birch plywood, ${frac(p.depth, 8)} deep, full width.`,
      `Shelf tops (from floor): ${lv.map(z => frac(z, 8)).join(", ")}.`,
      ...(p.topOn ? [`Plus one ${frac(p.topDepth, 8)}-deep shelf at ${frac(p.topZ, 8)}.`] : []),
      `1x2 cleats screwed into studs on all 3 walls; shelves sit loose on them.`,
      p.edge === "poplar" ? `1/4" x 3/4" poplar strip on each front edge.` : `No edge strip: fill and sand the plywood edge.`,
      `Paint same as bathroom, all sides. No lights.`,
    ].join("\n"),
    warnings,
    notes: [
      `${lv.length} shelves, 3/4" birch veneer-core plywood (paint grade), ${frac(p.depth, 8)} deep, full width. Tops at ${lv.join(", ")}" AFF.`,
      "They rest loose on 1×2 cleats (3/4\" × 1-1/2\") screwed into the studs on all three walls. Add a vertical 1×3 on each side wall if studs are scarce.",
      p.edge === "poplar" ? "Front edge: 1/4\" × 3/4\" poplar strip, glued and pinned flush." : "Front edge: none. Fill, sand and paint the plywood edge.",
      "Paint: bathroom paint, satin, primer + 2 coats, all sides. Paint the shelves flat, then set them in.",
      "No lights, no outlet.",
    ],
  };
}
