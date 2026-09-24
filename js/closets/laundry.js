// Laundry / mudroom, oriented like the field sketch. Sink alcove top-left, washer/dryer alcove
// top-right (behind a 5.3" pier), foyer door on the left wall, garage door on the right wall,
// electrical sub-panel near the right end of the long bottom wall.
// v1: washer + dryer placed, basic plywood shelves, open coat section right of the foyer door,
// shoe shelves, and the code clear space in front of the sub-panel.
import { box, fixedShelves, shelfStack, floorItem, collector } from "../model/builders.js";
import { PLY, frac, ftin } from "../lib/units.js";
import { shelfSlots, shelfControls, readShelves, spacingWarnings, LOOK, PLYWOOD_NOTE } from "./common.js";

export const INFO = { id: "laundry", name: "Laundry / Mudroom", room: "Laundry", concept: "Machines + basic shelves + open coats", rev: "" };

// Field measurements (2026-09-18), sketch orientation.
export const FIELD = {
  sinkW: 62.1, pierT: 5.3, pierLen: 43.8, pierBelow: 13.4, wdW: 59.6,
  leftUpper: 64.2, foyerRO: 32.5, leftLower: 28.9, rightUpper: 47.2, garageRO: 34.3,
  ceiling: 120, sinkCenterFromJamb: 19.9, panelFromCorner: 17.3, panelTop: 85.1, panelBottom: 47,
  washer: { w: 29, d: 32.88, h: 40.75 }, dryer: { w: 29, d: 32.125, h: 40.75, open: 59 },
};

export const DEFAULTS = {
  backClear: 5,
  ...shelfSlots("w", [56, 70, 84, 98], [110]),
  ...shelfSlots("a", [18, 32, 46, 60, 74, 88, 102], [114]),
  alcoveDepth: 16, coatW: 36, coatRod: 66, shoeW: 56, shoeTop: 48,
  showClear: true, facingDepth: 24,
  finish: "white", lights: false,
};

export const CONTROLS = [
  ["Washer / dryer · clearances", [
    { key: "backClear", label: "Space behind the machines", min: 2, max: 8, step: 0.5 },
    { key: "showClear", label: "Dimension the critical clearances in plan", type: "check" },
    { key: "facingDepth", label: "Depth of whatever faces them on the long wall", min: 0, max: 24, step: 0.5 },
  ]],
  shelfControls("w", 5, "Shelves above the machines"),
  shelfControls("a", 8, "Sink alcove shelves (back wall)", [
    { key: "alcoveDepth", label: "Their depth", min: 10, max: 20, step: 0.5 },
  ]),
  ["Coats + shoes (long wall)", [
    { key: "coatW", label: "Open coat section width", min: 24, max: 48, step: 0.5 },
    { key: "coatRod", label: "Coat rod height", min: 60, max: 72, step: 0.5 },
    { key: "shoeW", label: "Shoe shelves width", min: 24, max: 64, step: 0.5 },
    { key: "shoeTop", label: "Shoe shelves height", min: 30, max: 60, step: 0.5 },
  ]],
  LOOK,
];

export function build(p) {
  p = { ...p, ...FIELD };
  const X1 = p.sinkW, X2 = X1 + p.pierT, X3 = X2 + p.wdW;
  const yWD = p.pierLen - p.pierBelow;
  const Yb = p.leftUpper + p.foyerRO + p.leftLower;
  const t = 4.5;
  const outline = [[0, 0], [X1, 0], [X1, p.pierLen], [X2, p.pierLen], [X2, yWD], [X3, yWD], [X3, Yb], [0, Yb]];
  const walls = [
    { id: "SA", name: "Sink alcove · back wall", a: [0, 0], b: [X1, 0] },
    { id: "PL", name: "Pier", a: [X1, 0], b: [X1, p.pierLen], hidden: true },
    { id: "PB", name: "Pier end", a: [X1, p.pierLen], b: [X2, p.pierLen], hidden: true },
    { id: "PR", name: "Pier", a: [X2, p.pierLen], b: [X2, yWD], hidden: true },
    { id: "WD", name: "Washer / dryer wall", a: [X2, yWD], b: [X3, yWD] },
    { id: "R",  name: "Right wall · garage door", a: [X3, yWD], b: [X3, Yb] },
    { id: "B",  name: "Long wall · coats, shoes, panel", a: [X3, Yb], b: [0, Yb], tagU: 0.5 },
    { id: "L",  name: "Left wall · sink, foyer door", a: [0, Yb], b: [0, 0] },
  ];
  const w = Object.fromEntries(walls.map(x => [x.id, x]));
  const { parts, modules, add } = collector();
  const warnings = [];

  // washer (left, by the washer box) and dryer (right, by the vent), with space behind
  const bc = p.backClear, W1 = p.washer, D1 = p.dryer;
  const spare = p.wdW - W1.w - D1.w, side = Math.max(0, spare / 3);
  const wu0 = side, du0 = side * 2 + W1.w;
  add(floorItem(w.WD, "appliance", { u0: wu0, u1: wu0 + W1.w, v0: bc, v1: bc + W1.d, h: W1.h, label: "Washer" }));
  const dr = floorItem(w.WD, "appliance", { u0: du0, u1: du0 + D1.w, v0: bc, v1: bc + D1.d, h: D1.h, label: "Dryer" });
  dr.module.ghost = { u0: du0, u1: du0 + D1.w, v0: bc + D1.d, v1: bc + D1.open, label: "dryer door open" };
  add(dr);
  if (spare < 2) warnings.push(`The two machines take ${W1.w + D1.w}" of the ${frac(p.wdW, 8)} alcove, leaving ${frac(spare, 8)} in total. Re-measure; most installs want about 1" on each side.`);

  const wLv = readShelves(p, "w", 5);
  add(fixedShelves(w.WD, { u0: 0, u1: p.wdW, depth: 14, levels: wLv, label: "Shelves over machines" }));
  if (wLv.length && wLv[0] < W1.h + 10) warnings.push("The lowest shelf over the machines is too close to their tops.");

  // sink alcove: back-wall shelves, utility sink on the left wall at the plumbing
  const aLv = readShelves(p, "a", 8);
  add(fixedShelves(w.SA, { u0: 0, u1: X1, depth: p.alcoveDepth, levels: aLv, label: "Alcove shelves" }));
  const sinkY = p.leftUpper - p.sinkCenterFromJamb, su = Yb - sinkY;
  add(floorItem(w.L, "sink", { u0: su - 12, u1: su + 12, v0: 0, v1: 22, h: 36, label: "Utility sink" }));

  // long wall (u runs from the right corner): sub-panel + code clear space, open coats at the left end, shoes
  const pr1 = p.panelFromCorner, pr0 = Math.max(0, pr1 - 14.5);
  parts.push(box(w.B, "elpanel", pr0, pr1, 0, 4, p.panelBottom, p.panelTop, { mark: true, label: "Sub-panel top" }));
  modules.push(box(w.B, "clear", 0, 30, 0, 36, 0, 0, { label: "Keep clear", sub: "panel, 30 × 36" }));

  const cu1 = X3, cu0 = X3 - p.coatW, cd = 24;           // coats, against the left wall
  parts.push(box(w.B, "carcass", cu0 - PLY, cu0, 0, cd, 0, 110));
  const rodV = 12;
  parts.push(box(w.B, "rod", cu0 + 0.25, cu1 - 0.25, rodV - 0.625, rodV + 0.625, p.coatRod - 0.625, p.coatRod + 0.625, { axis: "u", mark: true, label: "Coat rod" }));
  let g = cu0 + 1.5, k = 0;
  while (g < cu1 - 3) {
    parts.push(box(w.B, "garment", g, g + 2.6, rodV - 10, rodV + 10, p.coatRod - 40 + (k % 3) * 2, p.coatRod - 1.2, { tone: (k * 2) % 7 }));
    g += 3.2; k++;
  }
  add(fixedShelves(w.B, { u0: cu0, u1: cu1, depth: 14, levels: [p.coatRod + 2 + PLY, p.coatRod + 16, p.coatRod + 30], label: "Coat shelves" }));
  modules.push(box(w.B, "coats", cu0, cu1, 0, cd, 0, 0, { label: "Coats · open", sub: `rod at ${frac(p.coatRod, 8)}`, rods: [{ v: rodV }] }));

  const su1 = cu0 - PLY, su0 = Math.max(31, su1 - p.shoeW);
  add(shelfStack(w.B, { u0: su0, u1: su1, depth: 14, bottom: 4, top: p.shoeTop, count: 5, label: "Shoes" }));
  if (su1 - p.shoeW < 30) warnings.push("The shoe shelves reach into the clear space in front of the electrical panel, so I stopped them short.");

  // doors: foyer on the left wall, garage on the right; both assumed to swing in
  const fu0 = Yb - (p.leftUpper + p.foyerRO), fu1 = Yb - p.leftUpper;
  const gu0 = p.rightUpper, gu1 = p.rightUpper + p.garageRO;
  const doors = [
    { wall: "L", u0: fu0, u1: fu1, slab: p.foyerRO - 2.5, h: 80, roH: 82.5, swing: "in", hingeU: fu1 - 1, label: "foyer" },
    { wall: "R", u0: gu0, u1: gu1, slab: p.garageRO - 2.5, h: 80, roH: 82.5, swing: "in", hingeU: gu0 + 1, label: "garage" },
  ];

  // anything standing in the panel's clear space?
  const cz = { x0: X3 - 30, x1: X3, y0: Yb - 36, y1: Yb };
  if (parts.some(q => q.z0 < 1 && q.kind !== "garment" && q.x0 < cz.x1 && q.x1 > cz.x0 && q.y0 < cz.y1 && q.y1 > cz.y0))
    warnings.push("Something stands in the clear space in front of the electrical panel.");
  warnings.push(...spacingWarnings(aLv, "Sink alcove"), ...spacingWarnings(wLv, "Over the machines"));

  // the clearances worth dimensioning: machine depth, the run to the long wall, and the dryer door
  const mFront = yWD + bc + Math.max(W1.d, D1.d), dOpen = yWD + bc + D1.open;
  const xm = du0 + D1.w * 0.35 + X2, xd = du0 + D1.w * 0.75 + X2;
  const gap = Yb - p.facingDepth - dOpen;
  if (p.facingDepth > 0 && gap < 12)
    warnings.push(`A ${frac(p.facingDepth, 8)} cabinet opposite the dryer leaves ${frac(gap, 8)} to its open door. Drop that run to about ${frac(Math.max(0, Yb - dOpen - 16), 8)} deep to keep 16".`);

  const lw = X3;
  return {
    info: INFO, params: p,
    closet: { outline, walls, ceiling: p.ceiling, wallT: t, nbr: [] },
    parts, modules, doors, hatches: [],
    elevations: ["SA", "L", "WD", "R", "B"],
    planDims: [
      { a: [0, 0], b: [X1, 0], label: frac(X1, 8), off: -(t + 2.3) },
      { a: [X2, yWD], b: [X3, yWD], label: frac(p.wdW, 8), off: -(t + 2.3) },
      { a: [0, 0], b: [0, p.leftUpper], label: frac(p.leftUpper, 8), off: t + 2.6 },
      { a: [0, p.leftUpper], b: [0, p.leftUpper + p.foyerRO], label: `${frac(p.foyerRO, 8)} foyer`, off: t + 2.6 },
      { a: [0, p.leftUpper + p.foyerRO], b: [0, Yb], label: frac(p.leftLower, 8), off: t + 2.6 },
      { a: [X3, yWD], b: [X3, yWD + p.rightUpper], label: frac(p.rightUpper, 8), off: -(t + 2.3) },
      { a: [X3, yWD + p.rightUpper], b: [X3, yWD + p.rightUpper + p.garageRO], label: `${frac(p.garageRO, 8)} garage`, off: -(t + 2.3) },
      { a: [0, Yb], b: [X3, Yb], label: `${frac(lw, 8)} (measured 125.9)`, off: t + 2.3 },
      ...(p.showClear ? [
        { a: [xm, yWD], b: [xm, mFront], label: `${frac(D1.d, 8)} machine + ${frac(bc, 8)} behind`, off: 0 },
        { a: [xm, mFront], b: [xm, Yb], label: `${frac(Yb - mFront, 8)} to the long wall`, off: 0 },
        { a: [xd, yWD], b: [xd, dOpen], label: `${frac(D1.open, 8)} dryer door open`, off: 0 },
        ...(p.facingDepth > 0 ? [{ a: [xd, dOpen], b: [xd, Yb - p.facingDepth],
          label: `${frac(Yb - p.facingDepth - dOpen, 8)} past the open door`, off: 0 }] : []),
      ] : []),
    ],
    drawerGroups: [],
    stats: [
      { k: "Washer + dryer", v: `${W1.w + D1.w}" in ${frac(p.wdW, 8)}`, s: `${frac(spare, 8)} to spare · ${frac(bc, 8)} behind` },
      { k: "Machine to long wall", v: frac(Yb - mFront, 8), s: `dryer door open reaches ${frac(dOpen - yWD, 8)} off that wall` },
      { k: "Facing that run", v: p.facingDepth ? frac(p.facingDepth, 8) : "nothing yet", s: p.facingDepth ? `${frac(gap, 8)} between it and the open dryer door` : "" },
      { k: "Coats", v: `${frac(p.coatW, 8)} open`, s: `rod at ${frac(p.coatRod, 8)}, on your right from the foyer` },
      { k: "Shoes", v: `${frac(su1 - su0, 8)} wide`, s: `5 shelves up to ${frac(p.shoeTop, 8)}` },
      { k: "Shelves", v: `${aLv.length} + ${wLv.length}`, s: "sink alcove + over the machines" },
    ],
    titleMeta: [
      { k: "Room", v: `${ftin(X3)} × ${ftin(Yb)}` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "Machines", v: "29\" + 29\"" },
      { k: "Coats", v: frac(p.coatW, 8) },
    ],
    warnings,
    notes: [
      "The open coat section is on your right as you enter from the foyer. It has no doors, so it works as the coat closet.",
      `Electrical sub-panel: code needs a clear space 30" wide × 36" deep in front of it, from the floor to 6'-6" (drawn dashed). Nothing is built there.`,
      `The machines sit ${frac(bc, 8)} off the wall for hoses and the dryer vent. The dryer door needs ${D1.open}" of depth to open (dashed).`,
      "I've assumed both doors swing into the room, hinged on the jamb away from the long wall. Please confirm.",
      "The long wall is drawn from the alcove widths, which add up to 127.0\" against the measured 125.9\". Re-measure.",
      "The 60\"+ shelf spans need a middle support or a deeper front strip (3/4\" × 2-1/4\").",
      PLYWOOD_NOTE,
    ],
  };
}
