// Rohan's closet (Bedroom 2), Concept A: hang across the top wall, drawer tower on the
// left wall, shelves over a free-standing hamper in the alcove, upper band above the door.
// Plan orientation is as drawn on the architect's plan: x to the right, y down the page.
import { hangRun, drawerTower, shelfStack, band, floorItem } from "../model/builders.js";
import { PLY } from "../lib/units.js";

export const INFO = {
  id: "rohan", name: "Rohan's Closet", room: "Bedroom 2", concept: "A · hang across the top",
};

export const DEFAULTS = {
  // shell (approximate, read off the plan; field-verify)
  closetW: 45, mainD: 52, alcoveW: 25, totalL: 81, ceiling: 120,
  // door on the door wall; hinge "near" = jamb nearer the top wall (LHO), "far" = RHO
  doorAt: 34, doorRO: 28, doorSlab: 26, doorH: 80, hinge: "near",
  // hanging
  hangDepth: 24, rodZ: 70, hatDepth: 14,
  // drawer tower (fronts listed top -> bottom)
  towerDepth: 20, fronts: "6, 7, 8, 8, 9", towerShelves: 2,
  // alcove shelves + hamper
  alcoveDepth: 14, alcoveBottom: 30, alcoveShelves: 4,
  hamperW: 16, hamperD: 16, hamperH: 26,
  // upper band
  bandOn: true, band1: 88, band2: 104, bandDepth: 12,
  // look
  finish: "oak", lights: true,
};

export function parseFronts(s) {
  const v = String(s).split(/[\s,]+/).map(Number).filter(n => n >= 3 && n <= 16);
  return v.length ? v : [6, 7, 8, 8, 9];
}

export function build(p) {
  const W = p.closetW, M = p.mainD, A = p.alcoveW, L = p.totalL, nx = W - A;
  const outline = [[0, 0], [W, 0], [W, L], [nx, L], [nx, M], [0, M]];
  const walls = [
    { id: "T",  name: "Top wall · hanging",      a: [0, 0],  b: [W, 0] },
    { id: "D",  name: "Door wall",               a: [W, 0],  b: [W, L] },
    { id: "E",  name: "Alcove end · shelves",    a: [W, L],  b: [nx, L] },
    { id: "N2", name: "Alcove side",             a: [nx, L], b: [nx, M] },
    { id: "N1", name: "Notch face",              a: [nx, M], b: [0, M] },
    { id: "L",  name: "Left wall · drawers",     a: [0, M],  b: [0, 0] },
  ];
  const w = Object.fromEntries(walls.map(x => [x.id, x]));
  const frontsTopDown = parseFronts(p.fronts);
  const levels = p.bandOn ? [p.band1, p.band2] : [];
  const stackTop = p.bandOn ? p.band1 + PLY : 86;   // tower + alcove stack meet the first band level

  const parts = [], modules = [];
  const add = r => { parts.push(...r.parts); modules.push(r.module); return r; };

  const hang = add(hangRun(w.T, { u0: 0, u1: W, depth: p.hangDepth, rodZ: p.rodZ,
    shelfDepth: p.hatDepth, coatsTo: p.towerDepth }));
  const tower = add(drawerTower(w.L, { u0: 0, u1: M - p.hangDepth, depth: p.towerDepth, top: stackTop,
    fronts: [...frontsTopDown].reverse(), shelves: p.towerShelves }));
  add(shelfStack(w.E, { u0: 0, u1: A, depth: p.alcoveDepth, bottom: p.alcoveBottom,
    top: stackTop, count: p.alcoveShelves }));
  add(floorItem(w.E, "hamper", { u0: (A - p.hamperW) / 2, u1: (A + p.hamperW) / 2,
    v0: 0.5, v1: 0.5 + p.hamperD, h: p.hamperH, label: "Hamper" }));

  if (p.bandOn) {
    add(band(w.T,  { u0: 0, u1: W, depth: p.hatDepth, levels }));
    add(band(w.L,  { u0: 0, u1: M - p.hatDepth, depth: p.towerDepth, levels, minZ: stackTop + 1 }));
    add(band(w.E,  { u0: 0, u1: A, depth: p.alcoveDepth, levels, minZ: stackTop + 1 }));
    add(band(w.N2, { u0: p.alcoveDepth, u1: L - M, depth: Math.min(p.bandDepth, A - p.bandDepth), levels }));
    add(band(w.D,  { u0: p.hatDepth, u1: L - p.alcoveDepth, depth: p.bandDepth, levels }));
  }

  const door = { wall: "D", u0: p.doorAt, u1: p.doorAt + p.doorRO, slab: p.doorSlab,
    h: p.doorH, roH: p.doorH + 2.5, hinge: p.hinge,
    hingeU: p.hinge === "near" ? p.doorAt + 1 : p.doorAt + p.doorRO - 1 };

  const aisle = W - p.towerDepth;
  const slide = tower.module.slide;
  const openClear = aisle - slide - 1.1;
  const warnings = [];
  if (openClear < 12) warnings.push(`With a drawer pulled all the way out, only ${openClear.toFixed(1)}" of aisle is left. ` +
    `The tower faces the door, so you'd open drawers standing in the doorway. Shorter slides or a shallower tower buy room.`);
  if (p.bandOn && p.band1 < door.roH + 4) warnings.push(`The first upper shelf (${p.band1}") runs into the door head and casing (about ${door.roH + 3.5}").`);
  if (tower.counterZ > stackTop - 12) warnings.push("The drawer stack is so tall there's almost no open shelf left above it.");
  if (p.rodZ - 42 < 4) warnings.push("Long coats will touch the floor at this rod height.");

  return {
    info: INFO, params: p,
    closet: { W, M, A, L, nx, outline, walls, ceiling: p.ceiling, wallT: 4.5 },
    parts, modules, door, drawers: tower.drawers,
    metrics: { rodLen: hang.module.rodLen, rodZ: p.rodZ, aisle, slide, openClear,
      towerW: M - p.hangDepth, towerDepth: p.towerDepth, counterZ: tower.counterZ,
      stackTop, alcoveShelves: p.alcoveShelves, levels, warnings },
  };
}
