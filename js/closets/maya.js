// Maya's reach-in: an East Star box at each end (drawers, rod above them, open shelf above that,
// no doors) with site-built plywood shelves filling the middle. The middle's lowest shelf sits
// high enough for a laundry basket. Above the cabinets, a plywood deck and one long shelf on
// dividers use the 26" that a 94" box leaves under the 10' ceiling. 3-panel sliding doors.
import { box, esRun, fixedShelves, collector } from "../model/builders.js";
import { PLY, frac, ftin } from "../lib/units.js";
import { parseFronts } from "./rohan.js";
import { shelfSlots, shelfControls, readShelves, spacingWarnings, LOOK } from "./common.js";
import { ES_WIDTHS } from "./master.js";

export const INFO = { id: "maya", name: "Maya's Closet", room: "Maya's room",
  concept: "East Star ends + plywood middle", rev: "" };

export const FIELD = { W: 112.4, D: 29.8, ceiling: 120, stubL: 8.6, opening: 95.8, stubR: 8.1, wallAtOpening: 6.3, doorH: 96 };

export const DEFAULTS = {
  esW: 36, esTop: 94, depth: 24, fronts: "7, 8, 9", rodZ: 62, esShelf: 78,
  ...shelfSlots("s", [30, 44, 58, 72, 86], [16, 94]),
  divider: true, aboveOn: false, aboveZ: 107, maxBay: 20, drawersOut: false,
  finish: "white", lights: true,
};

export const CONTROLS = [
  ["East Star boxes · one at each end", [
    { key: "esW", label: "Width", type: "select", options: ES_WIDTHS.map(v => [String(v), `${v}"`]) },
    { key: "esTop", label: "Height", type: "select", options: [["84", "84\""], ["94", "94\""]] },
    { key: "depth", label: "Depth (whole closet)", min: 15.5, max: 24, step: 0.5 },
    { key: "rodZ", label: "Rod height (moves up as she grows)", min: 40, max: 80, step: 0.5 },
    { key: "fronts", label: "Drawer fronts, top → bottom", type: "text" },
    { key: "esShelf", label: "Shelf above the rod", min: 60, max: 92, step: 1 },
    { key: "drawersOut", label: "Show the drawers open", type: "check" },
  ]],
  shelfControls("s", 7, "Middle · plywood shelves", [
    { key: "divider", label: "Centre divider (halves the span)", type: "check" },
  ]),
  ["Plywood above the cabinets", [
    { key: "aboveOn", label: "Deck and one long shelf (above the header - see the note)", type: "check" },
    { key: "aboveZ", label: "Its height", min: 100, max: 116, step: 1 },
    { key: "maxBay", label: "Widest bay between dividers", min: 14, max: 30, step: 1 },
  ]],
  LOOK,
];

export function build(p) {
  p = { ...p, ...FIELD };
  const W = p.W, D = p.D, t = 4.5, d = p.depth, top = +p.esTop, ew = +p.esW;
  const outline = [[0, 0], [W, 0], [W, D], [0, D]];
  const walls = [
    { id: "T", name: "Back wall", a: [0, 0], b: [W, 0] },
    { id: "R", name: "Right end", a: [W, 0], b: [W, D] },
    { id: "F", name: "Door wall", a: [W, D], b: [0, D], hidden: true },
    { id: "L", name: "Left end", a: [0, D], b: [0, 0] },
  ];
  const w = Object.fromEntries(walls.map(x => [x.id, x]));
  const { parts, modules, add } = collector();
  const warnings = [];
  const m0 = ew, m1 = W - ew, mid = m1 - m0;          // the plywood middle
  const fronts = [...parseFronts(p.fronts, [7, 8, 9])].reverse();
  const bay = { w: ew, fronts, rods: [p.rodZ], levels: [p.esShelf] };

  const es1 = add(esRun(w.T, { u0: 0, depth: d, top, doors: false, drawersOut: p.drawersOut, bays: [{ ...bay, label: "East Star · left" }], prefix: "L", seed: 5 }));
  const es2 = add(esRun(w.T, { u0: m1, depth: d, top, doors: false, drawersOut: p.drawersOut, bays: [{ ...bay, label: "East Star · right" }], prefix: "R", seed: 11 }));

  // middle: plywood shelves on cleats, the lowest one left high for a laundry basket
  const lv = readShelves(p, "s", 7);
  const cx = (m0 + m1) / 2;
  if (p.divider) parts.push(box(w.T, "carcass", cx - PLY / 2, cx + PLY / 2, 0, d, 0, top, { mark: true, label: "Centre divider" }));
  if (p.divider) for (const [a, b] of [[m0, cx - PLY / 2], [cx + PLY / 2, m1]])
    add(fixedShelves(w.T, { u0: a, u1: b, depth: d, levels: lv, label: "Middle shelves" }));
  else add(fixedShelves(w.T, { u0: m0, u1: m1, depth: d, levels: lv, label: "Middle shelves" }));
  const span = p.divider ? (mid - PLY) / 2 : mid;
  const basket = lv.length ? lv[0] - PLY - 1.5 : top;

  // above the cabinets: a deck on their tops, dividers, one long shelf
  const deck = top + PLY;
  let nDiv = 0;
  if (p.aboveOn) {
    const n = Math.max(1, Math.ceil(W / p.maxBay));
    nDiv = n - 1;
    parts.push(box(w.T, "cleat", 0, W, 0, PLY, top - 1.5, top));
    parts.push(box(w.T, "shelf", 0, W, 0, d, top, deck, { mark: true, label: "Deck over the cabinets" }));
    for (let i = 0; i <= n; i++) {
      const u = Math.min(Math.max(W * i / n, PLY / 2), W - PLY / 2);
      parts.push(box(w.T, "carcass", u - PLY / 2, u + PLY / 2, 0, d, deck, p.aboveZ));
    }
    parts.push(box(w.T, "cleat", 0, W, 0, PLY, p.aboveZ - 1.5, p.aboveZ));
    parts.push(box(w.T, "shelf", 0, W, 0, d, p.aboveZ, p.aboveZ + PLY, { mark: true, label: "Long shelf" }));
    modules.push(box(w.T, "band", 0, W, 0, d, { label: "Plywood above", sub: `deck ${frac(deck, 8)}, shelf ${frac(p.aboveZ, 8)}` }));
  }

  const u0 = W - (p.stubL + p.opening), u1 = W - p.stubL;
  const door = { wall: "F", u0, u1, slab: p.opening / 3 + 1, h: p.doorH, roH: p.doorH + 2.5, swing: "slide", panels: 3, hingeU: u0, label: "3-track slider" };

  if (mid < 18) warnings.push(`The middle is only ${frac(mid, 8)} wide. Use narrower East Star boxes.`);
  if (span > 36) warnings.push(`The middle shelves span ${frac(span, 8)}. Past about 36" a 3/4" plywood shelf sags; turn the centre divider on.`);
  if (basket < 24) warnings.push(`Only ${frac(basket, 8)} under the lowest middle shelf. A tall hamper wants about 28".`);
  const high = [...lv.filter(z => z > p.doorH - 2), ...(p.aboveOn ? [deck, p.aboveZ] : []), ...(p.esShelf > p.doorH - 2 ? [p.esShelf] : [])];
  if (high.length) warnings.push(`This is a reach-in, so the ${frac(p.doorH, 8)} header is the ceiling as far as your arms are concerned. ${high.map(z => frac(z, 8)).join(", ")} sit above it and can't be reached: there is ${frac(p.ceiling - p.doorH, 8)} of wall in the way.`);
  if (d > D - 5) warnings.push(`At ${frac(d, 8)} deep there is only ${frac(D - d, 8)} in front of the boxes. A 3-track slider needs about 5".`);
  warnings.push(...spacingWarnings(lv, "Middle shelves"));

  const drawers = [...es1.drawers, ...es2.drawers];
  return {
    info: INFO, params: p,
    closet: { outline, walls, ceiling: p.ceiling, wallT: t, nbr: [] },
    parts, modules, doors: [door], hatches: [],
    elevations: ["T", "L", "R"],
    planDims: [
      { a: [0, 0], b: [W, 0], label: frac(W, 8), off: -(t + 2.3) },
      { a: [W, 0], b: [W, D], label: frac(D, 8), off: -(t + 2.3) },
      { a: [0, 0], b: [0, 0], label: "", off: 0 },
      { a: [m0, 0], b: [m1, 0], label: `middle ${frac(mid, 8)}`, off: -(t + 6.6) },
      { a: [p.stubL, D], b: [p.stubL + p.opening, D], label: `${frac(p.opening, 8)} opening`, off: t + 2.3 },
    ],
    drawerGroups: [{ name: "East Star drawers", drawers }],
    stats: [
      { k: "Layout", v: `${ew}" + ${frac(mid, 8)} + ${ew}"`, s: `East Star ends, plywood middle, all ${frac(d, 8)} deep` },
      { k: "Rods", v: `2 × ${frac(ew - 1.5, 8)}`, s: `at ${frac(p.rodZ, 8)}, ${fronts.length} drawers under each` },
      { k: "Middle shelves", v: `${lv.length} × ${frac(span, 8)} span`, s: p.divider ? "centre divider halves the span" : "no divider" },
      { k: "Under the lowest shelf", v: frac(basket, 8), s: "clear at the cleats, for a laundry basket" },
      { k: "Above the cabinets", v: p.aboveOn ? `shelf at ${frac(p.aboveZ, 8)}` : "off", s: p.aboveOn ? `deck at ${frac(deck, 8)}, ${nDiv} dividers` : "" },
    ],
    titleMeta: [
      { k: "Closet", v: `${ftin(W)} × ${ftin(D)}` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "Middle", v: frac(mid, 8) },
      { k: "Drawers", v: `${drawers.length}` },
    ],
    gcText: [
      `MAYA'S CLOSET - ${frac(W, 8)} wide, everything ${frac(d, 8)} deep.`,
      `EAST STAR: one ${ew}" x ${frac(top, 8)} box at each end, NO doors. Each: ${fronts.length} drawers at the bottom (${fronts.slice().reverse().join(", ")}" fronts, top down), rod at ${frac(p.rodZ, 8)}, shelf at ${frac(p.esShelf, 8)}, open above. Floor-standing, screwed through the back into studs.`,
      `AMIR: middle ${frac(mid, 8)}, 3/4" birch ply shelves at ${lv.map(z => frac(z, 8)).join(", ")} on 1x2 cleats${p.divider ? `, plus one 3/4" ply divider down its centre, floor to ${frac(top, 8)}` : ""}.`,
      `Nothing below ${frac(lv[0] || 0, 8)} in the middle - ${frac(basket, 8)} clear for laundry baskets.`,
      `Paint room colour, all sides.`,
    ].join("\n"),
    warnings,
    notes: [
      `East Star only makes ${ES_WIDTHS.join(", ")}" wide, so the ends are ${ew}" and the plywood middle takes whatever is left - here ${frac(mid, 8)}.`,
      `The boxes stop at ${frac(d, 8)} deep because that is East Star's maximum. The ${frac(D - d, 8)} left in front is not wasted: a 3-track slider needs about 5" for its tracks.`,
      `A 3/4" plywood shelf spanning ${frac(mid, 8)} sags about 1/8" loaded. The centre divider brings it to ${frac(span, 8)}, where it is a hundredth of an inch.`,
      `Bought boxes show as white oak in the 3D, site-built plywood in the finish you pick, so it is easy to see which is which.`,
      `The rod starts at ${frac(p.rodZ, 8)} for now and moves up as she grows - it is a slider in the panel, and the box has holes the whole way up.`,
      `The opening is ${frac(p.doorH, 8)} tall in a ${ftin(p.ceiling)} room, so ${frac(p.ceiling - p.doorH, 8)} of wall sits above it. A ${frac(top, 8)} box already uses every inch you can reach through the opening; anything higher is behind that wall. That is why the deck and long shelf are off here, and on in the master, which you walk into.`,
    ],
  };
}
