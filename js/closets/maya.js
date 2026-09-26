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
  concept: "East Star in the middle + plywood ends", rev: "" };

export const FIELD = { W: 112.4, D: 29.8, ceiling: 120, stubL: 8.6, opening: 95.8, stubR: 8.1, wallAtOpening: 6.3, doorH: 96 };

export const DEFAULTS = {
  esPlan: "36, 36", esTop: 84, depth: 24, fronts: "10, 11, 12", rodZ: 62, esShelf: 78,
  ...shelfSlots("s", [30, 46, 62, 78], [16, 86]),
  aboveOn: true, aboveZ: 92, topBay: 20, drawersOut: false,
  finish: "white", lights: true,
};

export const CONTROLS = [
  ["East Star · in the middle, clear of the door frames", [
    { key: "esPlan", label: "Box widths", type: "text" },
    { key: "esTop", label: "Height", type: "select", options: [["84", "84\""], ["90", "90\""], ["94", "94\""]] },
    { key: "depth", label: "Depth (whole closet)", min: 15.5, max: 24, step: 0.5 },
    { key: "rodZ", label: "Rod height (moves up as she grows)", min: 40, max: 80, step: 0.5 },
    { key: "fronts", label: "Drawer fronts, top → bottom", type: "text" },
    { key: "esShelf", label: "Shelf above the rod", min: 60, max: 92, step: 1 },
    { key: "drawersOut", label: "Show the drawers open", type: "check" },
  ]],
  shelfControls("s", 6, "Plywood shelves · both ends"),
  ["Plywood over the boxes", [
    { key: "aboveOn", label: "One shelf right across, over the boxes", type: "check" },
    { key: "aboveZ", label: "Its height", min: 80, max: 100, step: 1 },
    { key: "topBay", label: "Widest bay between its posts", min: 14, max: 36, step: 1 },
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
  // East Star sits centred, well clear of both door-frame stubs, so a drawer front never
  // has a stub wall to hit on the way out. The plywood shelves take the ends.
  const STOCK = [15, 18, 21, 24, 30, 36];
  const esW = String(p.esPlan).split(/[,\s]+/).map(Number).filter(x => STOCK.includes(x));
  const esRun0 = esW.reduce((a, b) => a + b, 0);
  const m0 = (W - esRun0) / 2, m1 = m0 + esRun0;
  const fronts = [...parseFronts(p.fronts, [7, 8, 9])].reverse();
  const es = add(esRun(w.T, { u0: m0, depth: d, top, doors: false, drawersOut: p.drawersOut, prefix: "M", seed: 5,
    bays: esW.map(width => ({ w: width, fronts, rods: [p.rodZ], levels: [p.esShelf] })) }));

  // plywood shelves at each end, on 1x2 cleats into the studs
  const lv = readShelves(p, "s", 6);
  add(fixedShelves(w.T, { u0: 0, u1: m0, depth: d, levels: lv, label: "Shelves · left end" }));
  add(fixedShelves(w.T, { u0: m1, u1: W, depth: d, levels: lv, label: "Shelves · right end" }));
  const basket = lv.length ? lv[0] - PLY - 1.5 : top;

  // One plywood shelf right across, over the boxes. On its own it spans the whole 9'-4" and
  // would bow inches, so posts drop from it onto the box tops and onto the end shelves below.
  const nPost = p.aboveOn ? Math.max(1, Math.ceil(W / p.topBay)) - 1 : 0;
  const postSpan = W / (nPost + 1);
  if (p.aboveOn) {
    add(fixedShelves(w.T, { u0: 0, u1: W, depth: d, levels: [p.aboveZ], label: "Shelf over the boxes" }));
    for (let i = 1; i <= nPost; i++) {
      const u = W * i / (nPost + 1), onBox = u > m0 && u < m1;
      const z0 = onBox ? top : (lv.length ? lv[lv.length - 1] : 0);
      parts.push(box(w.T, "carcass", u - PLY / 2, u + PLY / 2, 0, d, z0, p.aboveZ - PLY,
        { mark: i === 1, label: onBox ? "Post, stands on a box top" : "Post, stands on the shelf below" }));
    }
  }

  const u0 = W - (p.stubL + p.opening), u1 = W - p.stubL;
  const door = { wall: "F", u0, u1, slab: p.opening / 3 + 1, h: p.doorH, roH: p.doorH + 2.5, swing: "slide", panels: 3, hingeU: u0, label: "3-track slider" };

  const endW = m0;   // each plywood end run
  if (!esW.length) warnings.push(`No usable box widths in "${p.esPlan}". East Star makes ${ES_WIDTHS.join(", ")}".`);
  if (m0 < p.stubL + 2) warnings.push(`The boxes start ${frac(m0, 8)} from the left wall but the door frame comes in ${frac(p.stubL, 8)}. A drawer front would hit it - use narrower boxes.`);
  if (W - m1 < p.stubR + 2) warnings.push(`Same at the right end: ${frac(W - m1, 8)} against a ${frac(p.stubR, 8)} door frame.`);
  if (basket < 24) warnings.push(`Only ${frac(basket, 8)} under the lowest end shelf. A tall hamper wants about 28".`);
  if (p.aboveOn) {
    const sag = 5 * (30 / 144 * d) * postSpan ** 4 / (384 * 1.3e6 * (d * PLY ** 3 / 12));
    if (sag > postSpan / 360) warnings.push(`The shelf across bows ${frac(sag, 16)} over a ${frac(postSpan, 8)} bay. Bring the posts closer.`);
  }
  if (p.aboveOn && p.aboveZ < top + 4) warnings.push(`The shelf across at ${frac(p.aboveZ, 8)} is less than 4" above the ${frac(top, 8)} boxes.`);
  const high = [...lv, ...(p.aboveOn ? [p.aboveZ] : []), p.esShelf].filter(z => z > p.doorH - 2);
  if (high.length) warnings.push(`This is a reach-in, so the ${frac(p.doorH, 8)} header is the reach limit. ${high.map(z => frac(z, 8)).join(", ")} sit above it.`);
  if (d > D - 5) warnings.push(`At ${frac(d, 8)} deep there is only ${frac(D - d, 8)} in front of the boxes. A 3-track slider needs about 5".`);
  warnings.push(...spacingWarnings(lv, "End shelves"));

  const drawers = es.drawers;
  return {
    info: INFO, params: p,
    closet: { outline, walls, ceiling: p.ceiling, wallT: t, nbr: [] },
    parts, modules, doors: [door], hatches: [],
    elevations: ["T", "L", "R"],
    planDims: [
      { a: [0, 0], b: [W, 0], label: frac(W, 8), off: -(t + 2.3) },
      { a: [W, 0], b: [W, D], label: frac(D, 8), off: -(t + 2.3) },
      { a: [0, 0], b: [m0, 0], label: frac(endW, 8), off: -(t + 6.6) },
      { a: [m0, 0], b: [m1, 0], label: `East Star ${frac(esRun0, 8)}`, off: -(t + 6.6) },
      { a: [m1, 0], b: [W, 0], label: frac(W - m1, 8), off: -(t + 6.6) },
      { a: [p.stubL, D], b: [p.stubL + p.opening, D], label: `${frac(p.opening, 8)} opening`, off: t + 2.3 },
    ],
    drawerGroups: [{ name: "East Star drawers", drawers }],
    stats: [
      { k: "Layout", v: `${frac(endW, 8)} + ${esW.join(" + ")}" + ${frac(endW, 8)}`, s: `plywood ends, East Star middle, all ${frac(d, 8)} deep` },
      { k: "Rods", v: `${esW.length} × ${frac(esW[0] - 1.5, 8)}`, s: `at ${frac(p.rodZ, 8)}, ${fronts.length} drawers under each` },
      { k: "End shelves", v: `${lv.length} × ${frac(endW, 8)} wide`, s: `both ends, ${frac(d, 8)} deep` },
      { k: "Under the lowest shelf", v: frac(basket, 8), s: "clear at the cleats, for a laundry basket" },
      { k: "Clear of the door frames", v: `${frac(m0 - p.stubL, 8)} / ${frac((W - m1) - p.stubR, 8)}`, s: "left / right, box face to frame" },
      { k: "Shelf across", v: p.aboveOn ? frac(p.aboveZ, 8) : "off", s: p.aboveOn ? `${nPost} posts under it, ${frac(postSpan, 8)} bays` : "" },
    ],
    titleMeta: [
      { k: "Closet", v: `${ftin(W)} × ${ftin(D)}` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "East Star", v: frac(esRun0, 8) },
      { k: "Drawers", v: `${drawers.length}` },
    ],
    gcText: [
      `MAYA'S CLOSET - ${frac(W, 8)} wide, everything ${frac(d, 8)} deep.`,
      `EAST STAR, centred: ${esW.join('" + ')}" boxes, ${frac(top, 8)} tall, NO doors. Each: ${fronts.length} drawers at the bottom (${fronts.slice().reverse().join('", ')}" fronts, top down), rod at ${frac(p.rodZ, 8)}, shelf at ${frac(p.esShelf, 8)}, open above. Floor-standing, screwed through the back into studs.`,
      `They start ${frac(m0, 8)} in from each end, so the drawers pull straight out through the opening and clear the door frames.`,
      `AMIR: 3/4" birch plywood shelves on 1x2 cleats into the studs, ${frac(endW, 8)} wide at each end, ${frac(d, 8)} deep, at ${lv.map(z => frac(z, 8)).join(", ")}.${p.aboveOn ? ` Plus one shelf right across the full ${frac(W, 8)} at ${frac(p.aboveZ, 8)}, with ${nPost} 3/4" plywood posts under it at ${frac(postSpan, 8)} centres - they stand on the box tops and on the end shelves.` : ""}`,
      `Nothing below ${frac(lv[0] || 0, 8)} at the ends - ${frac(basket, 8)} clear for laundry baskets.`,
      `Paint room colour, all sides.`,
    ].join("\n"),
    warnings,
    notes: [
      `The East Star boxes are centred on purpose. At the ends, a ${esW[0]}" drawer front would have to pass the door-frame stub (${frac(p.stubL, 8)} left, ${frac(p.stubR, 8)} right) on its way out and would hit it. In the middle they pull straight through the opening.`,
      `East Star only makes ${ES_WIDTHS.join(", ")}" wide, so the boxes come to ${frac(esRun0, 8)} and the plywood takes the ${frac(endW, 8)} left at each end.`,
      `The boxes stop at ${frac(d, 8)} deep because that is East Star's maximum. The ${frac(D - d, 8)} in front is not wasted: a 3-track slider needs about 5" for its tracks.`,
      `Bought boxes show as white oak in the 3D, site-built plywood in the finish you pick.`,
      `The rod starts at ${frac(p.rodZ, 8)} and moves up as she grows.`,
      `The shelf across needs those posts: unsupported over the full ${frac(W, 8)} a 3/4" plywood shelf bows about 9-1/2". They stand on the box tops and the end shelves rather than hanging from the ceiling - a post in compression onto something solid beats a fixing pulling down on ceiling drywall.`,
      `The opening is ${frac(p.doorH, 8)} tall in a ${ftin(p.ceiling)} room, so ${frac(p.ceiling - p.doorH, 8)} of wall sits above it and nothing above that header can be reached. ${frac(top, 8)} boxes plus the shelf at ${frac(p.aboveZ, 8)} stay under it.`,
    ],
  };
}
