// Office reach-in: network + security gear at the left end, where the cables arrive (two boxes at
// 75.2" AFF on the left end wall). A plywood divider separates it from fixed plywood shelves across the
// rest; the lowest shelf clears a space heater. No clothes rod, no desk. Louvered double doors swing out.
import { box, fixedShelves, collector, hatchClashes } from "../model/builders.js";
import { PLY, frac, ftin } from "../lib/units.js";
import { shelfSlots, shelfControls, readShelves, spacingWarnings, PLYWOOD_NOTE } from "./common.js";

export const INFO = { id: "office", name: "Office Closet", room: "Office", concept: "Network gear + plywood shelves", rev: "" };

// Measured in the field (2026-09-18). Always overrides stored values.
export const FIELD = { W: 59.8, D: 23.6, ceiling: 120, doorAt: 4.8, doorRO: 49.9, doorH: 96, returnD: 4.9,
  boxZ: 75.2, boxBack1: 5.9, boxBack2: 12.9, topOutletZ: 98, topOutletBack: 14.6, upsOutletZ: 15.6 };

export const DEFAULTS = {
  gearW: 22, rackU: 12, rackZ: 56, rackDepth: 12, boardTop: 90, upsW: 7, upsD: 17, upsH: 10,
  shelfDepth: 18, gearTopOn: true, gearTop: 102,
  ...shelfSlots("s", [32, 46, 60, 74, 88, 102], [18, 112]),
  hatchX: 18, hatchY: 4, hatchW: 24, hatchD: 18,
  finish: "white", lights: true,
};

export const CONTROLS = [
  ["Network gear · left end", [
    { key: "gearW", label: "Gear zone width", min: 20, max: 30, step: 0.5 },
    { key: "rackU", label: "Wall rack size (U)", min: 6, max: 18, step: 1, fmt: "int" },
    { key: "rackZ", label: "Rack bottom height", min: 40, max: 70, step: 0.5 },
    { key: "rackDepth", label: "Rack depth", min: 10, max: 18, step: 0.5 },
    { key: "upsW", label: "UPS width (on the floor)", min: 5, max: 12, step: 0.5 },
    { key: "gearTopOn", label: "Shelf above the gear", type: "check" },
    { key: "gearTop", label: "Its height", min: 92, max: 112, step: 0.5 },
  ]],
  shelfControls("s", 8, "Shelves · top of each, AFF", [
    { key: "shelfDepth", label: "Shelf depth", min: 12, max: 18.5, step: 0.5 },
  ]),
  ["Crawl-space hatch (until measured)", [
    { key: "hatchX", label: "From the left wall", min: 0, max: 40, step: 0.5 },
    { key: "hatchY", label: "From the back wall", min: 0, max: 10, step: 0.5 },
    { key: "hatchW", label: "Width", min: 18, max: 32, step: 0.5 },
    { key: "hatchD", label: "Depth", min: 14, max: 24, step: 0.5 },
  ]],
  ["Look", [
    { key: "finish", label: "Finish", type: "select", options: [["white", "Painted white"], ["oak", "White oak"], ["walnut", "Walnut"]] },
    { key: "lights", label: "LED strips on", type: "check" },
  ]],
];

export function build(p) {
  p = { ...p, ...FIELD };
  const W = p.W, D = p.D, t = 4.5, G = p.gearW, sd = p.shelfDepth;
  const outline = [[0, 0], [W, 0], [W, D], [0, D]];
  const walls = [
    { id: "T", name: "Back wall", a: [0, 0], b: [W, 0] },
    { id: "R", name: "Right end", a: [W, 0], b: [W, D] },
    { id: "F", name: "Door wall", a: [W, D], b: [0, D], hidden: true },
    { id: "L", name: "Left end · cables in", a: [0, D], b: [0, 0] },
  ];
  const w = Object.fromEntries(walls.map(x => [x.id, x]));
  const { parts, modules, add } = collector();
  const warnings = [], rackH = p.rackU * 1.75 + 2;

  // what's already on the left end wall (u runs front -> back corner)
  const bx = back => D - back;
  for (const [back, label] of [[p.boxBack1, "Cable box · fiber, cameras, ethernet"], [p.boxBack2, "Cable box · blinds"]])
    parts.push(box(w.L, "device", bx(back) - 2, bx(back) + 2, 0, 1.2, p.boxZ, p.boxZ + 4, { tone: "light", mark: true, label }));
  parts.push(box(w.L, "outlet", bx(p.topOutletBack) - 1.2, bx(p.topOutletBack) + 1.2, 0, 0.8, p.topOutletZ, p.topOutletZ + 4.5, { mark: true, label: "Outlet" }));
  parts.push(box(w.L, "outlet", 3, 5.4, 0, 0.8, p.upsOutletZ, p.upsOutletZ + 4.5, { mark: true, label: "UPS outlet" }));

  // gear zone on the back wall, left end: backboard, rack, devices below it, UPS on the floor
  parts.push(box(w.T, "backboard", 0.25, G - 0.25, 0, 0.75, 24, p.boardTop, { mark: true, label: "Backboard top" }));
  parts.push(box(w.T, "rack", 1.25, G - 1.25, 0.75, 0.75 + p.rackDepth, p.rackZ, p.rackZ + rackH, { mark: true, label: `${p.rackU}U rack` }));
  const base = p.rackZ - 22;
  const dev = (u0, u1, z0, z1, label, tone = "dark") => parts.push(box(w.T, "device", u0, u1, 0.75, 3, z0, z1, { label, tone }));
  dev(1.5, 9.5, base, base + 10, "Fiber ONT", "light");
  dev(10.5, G - 1.5, base, base + 9, "Gateway");
  dev(1.5, 7.5, base + 12, base + 17, "Blinds hub", "light");
  parts.push(box(w.L, "ups", D - p.upsD - 1, D - 1, 0.5, 0.5 + p.upsW, 0, p.upsH, { label: "UPS" }));
  modules.push(box(w.T, "equip", 0, G, 0, p.rackDepth + 0.75, 0, 0, { label: "Network gear", sub: `backboard + ${p.rackU}U rack` }));
  modules.push(box(w.L, "ups", D - p.upsD - 1, D - 1, 0.5, 0.5 + p.upsW, 0, 0, { label: "UPS" }));

  // plywood divider, then fixed shelves across the rest; one shelf above the gear
  const lv = readShelves(p, "s", 8);
  // wall-hung divider: starts just under the lowest shelf so the floor (and hatch) stays open
  const divBottom = Math.max(0, Math.min(lv[0] ?? 100, p.gearTopOn ? p.gearTop : 100) - PLY - 3);
  parts.push(box(w.T, "carcass", G, G + PLY, 0, sd, divBottom, 116));
  add(fixedShelves(w.T, { u0: G + PLY, u1: W, depth: sd, levels: lv, label: "Shelves" }));
  if (p.gearTopOn) add(fixedShelves(w.T, { u0: 0, u1: G, depth: sd, levels: [p.gearTop], label: "Above the gear" }));

  // louvered double doors, swinging out
  const f0 = W - (p.doorAt + p.doorRO), f1 = W - p.doorAt, mid = (f0 + f1) / 2, slab = p.doorRO / 2 - 1;
  const doors = [
    { wall: "F", u0: f0, u1: mid, slab, h: p.doorH, roH: p.doorH + 2.5, swing: "out", hingeU: f0 + 0.5, label: "louvered" },
    { wall: "F", u0: mid, u1: f1, slab, h: p.doorH, roH: p.doorH + 2.5, swing: "out", hingeU: f1 - 0.5, label: "louvered" },
  ];

  const hatches = [{ x0: p.hatchX, y0: p.hatchY, x1: p.hatchX + p.hatchW, y1: Math.min(D, p.hatchY + p.hatchD), label: "crawl hatch" }];
  if (p.hatchX < p.upsW + 1) warnings.push("The UPS sits on the crawl-space hatch. Move one or the other.");
  if (hatchClashes(parts, hatches).length) warnings.push("Something that stands on the floor covers the crawl-space hatch.");
  if (base < 24 || p.rackZ + rackH > p.boardTop) warnings.push("The rack and the devices below it don't fit on the backboard.");
  if (sd > D - p.returnD) warnings.push(`At ${frac(sd, 8)} deep, the shelves run into the ${frac(p.returnD, 8)} wall returns at the door.`);
  if (p.gearTopOn && p.gearTop < p.rackZ + rackH + 12) warnings.push("The shelf above the gear sits close to the rack. Leave room for heat and cables.");
  warnings.push(...spacingWarnings(lv, "Shelves"));
  const clear1 = lv.length ? lv[0] - PLY - 1.5 : 0;

  return {
    info: INFO, params: p,
    closet: { outline, walls, ceiling: p.ceiling, wallT: t, nbr: [] },
    parts, modules, doors, hatches,
    elevations: ["T", "L", "R"],
    planDims: [
      { a: [0, 0], b: [W, 0], label: frac(W, 8), off: -(t + 2.3) },
      { a: [W, 0], b: [W, D], label: frac(D, 8), off: -(t + 2.3) },
      { a: [0, 0], b: [G, 0], label: `gear ${frac(G, 8)}`, off: -(t + 6.6) },
      { a: [0, D], b: [p.doorAt, D], label: frac(p.doorAt, 8), off: t + 2.3 + p.doorRO / 2 },
      { a: [p.doorAt, D], b: [p.doorAt + p.doorRO, D], label: frac(p.doorRO, 8) + " R.O. pair", off: t + 2.3 + p.doorRO / 2 },
    ],
    drawerGroups: [],
    stats: [
      { k: "Gear zone", v: `${frac(G, 8)} wide`, s: `${p.rackU}U rack ${frac(p.rackZ, 8)}–${frac(p.rackZ + rackH, 8)}; cables arrive at ${p.boxZ}"` },
      { k: "Shelves", v: `${lv.length} × ${frac(sd, 8)} deep`, s: lv.length ? `tops at ${lv.join(", ")}"` : "none on" },
      { k: "Under the lowest shelf", v: frac(Math.max(0, clear1), 8), s: "clear height at the cleats (space heater, etc.)" },
      { k: "Above the gear", v: p.gearTopOn ? frac(p.gearTop, 8) : "off", s: "long-term storage" },
    ],
    titleMeta: [
      { k: "Closet", v: `${ftin(W)} × ${ftin(D)}` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "Rack", v: `${p.rackU}U` },
      { k: "Shelves", v: `${lv.length}` },
    ],
    warnings,
    notes: [
      "The desk is gone. At 23.6\" deep, next to gear that runs warm around the clock, and over a crawl hatch, the space works better as storage.",
      `The cables arrive in two boxes on the left end wall at ${p.boxZ}", right beside the top of the rack. That's a short, tidy run.`,
      "Heat: the NVR, switch and UPS run all the time. Louvered doors, or a door undercut plus a small thermostat fan, keep the closet from cooking them.",
      "Store the space heater here, but don't run it inside the closet.",
      PLYWOOD_NOTE,
    ],
  };
}
