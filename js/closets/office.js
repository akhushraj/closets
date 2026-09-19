// Office reach-in: network + security gear at one end (painted plywood backboard, wall-mount
// rack, UPS on the floor), a fold-down desk across the rest, paper shelves above the desk,
// long-term storage shelves up top. Louvered 4080 double doors swing out into the office.
// A crawl-space hatch in the floor stays clear: everything but the UPS is wall-hung.
import { box, band, foldDesk, collector, hatchClashes } from "../model/builders.js";
import { frac, ftin } from "../lib/units.js";

export const INFO = {
  id: "office", name: "Office Closet", room: "Office", concept: "Gear end + fold-down desk", rev: "Rev A",
};

// Measured in the field (2026-09-18). These always override stored or default values.
export const FIELD = { W: 59.8, D: 23.6, ceiling: 120, doorAt: 4.8, doorRO: 49.9, doorH: 96 };

export const DEFAULTS = {
  gearW: 22, rackU: 12, rackZ: 56, rackDepth: 12, boardTop: 84, upsW: 7, upsD: 17, upsH: 10,
  deskZ: 29.5, deskDepth: 20, deskDown: true,
  paper1: 64, paper2: 76, paperDepth: 12,
  top1: 90, top2: 104, topDepth: 16,
  hatchX: 18, hatchY: 4, hatchW: 24, hatchD: 18,
  finish: "white", lights: true,
};

export const CONTROLS = [
  ["Network gear · left end", [
    { key: "gearW", label: "Gear zone width", min: 20, max: 30, step: 0.5 },
    { key: "rackU", label: "Wall rack size (U)", min: 6, max: 18, step: 1, fmt: "int" },
    { key: "rackZ", label: "Rack bottom height", min: 24, max: 60, step: 0.5 },
    { key: "rackDepth", label: "Rack depth", min: 10, max: 20, step: 0.5 },
    { key: "boardTop", label: "Backboard top", min: 72, max: 96, step: 0.5 },
    { key: "upsW", label: "UPS width (on the floor)", min: 5, max: 12, step: 0.5 },
  ]],
  ["Desk", [
    { key: "deskDown", label: "Show the desk folded down", type: "check" },
    { key: "deskZ", label: "Desk height", min: 26, max: 32, step: 0.5 },
    { key: "deskDepth", label: "Desk depth when down", min: 14, max: 24, step: 0.5 },
  ]],
  ["Shelves", [
    { key: "paper1", label: "Paper shelf 1 (over desk)", min: 56, max: 80, step: 0.5 },
    { key: "paper2", label: "Paper shelf 2 (over desk)", min: 64, max: 88, step: 0.5 },
    { key: "top1", label: "Long-term shelf 1", min: 84, max: 104, step: 0.5 },
    { key: "top2", label: "Long-term shelf 2", min: 96, max: 114, step: 0.5 },
    { key: "topDepth", label: "Long-term shelf depth", min: 12, max: 22, step: 0.5 },
  ]],
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
  const W = p.W, D = p.D, t = 4.5;
  const outline = [[0, 0], [W, 0], [W, D], [0, D]];
  const walls = [
    { id: "T", name: "Back wall", a: [0, 0], b: [W, 0] },
    { id: "R", name: "Right end", a: [W, 0], b: [W, D] },
    { id: "F", name: "Door wall", a: [W, D], b: [0, D], hidden: true },
    { id: "L", name: "Left end · gear", a: [0, D], b: [0, 0] },
  ];
  const w = Object.fromEntries(walls.map(x => [x.id, x]));
  const { parts, modules, add } = collector();
  const warnings = [], notes = [];
  const G = p.gearW, rackH = p.rackU * 1.75 + 2;

  // gear zone on the back wall, left end
  parts.push(box(w.T, "backboard", 0.25, G - 0.25, 0, 0.75, 24, p.boardTop, { mark: true, label: "Backboard top" }));
  parts.push(box(w.T, "rack", 1.25, G - 1.25, 0.75, 0.75 + p.rackDepth, p.rackZ, p.rackZ + rackH,
    { mark: true, label: `${p.rackU}U rack` }));
  // fiber ONT, gateway and blinds hub on the backboard below the rack
  const dev = (u0, u1, z0, z1, label, tone = "dark") => parts.push(box(w.T, "device", u0, u1, 0.75, 3, z0, z1, { label, tone }));
  const base = p.rackZ - 22;
  dev(1.5, 9.5, base, base + 10, "Fiber ONT", "light");
  dev(10.5, G - 1.5, base, base + 9, "Gateway");
  dev(1.5, 7.5, base + 12, base + 17, "Blinds hub", "light");
  for (const z of [18, base + 12]) parts.push(box(w.T, "outlet", G - 5, G - 2.5, 0.75, 1.5, z, z + 4.5));
  parts.push(box(w.L, "ups", D - p.upsD - 1, D - 1, 0.5, 0.5 + p.upsW, 0, p.upsH, { label: "UPS" }));
  modules.push(box(w.T, "equip", 0, G, 0, p.rackDepth + 0.75, 0, 0,
    { label: "Network gear", sub: `backboard + ${p.rackU}U rack` }));
  modules.push(box(w.L, "ups", D - p.upsD - 1, D - 1, 0.5, 0.5 + p.upsW, 0, 0, { label: "UPS" }));

  // fold-down desk across the rest, paper shelves above it
  add(foldDesk(w.T, { u0: G + 0.5, u1: W, z: p.deskZ, depth: p.deskDepth, down: p.deskDown }));
  add(band(w.T, { u0: G + 0.5, u1: W, depth: p.paperDepth, levels: [p.paper1, p.paper2], labels: ["Papers", "Folders / binders"] }));
  // long-term storage across the full width, clear of the gear's heat below
  add(band(w.T, { u0: 0, u1: W, depth: p.topDepth, levels: [p.top1, p.top2], labels: ["Long-term", "Long-term"] }));

  // louvered double doors (a pair, each half the opening), swinging out
  const f0 = W - (p.doorAt + p.doorRO), f1 = W - p.doorAt, mid = (f0 + f1) / 2, slab = p.doorRO / 2 - 1;
  const doors = [
    { wall: "F", u0: f0, u1: mid, slab, h: p.doorH, roH: p.doorH + 2.5, swing: "out", hingeU: f0 + 0.5, label: "louvered" },
    { wall: "F", u0: mid, u1: f1, slab, h: p.doorH, roH: p.doorH + 2.5, swing: "out", hingeU: f1 - 0.5, label: "louvered" },
  ];

  const hatches = [{ x0: p.hatchX, y0: p.hatchY, x1: p.hatchX + p.hatchW, y1: Math.min(D, p.hatchY + p.hatchD), label: "crawl hatch" }];
  if (hatchClashes(parts, hatches).length || p.hatchX < p.upsW + 1)
    warnings.push("The UPS sits on the crawl-space hatch. Move the UPS or confirm where the hatch really is.");
  if (base < 24 || p.rackZ + rackH > p.boardTop) warnings.push("The rack and the devices below it don't fit on the backboard. Adjust the rack height or the backboard top.");
  if (p.deskDepth > D) warnings.push("With the desk folded down, it sticks out past the door line.");
  if (p.top1 < p.boardTop + 2) warnings.push("The first long-term shelf sits over the gear. Keep some air above the rack for heat.");
  notes.push("Heat: the NVR, switch and UPS run around the clock. Louvered doors (or a door undercut plus a small thermostat fan) keep the closet from cooking them.");
  notes.push("Power: ask for a dedicated 20A circuit with outlets at the backboard and at the floor for the UPS.");
  notes.push("The desk folds up to open the crawl-space hatch. It's about 20\" deep, which suits a laptop, not a monitor setup.");

  const deskW = W - G - 0.5;
  return {
    info: INFO, params: p,
    closet: { outline, walls, ceiling: p.ceiling, wallT: t, nbr: [] },
    parts, modules, doors, hatches,
    elevations: ["T", "L", "R"],
    planDims: [
      { a: [0, 0], b: [W, 0], label: frac(W, 8), off: -(t + 2.3) },
      { a: [W, 0], b: [W, D], label: frac(D, 8), off: -(t + 2.3) },
      { a: [0, 0], b: [G, 0], label: `gear ${frac(G, 8)}`, off: -(t + 6.6) },
      { a: [G, 0], b: [W, 0], label: `desk ${frac(deskW, 8)}`, off: -(t + 6.6) },
      { a: [0, D], b: [p.doorAt, D], label: frac(p.doorAt, 8), off: t + 2.3 + p.doorRO / 2 },
      { a: [p.doorAt, D], b: [p.doorAt + p.doorRO, D], label: frac(p.doorRO, 8) + " R.O. pair", off: t + 2.3 + p.doorRO / 2 },
    ],
    drawerGroups: [],
    stats: [
      { k: "Gear zone", v: `${frac(G, 8)} wide`, s: `backboard to ${frac(p.boardTop, 8)} · ${p.rackU}U rack at ${frac(p.rackZ, 8)}` },
      { k: "Desk", v: `${frac(deskW, 8)} × ${frac(p.deskDepth, 8)}`, s: `folds down, top at ${frac(p.deskZ, 8)}` },
      { k: "Papers", v: `${frac(p.paper1, 8)} / ${frac(p.paper2, 8)}`, s: `${p.paperDepth}" shelves over the desk` },
      { k: "Long-term", v: `${frac(p.top1, 8)} / ${frac(p.top2, 8)}`, s: `${p.topDepth}" deep, full width` },
    ],
    titleMeta: [
      { k: "Closet", v: `${ftin(W)} × ${ftin(D)}` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "Rack", v: `${p.rackU}U` },
      { k: "Desk", v: frac(deskW, 8) },
    ],
    warnings, notes,
  };
}
