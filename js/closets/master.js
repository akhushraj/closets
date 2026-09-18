// Master walk-in (the user + Pragathi). Concept A with the user's changes:
// 24"-deep hanging across the top wall (his | hers, long + double), 15"-deep drawer banks
// on the bottom wall with a lockable centre bay, a fold-down press board on the right wall,
// wall-hung shelves with a mandir in the nook (crawl-space hatch below), upper band.
// Plan orientation is as drawn: x to the right, y down the page; the door is on the left wall.
import { hangSections, drawerTower, shelfStack, band, pressBoard, collector, hatchClashes, box } from "../model/builders.js";
import { PLY, frac, ftin } from "../lib/units.js";
import { parseFronts } from "./rohan.js";

export const INFO = {
  id: "master", name: "Master Closet", room: "Master bedroom", concept: "Concept A · hanging wall + drawer wall", rev: "Rev A",
};

export const DEFAULTS = {
  W: 104, D: 72, nookW: 28, nookD: 12, ceiling: 120,
  doorAt: 22, doorRO: 32, doorSlab: 30, doorH: 80, doorHinge: "top", doorSwing: "in",
  hangDepth: 24, split: 52, hisLong: 20, hersLong: 20, upperRod: 82, lowerRod: 41,
  drawerDepth: 15, bankW: 30, hisFronts: "5, 5, 6, 6, 8", hersFronts: "5, 5, 6, 6, 8", centerFronts: "8, 10, 12",
  towerShelves: 3,
  pressOn: true, pressDown: false, pressAt: 33,
  nookBottom: 24, nookShelves: 4, mandirZ: 48,
  hatchX: 2, hatchY: 60, hatchW: 24, hatchD: 18,
  bandOn: true, band1: 96, band2: 108, bandDepthTop: 20,
  finish: "oak", lights: true,
};

export const CONTROLS = [
  ["Shell (field-verify)", [
    { key: "W", label: "Closet width", min: 96, max: 116, step: 0.5 },
    { key: "D", label: "Closet depth", min: 64, max: 80, step: 0.5 },
    { key: "nookW", label: "Nook width", min: 20, max: 36, step: 0.5 },
    { key: "nookD", label: "Nook depth", min: 8, max: 18, step: 0.5 },
    { key: "ceiling", label: "Ceiling", min: 96, max: 132, step: 1, fmt: "ftin" },
  ]],
  ["Door", [
    { key: "doorAt", label: "Opening starts from top wall", min: 0, max: 40, step: 0.5 },
    { key: "doorRO", label: "Rough opening", min: 28, max: 36, step: 0.5 },
    { key: "doorHinge", label: "Hinge side", type: "select", options: [["top", "Near the top wall"], ["bottom", "Near the nook"]] },
    { key: "doorSwing", label: "Swing", type: "select", options: [["in", "Into the closet (as drawn)"], ["out", "Out into the bedroom"]] },
  ]],
  ["Hanging · top wall", [
    { key: "hangDepth", label: "Hanging depth", min: 20, max: 28, step: 0.5 },
    { key: "split", label: "His | hers split, from the left", min: 30, max: 74, step: 0.5 },
    { key: "hisLong", label: "His long-hang width", min: 0, max: 40, step: 0.5 },
    { key: "hersLong", label: "Hers long-hang width", min: 0, max: 40, step: 0.5 },
    { key: "upperRod", label: "Upper rod", min: 76, max: 86, step: 0.5 },
    { key: "lowerRod", label: "Lower rod", min: 36, max: 46, step: 0.5 },
  ]],
  ["Drawers · bottom wall", [
    { key: "drawerDepth", label: "Depth", min: 12, max: 20, step: 0.5 },
    { key: "bankW", label: "His / hers bank width", min: 18, max: 34, step: 0.5 },
    { key: "hisFronts", label: "His fronts, top → bottom", type: "text" },
    { key: "hersFronts", label: "Hers fronts, top → bottom", type: "text" },
    { key: "centerFronts", label: "Centre fronts (top one locks)", type: "text" },
    { key: "towerShelves", label: "Shelves above the drawers", min: 0, max: 4, step: 1, fmt: "int" },
  ]],
  ["Press board · right wall", [
    { key: "pressOn", label: "Fold-down press board", type: "check" },
    { key: "pressDown", label: "Show it folded down", type: "check" },
    { key: "pressAt", label: "Position from top wall", min: 18, max: 60, step: 0.5 },
  ]],
  ["Nook · shelves + mandir", [
    { key: "nookBottom", label: "Lowest shelf (hatch below)", min: 12, max: 40, step: 0.5 },
    { key: "nookShelves", label: "Shelves", min: 2, max: 6, step: 1, fmt: "int" },
    { key: "mandirZ", label: "Mandir shelf height", min: 30, max: 70, step: 0.5 },
  ]],
  ["Crawl-space hatch", [
    { key: "hatchX", label: "From the left wall", min: 0, max: 90, step: 0.5 },
    { key: "hatchY", label: "From the top wall", min: 0, max: 70, step: 0.5 },
    { key: "hatchW", label: "Width", min: 18, max: 32, step: 0.5 },
    { key: "hatchD", label: "Depth", min: 14, max: 30, step: 0.5 },
  ]],
  ["Upper storage", [
    { key: "bandOn", label: "Upper shelves on all walls", type: "check" },
    { key: "band1", label: "Seasonal shelf", min: 88, max: 104, step: 0.5 },
    { key: "band2", label: "Long-term shelf (sealed bins)", min: 100, max: 114, step: 0.5 },
  ]],
  ["Look", [
    { key: "finish", label: "Finish", type: "select", options: [["oak", "White oak"], ["white", "Painted white"], ["walnut", "Walnut"]] },
    { key: "lights", label: "LED strips on", type: "check" },
  ]],
];

export function build(p) {
  const W = p.W, D = p.D, NW = p.nookW, ND = p.nookD, L = D + ND, t = 4.5;
  const outline = [[0, 0], [W, 0], [W, D], [NW, D], [NW, L], [0, L]];
  const walls = [
    { id: "T",  name: "Top wall · hanging",       a: [0, 0],   b: [W, 0] },
    { id: "R",  name: "Right wall · press board", a: [W, 0],   b: [W, D] },
    { id: "B",  name: "Bottom wall · drawers",    a: [W, D],   b: [NW, D] },
    { id: "NS", name: "Nook side",                a: [NW, D],  b: [NW, L], hidden: true },
    { id: "NB", name: "Nook · shelves + mandir",  a: [NW, L],  b: [0, L] },
    { id: "L",  name: "Door wall",                a: [0, L],   b: [0, 0] },
  ];
  const w = Object.fromEntries(walls.map(x => [x.id, x]));
  const levels = p.bandOn ? [p.band1, p.band2] : [];
  const stackTop = 84.75;
  const { parts, modules, add } = collector();
  const warnings = [];

  // hanging: his | hers, each a double-hang section plus a long-hang section, long ones meeting in the middle
  const his = Math.max(12, p.split), hers = Math.max(12, W - p.split);
  const hisLong = Math.min(p.hisLong, his - 12), hersLong = Math.min(p.hersLong, hers - 12);
  const sections = [
    { len: his - hisLong, type: "double", owner: "His" },
    ...(hisLong > 0 ? [{ len: hisLong, type: "long", owner: "His" }] : []),
    ...(hersLong > 0 ? [{ len: hersLong, type: "long", owner: "Hers" }] : []),
    { len: hers - hersLong, type: "double", owner: "Hers" },
  ];
  const hang = add(hangSections(w.T, { u0: 0, depth: p.hangDepth, shelfZ: p.upperRod + 2, shelfDepth: p.hangDepth,
    upperRod: p.upperRod, lowerRod: p.lowerRod, sections }));

  // drawer wall (u runs right -> left along the bottom wall): hers | centre | his
  const run = W - NW, centreW = run - 2 * p.bankW;
  if (centreW < 10) warnings.push(`The centre bay is only ${centreW.toFixed(1)}" wide. Narrow the his / hers banks.`);
  const bank = (u0, u1, fronts, label, prefix) => add(drawerTower(w.B, { u0, u1, depth: p.drawerDepth, top: stackTop,
    fronts: [...parseFronts(fronts, [5, 5, 6, 6, 8])].reverse(), shelves: p.towerShelves, label, prefix }));
  const hersB = bank(0, p.bankW, p.hersFronts, "Hers drawers", "HR");
  const centre = centreW >= 10 ? bank(p.bankW, run - p.bankW, p.centerFronts, "Centre · locks", "C") : null;
  const hisB = bank(run - p.bankW, run, p.hisFronts, "His drawers", "HS");

  // press board on the right wall, between the hanging and the drawers
  if (p.pressOn) {
    const lo = p.hangDepth, hi = D - p.drawerDepth - 15;
    const at = Math.min(Math.max(p.pressAt, lo), hi);
    if (hi < lo) warnings.push("There isn't 15\" of free wall between the hanging and the drawers for the press board.");
    else add(pressBoard(w.R, { u0: at, down: p.pressDown }));
  }

  // nook: wall-hung shelves from `nookBottom` up (floor stays open for the hatch), one is the mandir
  const nook = add(shelfStack(w.NB, { u0: 0, u1: NW, depth: ND, bottom: p.nookBottom, top: stackTop,
    count: p.nookShelves, label: "Shelves · mandir" }));
  const mz = nook.shelfZs.reduce((b, z) => Math.abs(z - p.mandirZ) < Math.abs(b - p.mandirZ) ? z : b, nook.shelfZs[0]);
  const mandirShelf = parts.find(q => q.wall === "NB" && q.kind === "shelf" && Math.abs(q.z0 - mz) < 0.01);
  if (mandirShelf) mandirShelf.label = "Mandir";
  parts.push(box(w.NB, "led", PLY + 1, NW - PLY - 1, 0.1, 0.6, mz + PLY + 1, mz + PLY + 13));
  nook.module.sub = `mandir shelf at ${frac(mz + PLY, 8)}`;

  if (p.bandOn) {
    const lab = ["Seasonal", "Long-term, sealed"];
    add(band(w.T,  { u0: 0, u1: W, depth: p.bandDepthTop, levels, labels: lab }));
    add(band(w.R,  { u0: p.hangDepth, u1: D - p.drawerDepth, depth: 12, levels, labels: lab }));
    add(band(w.B,  { u0: 0, u1: run, depth: p.drawerDepth, levels, labels: lab, minZ: stackTop + 1 }));
    add(band(w.NB, { u0: 0, u1: NW, depth: ND, levels, labels: lab, minZ: stackTop + 1 }));
    add(band(w.L,  { u0: ND, u1: L - p.bandDepthTop, depth: 12, levels, labels: lab }));
  }

  // door on the left wall (u runs bottom -> top along it)
  const u0 = L - (p.doorAt + p.doorRO), u1 = L - p.doorAt;
  const door = { wall: "L", u0, u1, slab: p.doorSlab, h: p.doorH, roH: p.doorH + 2.5, swing: p.doorSwing,
    hingeU: p.doorHinge === "top" ? u1 - 1 : u0 + 1, label: "2680" };
  if (p.doorSwing === "in" && p.doorHinge === "top") {
    const leafFace = p.doorAt + 1 - 1.375, clothes = Math.min(12, p.hangDepth / 2) + 9.5;
    if (leafFace < clothes + 0.5) warnings.push(`Opened fully, the door swings back against the clothes on the first ${frac(p.doorSlab, 8)} of the hanging. ` +
      `A door stop at about 80°, or a door that swings out into the bedroom, avoids it.`);
  }
  if (p.doorSwing === "in" && p.doorHinge === "bottom")
    warnings.push("Hinged near the nook, the open door covers the nook shelves and the mandir.");

  const hatches = [{ x0: p.hatchX, y0: p.hatchY, x1: p.hatchX + p.hatchW, y1: p.hatchY + p.hatchD, label: "crawl hatch" }];
  for (const h of hatchClashes(parts, hatches)) warnings.push("Something that stands on the floor covers the crawl-space hatch. Keep that floor open.");
  if (p.band1 < door.roH + 4) warnings.push(`The seasonal shelf (${p.band1}") runs into the door head and casing.`);

  const aisle = D - p.hangDepth - p.drawerDepth;
  const banks = [hisB, centre, hersB].filter(Boolean);
  const nDrawers = banks.reduce((s, b) => s + b.drawers.length, 0), slide = hisB.module.slide;
  return {
    info: INFO, params: p,
    closet: { outline, walls, ceiling: p.ceiling, wallT: t, nbr: [] },
    parts, modules, doors: [door], hatches,
    elevations: ["T", "R", "B", "NB", "L"],
    planDims: [
      { a: [0, 0], b: [W, 0], label: frac(W, 8), off: -(t + 2.3) },
      { a: [W, 0], b: [W, D], label: frac(D, 8), off: -(t + 2.3) },
      { a: [0, 0], b: [0, p.doorAt], label: frac(p.doorAt, 8), off: t + 2.6 },
      { a: [0, p.doorAt], b: [0, p.doorAt + p.doorRO], label: frac(p.doorRO, 8) + " R.O.", off: t + 2.6 },
      { a: [0, p.doorAt + p.doorRO], b: [0, L], label: frac(L - p.doorAt - p.doorRO, 8), off: t + 2.6 },
      { a: [0, L], b: [NW, L], label: frac(NW, 8), off: t + 2.3 },
      { a: [NW, D], b: [W, D], label: frac(run, 8), off: t + 2.3 },
      { a: [p.split, p.hangDepth], b: [p.split, D - p.drawerDepth], label: `aisle ${frac(aisle, 8)}`, off: 0 },
      { a: [W - 3, 0], b: [W - 3, p.hangDepth], label: frac(p.hangDepth, 8), off: 0 },
      { a: [W - 3, D - p.drawerDepth], b: [W - 3, D], label: frac(p.drawerDepth, 8), off: 0 },
    ],
    drawerGroups: banks.map(b => ({ name: b.module.label, drawers: b.drawers })),
    stats: [
      { k: "Hanging", v: `${frac(hang.rodTotal, 8)} of rod`, s: `his ${frac(his, 8)} | hers ${frac(hers, 8)} · rods at ${frac(p.upperRod, 8)} / ${frac(p.lowerRod, 8)}` },
      { k: "Drawers", v: `${nDrawers} × ${slide}" deep`, s: `${p.drawerDepth}" deep wall · ${slide - 1}" inside, front to back` },
      { k: "Aisle", v: frac(aisle, 8), s: "between hanging and drawers" },
      { k: "Upper storage", v: levels.length ? levels.map(z => frac(z, 8)).join(" / ") : "off", s: "seasonal, then long-term sealed" },
    ],
    titleMeta: [
      { k: "Closet", v: `${ftin(W)} × ${ftin(D)} + nook` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "Rod", v: frac(hang.rodTotal, 8) },
      { k: "Drawers", v: `${nDrawers} × ${slide}" deep` },
    ],
    warnings,
  };
}
