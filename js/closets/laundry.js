// Laundry / mudroom, oriented like the field sketch. Sink alcove top-left, washer/dryer alcove
// top-right (behind a 5.3" pier), foyer door on the left wall, garage door on the right wall,
// electrical sub-panel near the right end of the long bottom wall.
// v1: washer + dryer placed, basic plywood shelves, open coat section right of the foyer door,
// shoe shelves, and the code clear space in front of the sub-panel.
import { box, esRun, floorItem, collector, packStock, packStock as pack } from "../model/builders.js";
import { PLY, frac, ftin } from "../lib/units.js";
import { parseFronts } from "./rohan.js";
import { LOOK } from "./common.js";

export const INFO = { id: "laundry", name: "Laundry / Mudroom", room: "Laundry", stuff: "laundry", concept: "Corner closet + coat run + machines", rev: "" };

// Field measurements (2026-09-18), sketch orientation.
export const FIELD = {
  sinkW: 62.1, pierT: 5.3, pierLen: 43.8, pierBelow: 13.4, wdW: 59.6,
  leftUpper: 64.2, foyerRO: 32.5, leftLower: 28.9, rightUpper: 47.2, garageRO: 34.3,
  ceiling: 120, sinkCenterFromJamb: 19.9, panelFromCorner: 17.3, panelTop: 85.1, panelBottom: 47,
  washer: { w: 29, d: 32.88, h: 40.75 }, dryer: { w: 29, d: 32.125, h: 40.75, open: 59 },
};

export const DEFAULTS = {
  backClear: 5, showClear: true,
  baseDepth: 24, counterZ: 36, sinkBay: 30,
  upperDepth: 15, upperBottom: 54, upperTop: 90,
  wdUpperBottom: 56, wdUpperTop: 92,
  coatW: 48, coatRod: 66, coatFronts: "10, 11, 12", coatDoors: false,
  facingDepth: 15,
  finish: "white", lights: false,
};

export const CONTROLS = [
  ["Washer / dryer · clearances", [
    { key: "backClear", label: "Space behind the machines", min: 2, max: 8, step: 0.5 },
    { key: "showClear", label: "Dimension the critical clearances in plan", type: "check" },
  ]],
  ["Corner closet · wall A right + wall D left", [
    { key: "baseDepth", label: "Base cabinets + counter, depth", min: 18, max: 24, step: 0.5 },
    { key: "counterZ", label: "Counter height", min: 34, max: 38, step: 0.25 },
    { key: "sinkBay", label: "Open bay for the sink", min: 24, max: 36, step: 1 },
    { key: "upperDepth", label: "Uppers, depth", min: 12, max: 18, step: 1.5 },
    { key: "upperBottom", label: "Uppers, bottom", min: 48, max: 60, step: 1 },
    { key: "upperTop", label: "Uppers, top", min: 80, max: 96, step: 1 },
  ]],
  ["Wall D right · over the machines", [
    { key: "wdUpperBottom", label: "Bottom", min: 46, max: 64, step: 1 },
    { key: "wdUpperTop", label: "Top", min: 80, max: 96, step: 1 },
  ]],
  ["Wall B right · coat closet", [
    { key: "coatW", label: "Width", min: 30, max: 72, step: 1 },
    { key: "coatRod", label: "Rod height", min: 54, max: 78, step: 1 },
    { key: "coatFronts", label: "Drawer fronts under it, top → bottom", type: "text" },
    { key: "coatDoors", label: "Doors on it", type: "check" },
  ]],
  ["Wall B left · facing the machines", [
    { key: "facingDepth", label: "Depth (0 = leave it open)", min: 0, max: 24, step: 1.5 },
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

  // ---------- corner closet: an L of base cabinets under a counter on wall A right and
  // wall D left, with uppers over both. The A run owns the corner; D starts clear of it.
  const bd = p.baseDepth, cz = p.counterZ, ud = p.upperDepth;
  const runs = [];
  const run = (wall, u0, u1, o) => {
    const wd = pack(u1 - u0);
    if (!wd.length) return { drawers: [] };
    runs.push({ wall: wall.id, u0, u1, wd, fill: (u1 - u0) - wd.reduce((a, b) => a + b, 0), ...o });
    return add(esRun(wall, { u0, depth: o.depth, z0: o.z0 || 0, top: o.top, doors: o.doors !== false,
      bays: wd.map(x => ({ w: x, levels: o.levels, fronts: o.fronts, rods: o.rods })), prefix: o.prefix, seed: o.seed }));
  };

  const aU0 = Yb - p.leftUpper;                                   // the foyer jamb, start of wall A right
  const sinkU = Yb - (p.leftUpper - p.sinkCenterFromJamb);        // where the plumbing is
  const sb0 = Math.max(aU0, sinkU - p.sinkBay / 2), sb1 = sb0 + p.sinkBay;
  run(w.L, sb1, Yb, { depth: bd, top: cz - 1.25, levels: [cz / 2], prefix: "A", seed: 3 });
  run(w.L, sb0, sb1, { depth: bd, top: cz - 1.25, levels: [], prefix: "S", seed: 5 });   // sink base: no shelf, the trap lives there
  run(w.SA, bd, X1, { depth: bd, top: cz - 1.25, levels: [cz / 2], prefix: "D", seed: 7 });
  parts.push(box(w.L, "counter", aU0, Yb, 0, bd + 1, cz - 1.25, cz, { mark: true, label: "Counter" }));
  parts.push(box(w.SA, "counter", bd, X1, 0, bd + 1, cz - 1.25, cz));
  modules.push(box(w.L, "counter", aU0, Yb, 0, bd, 0, 0, { label: "Corner closet", sub: `counter at ${frac(cz, 8)}` }));
  parts.push(box(w.L, "sink", sb0 + 3, sb1 - 3, 2.5, bd - 2.5, cz - 9, cz, { mark: true, label: "Sink, drops into the counter" }));
  modules.push(box(w.L, "sink", sb0, sb1, 0, bd, 0, 0, { label: "Sink base", sub: `${frac(p.sinkBay, 8)}, detergent under` }));

  run(w.L, aU0, Yb, { depth: ud, z0: p.upperBottom, top: p.upperTop, levels: [p.upperBottom + 13, p.upperBottom + 26], prefix: "AU", seed: 11 });
  run(w.SA, ud, X1, { depth: ud, z0: p.upperBottom, top: p.upperTop, levels: [p.upperBottom + 13, p.upperBottom + 26], prefix: "DU", seed: 13 });

  // ---------- wall D right: uppers only, over the machines
  run(w.WD, 0, p.wdW, { depth: ud, z0: p.wdUpperBottom, top: p.wdUpperTop, levels: [p.wdUpperBottom + 13], prefix: "W", seed: 17 });
  if (p.wdUpperBottom < W1.h + 12) warnings.push(`The uppers over the machines start at ${frac(p.wdUpperBottom, 8)}, only ${frac(p.wdUpperBottom - W1.h, 8)} above them. Leave about 12" to load them.`);

  // ---------- long wall. u runs from the garage corner, so the coat run is at the foyer end.
  const clearU = 30;                                              // code clear space at the panel
  const pr1 = p.panelFromCorner, pr0 = Math.max(0, pr1 - 14.5);
  parts.push(box(w.B, "elpanel", pr0, pr1, 0, 4, p.panelBottom, p.panelTop, { mark: true, label: "Sub-panel top" }));
  modules.push(box(w.B, "clear", 0, clearU, 0, 36, 0, 0, { label: "Keep clear", sub: "panel, 30 × 36" }));

  const coat0 = Yb - p.coatW;                                     // wall B right: the coat closet
  const coatFronts = [...parseFronts(p.coatFronts, [6, 7, 8])].reverse();
  const coats = run(w.B, coat0, Yb, { depth: 24, top: 96, doors: p.coatDoors, fronts: coatFronts,
    rods: [p.coatRod], levels: [p.coatRod + 14], prefix: "C", seed: 21 });
  if (p.coatRod < coatFronts.reduce((a, b) => a + b, 0) + 40)
    warnings.push(`The coat rod at ${frac(p.coatRod, 8)} leaves ${frac(p.coatRod - coatFronts.reduce((a, b) => a + b, 0), 8)} of hanging over the drawers. A jacket wants about 40".`);

  if (p.facingDepth > 0) {   // start it so the boxes butt the coat closet; the filler lands at the panel end
    const bw = packStock(coat0 - clearU).reduce((a, b) => a + b, 0);
    run(w.B, coat0 - bw, coat0, { depth: p.facingDepth, top: 96, levels: [20, 34, 48, 62, 76], prefix: "B", seed: 25 });
  }

  // doors: foyer on the left wall, garage on the right; both assumed to swing in
  const fu0 = Yb - (p.leftUpper + p.foyerRO), fu1 = Yb - p.leftUpper;
  const gu0 = p.rightUpper, gu1 = p.rightUpper + p.garageRO;
  const doors = [
    { wall: "L", u0: fu0, u1: fu1, slab: p.foyerRO - 2.5, h: 96, roH: 98.5, swing: "in", hingeU: fu1 - 1, label: "foyer" },
    { wall: "R", u0: gu0, u1: gu1, slab: p.garageRO - 2.5, h: 96, roH: 98.5, swing: "out", hingeU: gu0 + 1, label: "garage, out" },
  ];

  // anything standing in the panel's clear space?
  const keep = { x0: X3 - 30, x1: X3, y0: Yb - 36, y1: Yb };
  if (parts.some(q => q.z0 < 1 && q.kind !== "garment" && q.x0 < keep.x1 && q.x1 > keep.x0 && q.y0 < keep.y1 && q.y1 > keep.y0))
    warnings.push("Something stands in the clear space in front of the electrical panel.");

  // the clearances worth dimensioning: machine depth, the run to the long wall, and the dryer door
  const mDepth = Math.max(W1.d, D1.d), mFront = yWD + bc + mDepth, dOpen = yWD + bc + D1.open;
  const xw = X2 + wu0;                       // the washer: the only machine a cabinet faces
  const x1 = xw + W1.w * 0.22, x2 = xw + W1.w * 0.52, x3 = xw + W1.w * 0.82;
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
        { a: [x1, yWD], b: [x1, mFront], label: `${frac(mDepth, 8)} machine + ${frac(bc, 8)} behind`, off: 0 },
        { a: [x2, mFront], b: [x2, Yb], label: `${frac(Yb - mFront, 8)} machine face to the long wall`, off: 0 },
        { a: [x3, yWD], b: [x3, dOpen], label: `${frac(D1.open, 8)} machine door open`, off: 0 },
        ...(p.facingDepth > 0 ? [{ a: [x3, dOpen], b: [x3, Yb - p.facingDepth],
          label: `${frac(Yb - p.facingDepth - dOpen, 8)} open door to the cabinet`, off: 0 }] : []),
      ] : []),
    ],
    drawerGroups: [],
    stats: [
      { k: "Washer + dryer", v: `${W1.w + D1.w}" in ${frac(p.wdW, 8)}`, s: `${frac(spare, 8)} to spare · ${frac(bc, 8)} behind` },
      { k: "Machine to long wall", v: frac(Yb - mFront, 8), s: `dryer door open reaches ${frac(dOpen - yWD, 8)} off that wall` },
      { k: "Facing that run", v: p.facingDepth ? frac(p.facingDepth, 8) : "nothing yet", s: p.facingDepth ? `${frac(gap, 8)} between it and the open dryer door` : "" },
      { k: "Corner closet", v: `${frac(p.leftUpper, 8)} + ${frac(X1 - bd, 8)}`, s: `${frac(bd, 8)} base + counter at ${frac(cz, 8)}, ${frac(ud, 8)} uppers` },
      { k: "Coat closet", v: `${frac(p.coatW, 8)} × 24" deep`, s: `rod at ${frac(p.coatRod, 8)}, ${coatFronts.length} drawers under it` },
      { k: "Wall B left", v: p.facingDepth ? `${frac(coat0 - clearU, 8)} × ${frac(p.facingDepth, 8)}` : "open", s: `${frac(gap, 8)} from an open machine door` },
      { k: "Filler in total", v: frac(runs.reduce((a, r) => a + r.fill, 0), 8), s: `${runs.length} runs of stock-width boxes` },
    ],
    titleMeta: [
      { k: "Room", v: `${ftin(X3)} × ${ftin(Yb)}` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "Machines", v: "29\" + 29\"" },
      { k: "Coats", v: frac(p.coatW, 8) },
    ],
    warnings,
    notes: [
      `Wall A right and wall D left are one L-shaped corner closet: ${frac(bd, 8)} base cabinets under a counter at ${frac(cz, 8)}, with ${frac(ud, 8)} uppers from ${frac(p.upperBottom, 8)} to ${frac(p.upperTop, 8)} over both. The A run owns the inside corner; the D run starts ${frac(bd, 8)} clear of it so the two don't collide.`,
      `The sink drops into the counter over a ${frac(p.sinkBay, 8)} base cabinet, ${frac(p.sinkCenterFromJamb, 8)} off the foyer jamb. No shelf in that one - the trap needs the room - so it takes tall bottles standing up.`,
      `Wall B right is the coat closet - 24" deep, rod at ${frac(p.coatRod, 8)}, ${coatFronts.length} drawers under it, on your right as you come in from the foyer.`,
      `Wall B left can only be ${frac(coat0 - clearU, 8)} wide: the sub-panel's 30" x 36" code clear space takes the garage corner, and that is exactly the stretch facing the dryer. What is left faces the washer.`,
      `Depth there is set by the machine doors, not the aisle. An open door reaches ${frac(D1.open, 8)} off the machine wall; at ${frac(p.facingDepth, 8)} deep you keep ${frac(gap, 8)} in front of it. 24" would leave ${frac(Yb - 24 - dOpen, 8)}.`,
      `Wall C has nothing on it - that is the garage door wall.`,
      `The machines sit ${frac(bc, 8)} off the wall for hoses and the vent.`,
      `Two 29" machines in a ${frac(p.wdW, 8)} alcove leave ${frac(spare, 8)} in total. Re-measure before ordering.`,
      "The garage door swings out into the garage, so it never takes room off the walkway on this side. The foyer door is assumed to swing in - please confirm.",
      `The long wall comes to ${frac(lw, 8)} from the alcove widths against ${frac(125.9, 8)} measured. Re-measure.`,
    ],
  };
}
