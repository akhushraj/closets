// Master walk-in, oriented like the field sketch: long wall on the left (104.5"), door on the
// bottom wall (LHI, swings in), nook at the bottom right.
// Left and right walls are East Star factory cabinets (94" boxes, floor-standing, doors).
// Site-built plywood does the rest: a deck and an upper shelf over the cabinets, and the nook,
// whose side gable extends past the alcove so its shelves can be deeper than the 12.4" recess.
import { box, esRun, fixedShelves, collector, hatchClashes } from "../model/builders.js";
import { PLY, frac, ftin } from "../lib/units.js";
import { parseFronts } from "./rohan.js";
import { shelfSlots, shelfControls, readShelves, spacingWarnings, LOOK } from "./common.js";

export const INFO = { id: "master", name: "Master Closet", room: "Master bedroom",
  stuff: "folded", concept: "East Star boxes · plywood planks by Amir", rev: "" };

// Measured in the field (2026-09-18), sketch orientation. Always overrides stored values.
export const FIELD = { W: 72.3, Lh: 104.5, rightTo: 76.8, nookD: 12.4, ceiling: 120,
  doorAt: 25.8, doorRO: 32, doorSlab: 30, doorH: 96,
  hatchX0: 40.7, hatchY0: 78.65, hatchX1: 69.8, hatchY1: 102.85 };

// East Star only makes these widths, so every run is a sum of them plus a filler.
export const ES_WIDTHS = [15, 18, 21, 24, 30, 36];

export const DEFAULTS = {
  grade: "shaker", esTop: 94,
  leftDepth: 24, leftPlan: "30, 36, 36", leftDoors: true, rightDoors: true,
  doorsOpen: false, drawersOut: false,
  nookDepth: 26.5,
  fronts2: "9, 10, 11, 12", fronts3: "9, 10, 11, 12", rod2: 84, rod3: 84,
  ...shelfSlots("a", [14, 28, 42, 56, 70, 84], [98]),
  rightDepth: 15.5, rightPlan: "36, 24, 15",
  aboveOn: true, aboveZ: 107,
  ...shelfSlots("n", [16, 30, 44, 58, 72, 86], [100]),
  finish: "white", lights: true,
};

export const CONTROLS = [
  ["East Star · everything is a stock box", [
    { key: "grade", label: "Grade to price", type: "select",
      options: [["shaker", "Shaker, plywood box"], ["chip", "Chipboard, 1/4\" back"]] },
    { key: "esTop", label: "Cabinet height", type: "select",
      options: [["84", "84\""], ["90", "90\" (shaker only?)"], ["94", "94\""], ["96", "96\" (shaker only?)"]] },
    { key: "leftPlan", label: "Left wall widths, from the door", type: "text" },
    { key: "leftDepth", label: "Left wall depth", min: 15.5, max: 24, step: 8.5 },
    { key: "rightPlan", label: "Right wall widths, from the back", type: "text" },
    { key: "rightDepth", label: "Right wall depth", min: 15.5, max: 24, step: 8.5 },
    { key: "leftDoors", label: "Doors on the left wall", type: "check" },
    { key: "rightDoors", label: "Doors on the right wall", type: "check" },
    { key: "doorsOpen", label: "Show the doors open", type: "check" },
    { key: "drawersOut", label: "Show the drawers open", type: "check" },
  ]],
  ["Left wall · inside the cabinets", [
    { key: "rod2", label: "Cabinet 2 rod height", min: 66, max: 90, step: 0.5 },
    { key: "rod3", label: "Cabinet 3 rod height", min: 66, max: 90, step: 0.5 },
    { key: "fronts2", label: "Cabinet 2 drawer fronts, top → bottom", type: "text" },
    { key: "fronts3", label: "Cabinet 3 drawer fronts, top → bottom", type: "text" },
  ]],
  shelfControls("a", 8, "Cabinet 1 shelves · long-term"),
  ["Above the cabinets · plywood planks", [
    { key: "aboveOn", label: "Deck and shelf over the cabinets", type: "check" },
    { key: "aboveZ", label: "Upper shelf height", min: 100, max: 116, step: 1 },
  ]],
  ["Nook · plywood planks", [
    { key: "nookDepth", label: "Shelf depth (past 12-3/8\" it needs a gable)", min: 12, max: 28, step: 0.5 },
  ]],
  shelfControls("n", 7, "Nook shelves"),
  LOOK,
];

// "30, 36, 36" -> [30, 36, 36], keeping only stock widths that still fit the run.
export function parsePlan(s, run) {
  const out = [];
  let left = run;
  for (const t of String(s).split(/[,\s]+/).filter(Boolean)) {
    const v = +t;
    if (!ES_WIDTHS.includes(v) || v > left + 1e-6) continue;
    out.push(v); left -= v;
  }
  return out;
}

export function build(p) {
  p = { ...p, ...FIELD };
  const W = p.W, Lh = p.Lh, RT = p.rightTo, XN = W + p.nookD, t = 4.5;
  const top = +p.esTop, d = +p.leftDepth, rd = +p.rightDepth;
  const outline = [[0, 0], [W, 0], [W, RT], [XN, RT], [XN, Lh], [0, Lh]];
  const walls = [
    { id: "T",  name: "Back wall",                  a: [0, 0],   b: [W, 0] },
    { id: "R",  name: "Right wall · East Star",     a: [W, 0],   b: [W, RT] },
    { id: "NT", name: "Nook top",                   a: [W, RT],  b: [XN, RT], hidden: true },
    { id: "NR", name: "Nook · plywood shelves",     a: [XN, RT], b: [XN, Lh] },
    { id: "B",  name: "Door wall",                  a: [XN, Lh], b: [0, Lh], hidden: true },
    { id: "L",  name: "Left wall · East Star",      a: [0, Lh],  b: [0, 0], tagU: 0.5 },
  ];
  const w = Object.fromEntries(walls.map(x => [x.id, x]));
  const { parts, modules, add } = collector();
  const warnings = [];

  // ---- left wall. u runs from the door wall up to the back wall, so cabinet 1 is by the door.
  const lw = parsePlan(p.leftPlan, Lh), lRun = lw.reduce((a, b) => a + b, 0);
  const aLv = readShelves(p, "a", 8);
  const fr = s => [...parseFronts(s, [7, 8, 9, 10])].reverse();
  const inside = [
    { levels: aLv, label: "Long-term" },
    { fronts: fr(p.fronts2), rods: [p.rod2], label: "Daily 1" },
    { fronts: fr(p.fronts3), rods: [p.rod3], label: "Daily 2" },
  ];
  const rw = parsePlan(p.rightPlan, RT), rRun = rw.reduce((a, b) => a + b, 0);
  const lFill = Lh - lRun, rFill = RT - rRun;
  const mat = p.grade === "chip" ? "melamine" : null;   // chipboard reads flatter in the 3D
  const common = { doorsOpen: p.doorsOpen, drawersOut: p.drawersOut, ...(mat ? { mat } : {}) };
  const left = add(esRun(w.L, { u0: 0, depth: d, top, doors: p.leftDoors, ...common,
    bays: lw.map((width, i) => ({ w: width, ...(inside[i] || { levels: aLv }) })), prefix: "L", seed: 5 }));
  const right = add(esRun(w.R, { u0: rFill, depth: rd, top, doors: p.rightDoors, ...common,
    bays: rw.map(width => ({ w: width, levels: [20, 34, 48, 62, 76] })), prefix: "R", seed: 9 }));

  const aisle = W - d - rd;
  const swing = Math.max(0, ...[...(p.leftDoors ? lw : []), ...(p.rightDoors ? rw : [])].map(x => (x > 24 ? x / 2 : x)));
  if (swing > aisle - 3) warnings.push(`A ${frac(swing, 8)} door nearly fills the ${frac(aisle, 8)} aisle when open. Split the widest box into two doors.`);
  for (const [name, run, fill] of [["Left", Lh, lFill], ["Right", RT, rFill]])
    if (fill > 6) warnings.push(`${name} wall: ${frac(fill, 8)} of filler. East Star widths are ${ES_WIDTHS.join(", ")}" and only add up to multiples of 3.`);

  // ---- plywood over the cabinets: a deck on their tops, dividers at the seams screwed to the
  // top studs, and one shelf. Nothing hangs off the cabinets; the cleats carry the back edge.
  const deck = top + PLY;
  if (p.aboveOn) {
    const over = (wall, u0, widths, depth) => {
      const u1 = u0 + widths.reduce((a, b) => a + b, 0);
      if (u1 - u0 < 12) return;
      const seams = widths.slice(0, -1).map((_, i) => u0 + widths.slice(0, i + 1).reduce((a, b) => a + b, 0));
      parts.push(box(wall, "cleat", u0, u1, 0, PLY, top - 1.5, top));
      parts.push(box(wall, "shelf", u0, u1, 0, depth, top, deck, { mark: true, label: "Deck over the cabinets" }));
      for (const s of [u0 + PLY / 2, ...seams, u1 - PLY / 2])
        parts.push(box(wall, "carcass", s - PLY / 2, s + PLY / 2, 0, depth, deck, p.aboveZ));
      parts.push(box(wall, "cleat", u0, u1, 0, PLY, p.aboveZ - 1.5, p.aboveZ));
      parts.push(box(wall, "shelf", u0, u1, 0, depth, p.aboveZ, p.aboveZ + PLY, { mark: true, label: "Upper shelf" }));
      modules.push(box(wall, "band", u0, u1, 0, depth, { label: "Plywood above", sub: `deck at ${frac(deck, 8)}, shelf at ${frac(p.aboveZ, 8)}` }));
    };
    over(w.L, 0, lw, d);
    over(w.R, rFill, rw, rd);
    if (p.aboveZ < deck + 10) warnings.push(`Only ${frac(p.aboveZ - deck, 8)} between the deck and the upper shelf.`);
    if (p.aboveZ + PLY > p.ceiling - 8) warnings.push(`The upper shelf leaves ${frac(p.ceiling - p.aboveZ - PLY, 8)} to the ceiling.`);
  }

  // ---- nook. Its shelves can run deeper than the 12.4" recess if a plywood gable extends the
  // NT-side wall out into the closet; the door wall carries the other end.
  const nookRun = Lh - RT, nLv = readShelves(p, "n", 7);
  // two things stop the nook coming further forward: the face of the right cabinets, and the
  // near jamb of the entry door. Whichever is shallower wins.
  const capCab = XN - (W - rd), capDoor = XN - (p.doorAt + p.doorRO), nookCap = Math.min(capCab, capDoor);
  const nd = Math.min(p.nookDepth, nookCap);
  if (nd > p.nookD + 0.05)   // a plank on edge carries the open end where the shelves run past the recess
    parts.push(box(w.NT, "carcass", 0, nd - p.nookD, 0, PLY, 0, (nLv[nLv.length - 1] || 0) + PLY,
      { mark: true, label: "Gable, extends the nook" }));
  add(fixedShelves(w.NR, { u0: 0, u1: nookRun, depth: nd, levels: nLv, label: "Nook shelves" }));
  const nose = XN - nd;
  if (p.nookDepth > nookCap + 0.01) warnings.push(`The nook can only come forward to ${frac(nookCap, 8)} deep - past that it runs into ${capDoor < capCab ? "the entry door's near jamb" : "the face of the right cabinets"}.`);
  if (nose < p.hatchX1) warnings.push(`At ${frac(nd, 8)} the nook shelves overhang the crawl hatch by ${frac(p.hatchX1 - nose, 8)}, in the air. The gable and the floor stay clear, but you will be tilting the hatch lid out from under them.`);

  // ---- entry door on the bottom wall, LHI: hinge on the jamb nearer the left wall, swings in
  const u0 = XN - (p.doorAt + p.doorRO), u1 = XN - p.doorAt;
  const door = { wall: "B", u0, u1, slab: p.doorSlab, h: p.doorH, roH: p.doorH + 2.5, swing: "in", hingeU: u1 - 1, label: "LHI" };
  if (d > p.doorAt + 1 - 1.4 - 0.25) warnings.push("At this depth, cabinet 1 is in the way of the entry door when it's fully open.");

  const hatches = [{ x0: p.hatchX0, y0: p.hatchY0, x1: p.hatchX1, y1: p.hatchY1, label: "crawl hatch" }];
  if (hatchClashes(parts, hatches).length) warnings.push("Something that stands on the floor covers the crawl-space hatch.");
  warnings.push(...spacingWarnings(aLv, "Cabinet 1"), ...spacingWarnings(nLv, "Nook"));

  const drawers = [...left.drawers, ...right.drawers];
  return {
    info: INFO, params: p,
    closet: { outline, walls, ceiling: p.ceiling, wallT: t, nbr: [] },
    parts, modules, doors: [door], hatches,
    elevations: ["L", "R", "NR", "T"],
    planDims: [
      { a: [0, 0], b: [W, 0], label: frac(W, 8), off: -(t + 2.3) },
      { a: [W, 0], b: [W, RT], label: frac(RT, 8), off: -(t + 2.3) },
      { a: [0, 0], b: [0, Lh], label: frac(Lh, 8), off: t + 7 },
      { a: [0, Lh], b: [p.doorAt, Lh], label: frac(p.doorAt, 8), off: t + 2.3 },
      { a: [p.doorAt, Lh], b: [p.doorAt + p.doorRO, Lh], label: frac(p.doorRO, 8) + " R.O.", off: t + 2.3 },
      { a: [d, 40], b: [W - rd, 40], label: `aisle ${frac(aisle, 8)}`, off: 0 },
    ],
    drawerGroups: [{ name: "East Star drawers", drawers }],
    stats: [
      { k: "Grade", v: p.grade === "chip" ? "Chipboard" : "Shaker, plywood", s: `${lw.length + rw.length} boxes, ${frac(top, 8)} tall · ${frac(lFill + rFill, 8)} filler in total` },
      { k: "Left wall", v: lw.join(" + ") + '"', s: `${frac(d, 8)} deep${lFill ? ` · ${frac(lFill, 8)} filler` : ""}` },
      { k: "Right wall", v: rw.join(" + ") + '"', s: `${frac(rd, 8)} deep${rFill ? ` · ${frac(rFill, 8)} filler` : ""}` },
      { k: "Nook", v: `${nLv.length} planks × ${frac(nd, 8)}`, s: `max is ${frac(nookCap, 8)} (${capDoor < capCab ? "door jamb" : "cabinet face"}); ${frac(nd - p.nookD, 8)} past the recess` },
      { k: "Above the cabinets", v: p.aboveOn ? `deck ${frac(deck, 8)} · shelf ${frac(p.aboveZ, 8)}` : "off", s: `plywood planks, ${frac(p.ceiling - p.aboveZ - PLY, 8)} left to the ceiling` },
      { k: "Drawers", v: `${left.drawers.length + right.drawers.length}`, s: `in the two ${lw[1] || 36}" boxes on the left wall` },
      { k: "Aisle", v: frac(aisle, 8), s: `widest door swings ${frac(swing, 8)}` },
    ],
    titleMeta: [
      { k: "Closet", v: `${ftin(W)} × ${ftin(Lh)} + nook` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "Aisle", v: frac(aisle, 8) },
      { k: "Drawers", v: `${drawers.length}` },
    ],
    gcText: [
      `MASTER CLOSET. Quote both grades please: (a) chipboard, (b) shaker on a plywood box. Same boxes either way.`,
      `All ${lw.length + rw.length} boxes ${frac(top, 8)} tall, floor-standing, screwed through the back into studs. Two door leaves on anything over 24".`,
      ``,
      `LEFT WALL, ${frac(Lh, 8)} long, ${frac(d, 8)} deep. From the door: ${lw.join('" + ')}", then ${frac(lFill, 8)} filler in the back corner.`,
      `  ${lw[0]}": shelves at ${aLv.join('", ')}".`,
      ...lw.slice(1).map((width, i) => `  ${width}": ${fr(i ? p.fronts3 : p.fronts2).length} drawers at the bottom (${fr(i ? p.fronts3 : p.fronts2).slice().reverse().join('", ')}" fronts, top down), rod at ${frac(i ? p.rod3 : p.rod2, 8)}, open above.`),
      `RIGHT WALL, ${frac(RT, 8)} long, ${frac(rd, 8)} deep. ${frac(rFill, 8)} filler in the back corner, then ${rw.join('" + ')}". Shelves at ${[20, 34, 48, 62, 76].join('", ')}", no rods.`,
      `Q: anything shallower than 15-1/2"? And a topper box for the ${frac(p.ceiling - top, 8)} above a ${frac(top, 8)} box?`,
      ``,
      `AMIR - 3/4" birch ply planks on 1x2 cleats, painted:`,
      `  Nook: ${nLv.length} shelves at ${nLv.join('", ')}", ${frac(nd, 8)} deep. Recess is only ${frac(p.nookD, 8)}, so a 3/4" ply plank on edge runs out ${frac(nd - p.nookD, 8)} from the corner to carry the open end, floor to top shelf.`,
      ...(p.aboveOn ? [`  Over the cabinets: deck at ${frac(deck, 8)}, planks on edge at each seam, shelf at ${frac(p.aboveZ, 8)}.`] : []),
    ].join("\n"),
    warnings,
    notes: [
      `East Star does the two walls - anything with a drawer, a door or a carcass. Amir does the flat plywood: the nook shelves and the deck and shelf above the cabinets, cut and painted, sitting on 1x2 cleats.`,
      `Stock widths are ${ES_WIDTHS.join(", ")}", so every run adds up to a multiple of 3. ${frac(Lh, 8)} and ${frac(RT, 8)} land on ${lRun}" and ${rRun}", which is where the ${frac(lFill + rFill, 8)} of filler comes from.`,
      `The nook is planks rather than a box on purpose: the recess is only ${frac(p.nookD, 8)} and East Star's shallowest is 15-1/2", which would stand proud and lap the crawl hatch. Planks fit it exactly.`,
      `The ${lw[0]}" box by the door sits behind the entry door. Opened fully the door stands about ${frac(p.doorAt + 1 - 1.4 - d, 8)} in front of it, so shut the entry door before opening that one.`,
      `A ${frac(top, 8)} box under a ${ftin(p.ceiling)} ceiling leaves ${frac(p.ceiling - top, 8)} above it. This is a walk-in, so a step ladder reaches it. Planks on the cabinet tops turn it into two more shelves.`,
      `The crawl hatch runs ${frac(p.hatchX0, 8)}-${frac(p.hatchX1, 8)} from the left wall. Everything on the left and right walls clears it; only the nook box laps it.`,
    ],
  };
}
