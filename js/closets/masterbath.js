// Master bath reach-in: fixed plywood shelves wall to wall, like Rohan's. Door swings out.
import { fixedShelves, collector } from "../model/builders.js";
import { frac, ftin } from "../lib/units.js";
import { shelfSlots, shelfControls, readShelves, spacingWarnings, LOOK, PLYWOOD_NOTE } from "./common.js";

export const INFO = { id: "masterbath", name: "Master Bath Closet", room: "Master bath", concept: "Fixed plywood shelves", rev: "" };

export const FIELD = { W: 27.9, D: 23.7, ceiling: 120, opening: 24.3, doorSlab: 22, doorH: 96 };

export const DEFAULTS = {
  depth: 20,
  ...shelfSlots("s", [12, 26, 40, 54, 68, 82, 96, 110], []),
  finish: "white", lights: false,
};

export const CONTROLS = [
  shelfControls("s", 8, "Shelves · top of each, AFF", [
    { key: "depth", label: "Shelf depth", min: 12, max: 23, step: 0.5 },
  ]),
  LOOK,
];

export function build(p) {
  p = { ...p, ...FIELD };
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
  add(fixedShelves(w.T, { u0: 0, u1: W, depth: p.depth, levels: lv, label: "Shelves" }));
  const u0 = stub, u1 = W - stub;
  const door = { wall: "F", u0, u1, slab: p.doorSlab, h: p.doorH, roH: p.doorH + 2.5, swing: "out", hingeU: u1 - 0.5, label: "1'-10\" × 8'" };
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
      { k: "Span", v: frac(W, 8), s: "wall to wall on cleats" },
    ],
    titleMeta: [
      { k: "Closet", v: `${ftin(W)} × ${ftin(D)}` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "Shelves", v: `${lv.length}` },
    ],
    warnings: spacingWarnings(lv, "Shelves"),
    notes: ["For towels, toiletry backstock, cleaning supplies and toilet paper.", PLYWOOD_NOTE],
  };
}
