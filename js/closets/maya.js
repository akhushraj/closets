// Maya's reach-in: a 36" center unit (drawers + rod, like the master daily sections) whose plywood
// gables carry fixed plywood shelves on both sides; the far ends of those shelves sit on the end walls.
// 3-panel sliding doors in a 95.8" opening. Rod starts low for a 6-year-old and moves up.
import { dressSection, fixedShelves, collector } from "../model/builders.js";
import { frac, ftin } from "../lib/units.js";
import { parseFronts } from "./rohan.js";
import { shelfSlots, shelfControls, readShelves, spacingWarnings, LOOK, PLYWOOD_NOTE } from "./common.js";

export const INFO = { id: "maya", name: "Maya's Closet", room: "Maya's room", concept: "Center unit + side shelves", rev: "" };

export const FIELD = { W: 112.4, D: 29.8, ceiling: 120, stubL: 8.6, opening: 95.8, stubR: 8.1, wallAtOpening: 6.3, doorH: 80 };

export const DEFAULTS = {
  centerW: 36, depth: 24, fronts: "7, 8, 9", rodZ: 62,
  ...shelfSlots("s", [12, 26, 40, 54, 68, 82, 96, 110], []),
  finish: "white", lights: true,
};

export const CONTROLS = [
  ["Center unit", [
    { key: "centerW", label: "Width", min: 30, max: 42, step: 0.5 },
    { key: "depth", label: "Depth (whole closet)", min: 20, max: 24, step: 0.5 },
    { key: "rodZ", label: "Rod height (moves up as she grows)", min: 48, max: 84, step: 0.5 },
    { key: "fronts", label: "Drawer fronts, top → bottom", type: "text" },
  ]],
  shelfControls("s", 8, "Side shelves · both sides"),
  LOOK,
];

export function build(p) {
  p = { ...p, ...FIELD };
  const W = p.W, D = p.D, t = 4.5, cw = p.centerW, d = p.depth;
  const outline = [[0, 0], [W, 0], [W, D], [0, D]];
  const walls = [
    { id: "T", name: "Back wall", a: [0, 0], b: [W, 0] },
    { id: "R", name: "Right end", a: [W, 0], b: [W, D] },
    { id: "F", name: "Door wall", a: [W, D], b: [0, D], hidden: true },
    { id: "L", name: "Left end", a: [0, D], b: [0, 0] },
  ];
  const w = Object.fromEntries(walls.map(x => [x.id, x]));
  const { parts, modules, add } = collector();
  const c0 = (W - cw) / 2, c1 = c0 + cw;
  const lv = readShelves(p, "s", 8);
  add(fixedShelves(w.T, { u0: 0, u1: c0, depth: d, levels: lv, label: "Shelves" }));
  const cu = add(dressSection(w.T, { u0: c0, u1: c1, depth: d, fronts: [...parseFronts(p.fronts, [7, 8, 9])].reverse(),
    rodZ: p.rodZ, upper: [p.rodZ + 16, p.rodZ + 30, p.rodZ + 44].filter(z => z < 114), label: "Center", prefix: "M", garment: "pants", seed: 13 }));
  add(fixedShelves(w.T, { u0: c1, u1: W, depth: d, levels: lv, label: "Shelves" }));

  const u0 = W - (p.stubL + p.opening), u1 = W - p.stubL;
  const door = { wall: "F", u0, u1, slab: p.opening / 3 + 1, h: p.doorH, roH: p.doorH + 2.5, swing: "slide", panels: 3, hingeU: u0, label: "3-track slider" };
  const warnings = [...spacingWarnings(lv, "Side shelves")];
  if (cu.counterZ > p.rodZ - 26) warnings.push("The rod is so low that her clothes will reach the drawer top.");

  return {
    info: INFO, params: p,
    closet: { outline, walls, ceiling: p.ceiling, wallT: p.wallAtOpening, nbr: [] },
    parts, modules, doors: [door], hatches: [],
    elevations: ["T", "L", "R"],
    planDims: [
      { a: [0, 0], b: [W, 0], label: frac(W, 8), off: -(t + 2.3) },
      { a: [W, 0], b: [W, D], label: frac(D, 8), off: -(t + 2.3) },
      { a: [0, 0], b: [c0, 0], label: frac(c0, 8), off: -(t + 6.6) },
      { a: [c0, 0], b: [c1, 0], label: frac(cw, 8), off: -(t + 6.6) },
      { a: [c1, 0], b: [W, 0], label: frac(W - c1, 8), off: -(t + 6.6) },
      { a: [0, D], b: [p.stubL, D], label: frac(p.stubL, 8), off: p.wallAtOpening + 4 },
      { a: [p.stubL, D], b: [p.stubL + p.opening, D], label: `${frac(p.opening, 8)} opening`, off: p.wallAtOpening + 4 },
      { a: [p.stubL + p.opening, D], b: [W, D], label: frac(p.stubR, 8), off: p.wallAtOpening + 4 },
    ],
    drawerGroups: [{ name: "Center drawers", drawers: cu.drawers }],
    stats: [
      { k: "Center unit", v: `${frac(cw, 8)} × ${frac(d, 8)}`, s: `${cu.drawers.length} drawers, rod at ${frac(p.rodZ, 8)}` },
      { k: "Side shelves", v: `2 × ${frac(c0, 8)} wide`, s: lv.length ? `tops at ${lv.join(", ")}"` : "none on" },
      { k: "Depth", v: frac(d, 8), s: `inside a ${frac(D, 8)} closet; the sliders run in front` },
    ],
    titleMeta: [
      { k: "Closet", v: `${ftin(W)} × ${ftin(D)}` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "Rod", v: frac(p.rodZ, 8) },
      { k: "Drawers", v: `${cu.drawers.length}` },
    ],
    warnings,
    notes: [
      "The center unit's two plywood side panels carry the inner ends of the side shelves. The outer ends sit on cleats on the end walls.",
      `The rod starts at ${frac(p.rodZ, 8)} so she can reach it. Moving it up later is just moving the rod brackets and the shelf above.`,
      PLYWOOD_NOTE,
    ],
  };
}
