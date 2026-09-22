// Master walk-in, oriented like the field sketch: long hanging wall on the left (104.5"),
// door on the bottom wall (LHI, swings in), nook at the bottom right.
// Left wall: section 1 behind the door = long-term plywood shelves; sections 2 and 3 = daily
// (drawers + rod above, no doors). Right wall: 15"-deep shelf cabinets with doors.
// Nook: fixed plywood shelves. Crawl hatch in front of the nook stays clear.
import { dressSection, cabinetRun, fixedShelves, collector, hatchClashes } from "../model/builders.js";
import { frac, ftin } from "../lib/units.js";
import { parseFronts } from "./rohan.js";
import { shelfSlots, shelfControls, readShelves, spacingWarnings, LOOK, PLYWOOD_NOTE } from "./common.js";

export const INFO = { id: "master", name: "Master Closet", room: "Master bedroom",
  concept: "Long-term + two daily sections · cabinets right", rev: "" };

// Measured in the field (2026-09-18), sketch orientation. Always overrides stored values.
export const FIELD = { W: 72.3, Lh: 104.5, rightTo: 76.8, nookD: 12.4, ceiling: 120,
  doorAt: 25.8, doorRO: 32, doorSlab: 30, doorH: 80,
  hatchX0: 40.7, hatchY0: 78.65, hatchX1: 69.8, hatchY1: 102.85 };

export const DEFAULTS = {
  leftDepth: 24, sec1: 30, sec2: 37.25,
  fronts2: "7, 8, 9, 10", fronts3: "7, 8, 9, 10", rod2: 80, rod3: 80,
  ...shelfSlots("a", [14, 30, 46, 62, 78, 94, 110], [4]),
  rightDepth: 15, rightUnits: 4, rightTop: 96, rightSplit: 48,
  ...shelfSlots("n", [16, 30, 44, 58, 72, 86, 100], [114]),
  finish: "oak", lights: true,
};

export const CONTROLS = [
  ["Left wall · sections", [
    { key: "leftDepth", label: "Depth", min: 20, max: 25, step: 0.5 },
    { key: "sec1", label: "Section 1 width (behind the door)", min: 24, max: 40, step: 0.5 },
    { key: "sec2", label: "Section 2 width (section 3 takes the rest)", min: 28, max: 46, step: 0.5 },
    { key: "rod2", label: "Section 2 rod height", min: 66, max: 86, step: 0.5 },
    { key: "rod3", label: "Section 3 rod height", min: 66, max: 86, step: 0.5 },
    { key: "fronts2", label: "Section 2 drawer fronts, top → bottom", type: "text" },
    { key: "fronts3", label: "Section 3 drawer fronts, top → bottom", type: "text" },
  ]],
  shelfControls("a", 8, "Section 1 shelves · long-term"),
  ["Right wall · cabinets with doors", [
    { key: "rightDepth", label: "Depth", min: 12, max: 18, step: 0.5 },
    { key: "rightUnits", label: "Number of cabinets", min: 2, max: 5, step: 1, fmt: "int" },
    { key: "rightTop", label: "Cabinet height", min: 84, max: 110, step: 0.5 },
    { key: "rightSplit", label: "Lower / upper door split", min: 36, max: 60, step: 0.5 },
  ]],
  shelfControls("n", 8, "Nook shelves"),
  LOOK,
];

export function build(p) {
  p = { ...p, ...FIELD };
  const W = p.W, Lh = p.Lh, RT = p.rightTo, XN = W + p.nookD, t = 4.5;
  const outline = [[0, 0], [W, 0], [W, RT], [XN, RT], [XN, Lh], [0, Lh]];
  const walls = [
    { id: "T",  name: "Back wall",                      a: [0, 0],   b: [W, 0] },
    { id: "R",  name: "Right wall · cabinets",          a: [W, 0],   b: [W, RT] },
    { id: "NT", name: "Nook top",                       a: [W, RT],  b: [XN, RT], hidden: true },
    { id: "NR", name: "Nook · shelves",                 a: [XN, RT], b: [XN, Lh] },
    { id: "B",  name: "Door wall",                      a: [XN, Lh], b: [0, Lh], hidden: true },
    { id: "L",  name: "Left wall · long-term + daily",  a: [0, Lh],  b: [0, 0], tagU: 0.5 },
  ];
  const w = Object.fromEntries(walls.map(x => [x.id, x]));
  const { parts, modules, add } = collector();
  const warnings = [];

  // left wall, u runs from the door wall (bottom) up to the back wall
  const s1 = p.sec1, s2 = p.sec2, s3 = Lh - s1 - s2, d = p.leftDepth;
  const aLv = readShelves(p, "a", 8);
  add(fixedShelves(w.L, { u0: 0, u1: s1, depth: d, levels: aLv, label: "Long-term" }));
  const fr = s => [...parseFronts(s, [7, 8, 9, 10])].reverse();
  const d2 = add(dressSection(w.L, { u0: s1, u1: s1 + s2, depth: d, fronts: fr(p.fronts2), rodZ: p.rod2, upper: [96, 108], label: "Daily 1", prefix: "A", seed: 5 }));
  const d3 = add(dressSection(w.L, { u0: s1 + s2, u1: Lh, depth: d, fronts: fr(p.fronts3), rodZ: p.rod3, upper: [96, 108], label: "Daily 2", prefix: "B", seed: 9 }));
  if (s3 < 24) warnings.push(`Section 3 is only ${frac(s3, 8)} wide. Narrow section 1 or 2.`);

  // right wall cabinets with doors
  add(cabinetRun(w.R, { u0: 0, u1: RT, depth: p.rightDepth, units: p.rightUnits, top: p.rightTop, split: p.rightSplit, levels: [20, 34, 62, 76] }));
  const aisle = W - d - p.rightDepth, doorW = RT / p.rightUnits;
  if (doorW > aisle - 3) warnings.push(`The ${frac(doorW, 8)} cabinet doors nearly fill the ${frac(aisle, 8)} aisle when open. Try more, narrower cabinets.`);

  // nook shelves
  const nLv = readShelves(p, "n", 8);
  add(fixedShelves(w.NR, { u0: 0, u1: Lh - RT, depth: p.nookD, levels: nLv, label: "Nook shelves" }));

  // entry door on the bottom wall, LHI: hinge on the jamb nearer the left wall, swings in
  const u0 = XN - (p.doorAt + p.doorRO), u1 = XN - p.doorAt;
  const door = { wall: "B", u0, u1, slab: p.doorSlab, h: p.doorH, roH: p.doorH + 2.5, swing: "in", hingeU: u1 - 1, label: "LHI" };
  if (d > p.doorAt + 1 - 1.4 - 0.25) warnings.push("At this depth, section 1 is in the way of the entry door when it's fully open.");

  const hatches = [{ x0: p.hatchX0, y0: p.hatchY0, x1: p.hatchX1, y1: p.hatchY1, label: "crawl hatch" }];
  if (hatchClashes(parts, hatches).length) warnings.push("Something that stands on the floor covers the crawl-space hatch.");
  warnings.push(...spacingWarnings(aLv, "Section 1"), ...spacingWarnings(nLv, "Nook"));

  const drawers = [...d2.drawers, ...d3.drawers], slide = d2.module.slide;
  return {
    info: INFO, params: p,
    closet: { outline, walls, ceiling: p.ceiling, wallT: t, nbr: [] },
    parts, modules, doors: [door], hatches,
    elevations: ["L", "R", "NR", "T"],
    planDims: [
      { a: [0, 0], b: [W, 0], label: frac(W, 8), off: -(t + 2.3) },
      { a: [W, 0], b: [W, RT], label: frac(RT, 8), off: -(t + 2.3) },
      { a: [0, 0], b: [0, s3], label: frac(s3, 8), off: t + 2.6 },
      { a: [0, s3], b: [0, s3 + s2], label: frac(s2, 8), off: t + 2.6 },
      { a: [0, s3 + s2], b: [0, Lh], label: frac(s1, 8), off: t + 2.6 },
      { a: [0, 0], b: [0, Lh], label: frac(Lh, 8), off: t + 7 },
      { a: [0, Lh], b: [p.doorAt, Lh], label: frac(p.doorAt, 8), off: t + 2.3 },
      { a: [p.doorAt, Lh], b: [p.doorAt + p.doorRO, Lh], label: frac(p.doorRO, 8) + " R.O.", off: t + 2.3 },
      { a: [p.doorAt + p.doorRO, Lh], b: [XN, Lh], label: frac(XN - p.doorAt - p.doorRO, 8), off: t + 2.3 },
      { a: [d, 40], b: [W - p.rightDepth, 40], label: `aisle ${frac(aisle, 8)}`, off: 0 },
    ],
    drawerGroups: [{ name: "Daily 1 drawers", drawers: d2.drawers }, { name: "Daily 2 drawers", drawers: d3.drawers }],
    stats: [
      { k: "Left wall", v: `${frac(s1, 8)} · ${frac(s2, 8)} · ${frac(s3, 8)}`, s: `long-term · daily · daily, ${frac(d, 8)} deep` },
      { k: "Drawers", v: `${drawers.length} × ${slide}" deep`, s: `rods at ${frac(p.rod2, 8)} / ${frac(p.rod3, 8)}` },
      { k: "Right cabinets", v: `${p.rightUnits} × ${frac(doorW, 8)}`, s: `${frac(p.rightDepth, 8)} deep, doors swing ${frac(doorW, 8)}` },
      { k: "Aisle", v: frac(aisle, 8), s: "between the left and right sides" },
    ],
    titleMeta: [
      { k: "Closet", v: `${ftin(W)} × ${ftin(Lh)} + nook` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "Aisle", v: frac(aisle, 8) },
      { k: "Drawers", v: `${drawers.length} × ${slide}" deep` },
    ],
    warnings,
    notes: [
      `Section 1 sits behind the entry door. Opened fully, the door stands about ${frac(p.doorAt + 1 - 1.4 - d, 8)} in front of its shelves.`,
      `Right cabinets: each door swings ${frac(doorW, 8)} into a ${frac(aisle, 8)} aisle (dashed in the plan). If it feels tight, drop the doors or use more, narrower cabinets.`,
      "The middle of the back wall, between the two sides, is open for now.",
      PLYWOOD_NOTE,
    ],
  };
}
