// Rohan's closet (Bedroom 2), Concept A: hang across the top wall, drawer tower on the
// left wall, shelves over a free-standing hamper in the alcove, upper band above the door.
// Plan orientation is as drawn on the architect's plan: x to the right, y down the page.
import { hangRun, drawerTower, shelfStack, band, floorItem, collector } from "../model/builders.js";
import { PLY, frac, ftin } from "../lib/units.js";

export const INFO = {
  id: "rohan", name: "Rohan's Closet", room: "Bedroom 2", concept: "Concept A · hang across the top", rev: "Rev A",
};

export const DEFAULTS = {
  closetW: 45, mainD: 52, alcoveW: 25, totalL: 81, ceiling: 120,
  doorAt: 34, doorRO: 28, doorSlab: 26, doorH: 80, hinge: "near",
  hangDepth: 24, rodZ: 70, hatDepth: 14,
  towerDepth: 20, fronts: "6, 7, 8, 8, 9", towerShelves: 2,
  alcoveDepth: 14, alcoveBottom: 30, alcoveShelves: 4,
  hamperW: 16, hamperD: 16, hamperH: 26,
  bandOn: true, band1: 88, band2: 104, bandDepth: 12,
  finish: "oak", lights: true,
};

export const CONTROLS = [
  ["Shell (field-verify)", [
    { key: "closetW", label: "Closet width", min: 36, max: 60, step: 0.5 },
    { key: "mainD", label: "Left wall length", min: 40, max: 64, step: 0.5 },
    { key: "alcoveW", label: "Alcove width", min: 18, max: 36, step: 0.5 },
    { key: "totalL", label: "Door wall length", min: 66, max: 96, step: 0.5 },
    { key: "ceiling", label: "Ceiling", min: 96, max: 132, step: 1, fmt: "ftin" },
  ]],
  ["Door", [
    { key: "doorAt", label: "Opening starts from top wall", min: 0, max: 60, step: 0.5 },
    { key: "doorRO", label: "Rough opening", min: 24, max: 36, step: 0.5 },
    { key: "hinge", label: "Handing", type: "select", options: [["near", "LHO · hinge near top wall"], ["far", "RHO · hinge far side"]] },
  ]],
  ["Hanging", [
    { key: "rodZ", label: "Rod height", min: 60, max: 84, step: 0.5 },
    { key: "hangDepth", label: "Hanging depth", min: 20, max: 28, step: 0.5 },
    { key: "hatDepth", label: "Hat shelf depth", min: 10, max: 16, step: 0.5 },
  ]],
  ["Drawer tower", [
    { key: "towerDepth", label: "Tower depth", min: 14, max: 24, step: 0.5 },
    { key: "fronts", label: "Drawer front heights, top → bottom", type: "text" },
    { key: "towerShelves", label: "Shelves above the counter", min: 0, max: 4, step: 1, fmt: "int" },
  ]],
  ["Alcove", [
    { key: "alcoveBottom", label: "Lowest shelf (hamper below)", min: 20, max: 40, step: 0.5 },
    { key: "alcoveShelves", label: "Shelves", min: 2, max: 6, step: 1, fmt: "int" },
    { key: "alcoveDepth", label: "Shelf depth", min: 10, max: 16, step: 0.5 },
  ]],
  ["Upper storage", [
    { key: "bandOn", label: "Shelves above the door, all walls", type: "check" },
    { key: "band1", label: "First upper shelf", min: 84, max: 100, step: 0.5 },
    { key: "band2", label: "Second upper shelf", min: 96, max: 114, step: 0.5 },
  ]],
  ["Look", [
    { key: "finish", label: "Finish", type: "select", options: [["oak", "White oak"], ["white", "Painted white"], ["walnut", "Walnut"]] },
    { key: "lights", label: "LED strips on", type: "check" },
  ]],
];

export function parseFronts(s, fallback = [6, 7, 8, 8, 9]) {
  const v = String(s).split(/[\s,]+/).map(Number).filter(n => n >= 3 && n <= 16);
  return v.length ? v : fallback;
}

export function build(p) {
  const W = p.closetW, M = p.mainD, A = p.alcoveW, L = p.totalL, nx = W - A, t = 4.5;
  const outline = [[0, 0], [W, 0], [W, L], [nx, L], [nx, M], [0, M]];
  const walls = [
    { id: "T",  name: "Top wall · hanging",   a: [0, 0],  b: [W, 0] },
    { id: "D",  name: "Door wall",            a: [W, 0],  b: [W, L] },
    { id: "E",  name: "Alcove end · shelves", a: [W, L],  b: [nx, L] },
    { id: "N2", name: "Alcove side",          a: [nx, L], b: [nx, M] },
    { id: "N1", name: "Notch face",           a: [nx, M], b: [0, M], hidden: true },
    { id: "L",  name: "Left wall · drawers",  a: [0, M],  b: [0, 0] },
  ];
  const w = Object.fromEntries(walls.map(x => [x.id, x]));
  const levels = p.bandOn ? [p.band1, p.band2] : [];
  const stackTop = p.bandOn ? p.band1 + PLY : 86;
  const { parts, modules, add } = collector();

  const hang = add(hangRun(w.T, { u0: 0, u1: W, depth: p.hangDepth, rodZ: p.rodZ, shelfDepth: p.hatDepth, coatsTo: p.towerDepth }));
  const tower = add(drawerTower(w.L, { u0: 0, u1: M - p.hangDepth, depth: p.towerDepth, top: stackTop,
    fronts: [...parseFronts(p.fronts)].reverse(), shelves: p.towerShelves }));
  add(shelfStack(w.E, { u0: 0, u1: A, depth: p.alcoveDepth, bottom: p.alcoveBottom, top: stackTop, count: p.alcoveShelves }));
  add(floorItem(w.E, "hamper", { u0: (A - p.hamperW) / 2, u1: (A + p.hamperW) / 2, v0: 0.5, v1: 0.5 + p.hamperD, h: p.hamperH, label: "Hamper" }));
  if (p.bandOn) {
    add(band(w.T,  { u0: 0, u1: W, depth: p.hatDepth, levels }));
    add(band(w.L,  { u0: 0, u1: M - p.hatDepth, depth: p.towerDepth, levels, minZ: stackTop + 1 }));
    add(band(w.E,  { u0: 0, u1: A, depth: p.alcoveDepth, levels, minZ: stackTop + 1 }));
    add(band(w.N2, { u0: p.alcoveDepth, u1: L - M, depth: Math.min(p.bandDepth, A - p.bandDepth), levels }));
    add(band(w.D,  { u0: p.hatDepth, u1: L - p.alcoveDepth, depth: p.bandDepth, levels }));
  }

  const door = { wall: "D", u0: p.doorAt, u1: p.doorAt + p.doorRO, slab: p.doorSlab, h: p.doorH, roH: p.doorH + 2.5,
    swing: "out", hingeU: p.hinge === "near" ? p.doorAt + 1 : p.doorAt + p.doorRO - 1,
    label: p.hinge === "near" ? "LHO" : "RHO" };

  const m = tower.module, slide = m.slide, aisle = W - p.towerDepth, openClear = aisle - slide - 1.1;
  const warnings = [];
  if (openClear < 12) warnings.push(`With a drawer pulled all the way out, only ${openClear.toFixed(1)}" of aisle is left. ` +
    `The tower faces the door, so you'd open drawers standing in the doorway. Shorter slides or a shallower tower buy room.`);
  if (p.bandOn && p.band1 < door.roH + 4) warnings.push(`The first upper shelf (${p.band1}") runs into the door head and casing (about ${door.roH + 3.5}").`);
  if (tower.counterZ > stackTop - 12) warnings.push("The drawer stack is so tall there's almost no open shelf left above it.");
  if (p.rodZ - 42 < 4) warnings.push("Long coats will touch the floor at this rod height.");

  const hd = p.hangDepth, rodLen = hang.module.rodLen, n = tower.drawers.length;
  return {
    info: INFO, params: p,
    closet: { outline, walls, ceiling: p.ceiling, wallT: t,
      nbr: [{ x0: 0, y0: M + t, x1: nx - t, y1: L + t, label: "notch" }] },
    parts, modules, doors: [door], hatches: [],
    elevations: ["T", "L", "D", "E", "N2"],
    planDims: [
      { a: [0, 0], b: [W, 0], label: frac(W, 8), off: -(t + 2.3) },
      { a: [0, 0], b: [0, M], label: frac(M, 8), off: t + 2.6 },
      { a: [nx, L], b: [W, L], label: frac(A, 8), off: t + 2.3 },
      { a: [W, 0], b: [W, door.u0], label: frac(door.u0, 8), off: -(t + p.doorSlab + 2.3) },
      { a: [W, door.u0], b: [W, door.u1], label: frac(p.doorRO, 8) + " R.O.", off: -(t + p.doorSlab + 2.3) },
      { a: [W, door.u1], b: [W, L], label: frac(L - door.u1, 8), off: -(t + p.doorSlab + 2.3) },
      { a: [W, 0], b: [W, L], label: frac(L, 8), off: -(t + p.doorSlab + 6.6) },
      { a: [p.towerDepth, hd + 3], b: [W, hd + 3], label: `aisle ${frac(aisle, 8)}`, off: 0 },
      { a: [0, M - 3], b: [p.towerDepth, M - 3], label: frac(p.towerDepth, 8), off: 0 },
      { a: [W - 3, 0], b: [W - 3, hd], label: frac(hd, 8), off: 0 },
    ],
    drawerGroups: [{ name: "Drawer tower", drawers: tower.drawers }],
    stats: [
      { k: "Hanging rod", v: frac(rodLen, 8), s: `one level at ${frac(p.rodZ, 8)} to the rod` },
      { k: "Drawers", v: `${n} × ${slide}" deep`, s: `${slide}" full-extension slides` },
      { k: "Drawer tower", v: `${frac(M - hd, 8)} W × ${frac(p.towerDepth, 8)} D`, s: `counter at ${frac(tower.counterZ, 8)}` },
      { k: "Aisle", v: frac(aisle, 8), s: `${frac(Math.max(0, openClear), 8)} left with a drawer fully open` },
    ],
    titleMeta: [
      { k: "Closet", v: `${ftin(W)} × ${ftin(L)}` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "Rod", v: `${frac(rodLen, 8)} @ ${frac(p.rodZ, 8)}` },
      { k: "Drawers", v: `${n} × ${slide}" deep` },
    ],
    warnings,
  };
}
