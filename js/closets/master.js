// Master walk-in, oriented like the field sketch: long wall on the left (104.5"), door on the
// bottom wall (LHI, swings in), nook at the bottom right.
// Left and right walls are East Star factory cabinets (94" boxes, floor-standing, doors).
// Site-built plywood does the rest: a deck and an upper shelf over the cabinets, and the nook,
// whose side gable extends past the alcove so its shelves can be deeper than the 12.4" recess.
import { box, esRun, fixedShelves, pressBoard, collector, hatchClashes } from "../model/builders.js";
import { PLY, frac, ftin } from "../lib/units.js";
import { parseFronts } from "./rohan.js";
import { shelfSlots, shelfControls, readShelves, resolveShelves, matchControl, spacingWarnings, LOOK } from "./common.js";

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
  leftDepth: 24, leftPlan: "30, 36, 36", leftDoors: false, rightDoors: false,
  doorsOpen: false, drawersOut: false,
  nookDepth: 26.5,
  fronts2: "9, 10, 11, 12", fronts3: "9, 10, 11, 12", rod2: 84, rod3: 84,
  rightDepth: 15.5, rightPlan: "30, 30, 15",
  aboveOn: true, aboveZ: 107,
  pressOn: true, pressW: 15, pressZ: 18, pressDown: false,
  // one shelf bank per cabinet. l3/r2/r3 copy a neighbour until you tell them not to.
  ...shelfSlots("l1", [14, 28, 42, 56, 70, 84], [98]), l1match: "own",
  ...shelfSlots("l2", [88], [46, 56, 66, 76, 92]), l2match: "own",
  ...shelfSlots("l3", [88], [46, 56, 66, 76, 92]), l3match: "l2",
  ...shelfSlots("r1", [20, 34, 48, 62, 76], [88]), r1match: "own",
  ...shelfSlots("r2", [20, 34, 48, 62, 76], [88]), r2match: "r1",
  ...shelfSlots("r3", [20, 34, 48, 62, 76], [88]), r3match: "r2",
  // Nook: first at 24", then every 12". 60" is left off so 48-72" is one tall opening for the puja.
  ...shelfSlots("n", [24, 36, 48, 72, 84], [60, 96]),
  finish: "white", lights: true,
};

const BANKS = { l1: 7, l2: 6, l3: 6, r1: 6, r2: 6, r3: 6 };
const cab = (pre, title, near) => {
  const [t, rows] = shelfControls(pre, BANKS[pre], title);
  return [t, [matchControl(pre, near), ...rows], { fold: true }];
};

export const CONTROLS = [
  ["East Star · everything is a stock box", [
    { key: "esTop", label: "Cabinet height", type: "select",
      options: [["84", "84\""], ["90", "90\" (shaker only?)"], ["94", "94\""], ["96", "96\" (shaker only?)"]] },
    { key: "leftPlan", label: "Left wall widths, from the door", type: "text" },
    { key: "leftDepth", label: "Left wall depth", min: 15.5, max: 24, step: 8.5 },
    { key: "rightPlan", label: "Right wall widths, from the back", type: "text" },
    { key: "rightDepth", label: "Right wall depth", min: 15.5, max: 24, step: 8.5 },
  ]],
  ["Plywood above · cabinets and nook", [
    { key: "aboveOn", label: "Deck and shelf over the cabinets, carried on into the nook", type: "check" },
    { key: "aboveZ", label: "Upper shelf height", min: 100, max: 116, step: 1 },
  ]],
  ["Nook · plywood planks", [
    { key: "nookDepth", label: "Shelf depth (past 12-3/8\" it needs a gable)", min: 12, max: 28, step: 0.5 },
  ]],
  shelfControls("n", 7, "Nook shelves"),
  cab("l1", "Left 1 shelves · by the door", [["l2", "left 2"]]),
  cab("l2", "Left 2 shelves", [["l1", "left 1"], ["l3", "left 3"]]),
  cab("l3", "Left 3 shelves · at the back", [["l2", "left 2"]]),
  cab("r1", "Right 1 shelves · at the back", [["r2", "right 2"]]),
  cab("r2", "Right 2 shelves", [["r1", "right 1"], ["r3", "right 3"]]),
  cab("r3", "Right 3 shelves · by the nook", [["r2", "right 2"]]),
  ["Left wall · drawers and rods", [
    { key: "rod2", label: "Left 2 rod height", min: 66, max: 90, step: 0.5 },
    { key: "rod3", label: "Left 3 rod height", min: 66, max: 90, step: 0.5 },
    { key: "fronts2", label: "Left 2 drawer fronts, top → bottom", type: "text" },
    { key: "fronts3", label: "Left 3 drawer fronts, top → bottom", type: "text" },
  ], { fold: true }],
  ["Doors", [
    { key: "leftDoors", label: "Doors on the left wall", type: "check" },
    { key: "rightDoors", label: "Doors on the right wall", type: "check" },
    { key: "doorsOpen", label: "Show the doors open", type: "check" },
    { key: "drawersOut", label: "Show the drawers open", type: "check" },
  ], { fold: true }],
  ["Back wall · fold-down press board", [
    { key: "pressOn", label: "Press board on the back wall", type: "check" },
    { key: "pressW", label: "Cabinet width", min: 12, max: 20, step: 0.5 },
    { key: "pressZ", label: "Cabinet bottom", min: 12, max: 30, step: 1 },
    { key: "pressDown", label: "Show it folded down", type: "check" },
  ], { fold: true }],
  [...LOOK, { fold: true }],
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
  const lv = i => resolveShelves(p, ["l1", "l2", "l3"][Math.min(i, 2)], BANKS);
  const rv = i => resolveShelves(p, ["r1", "r2", "r3"][Math.min(i, 2)], BANKS);
  const fr = s => [...parseFronts(s, [7, 8, 9, 10])].reverse();
  const inside = [
    { levels: lv(0), label: "Long-term" },
    { fronts: fr(p.fronts2), rods: [p.rod2], levels: lv(1), label: "Daily 1" },
    { fronts: fr(p.fronts3), rods: [p.rod3], levels: lv(2), label: "Daily 2" },
  ];
  const rw = parsePlan(p.rightPlan, RT), rRun = rw.reduce((a, b) => a + b, 0);
  const lFill = Lh - lRun, rFill = RT - rRun;
  const mat = p.grade === "chip" ? "melamine" : null;   // chipboard reads flatter in the 3D
  const common = { doorsOpen: p.doorsOpen, drawersOut: p.drawersOut, ...(mat ? { mat } : {}) };
  const left = add(esRun(w.L, { u0: 0, depth: d, top, doors: p.leftDoors, ...common,
    bays: lw.map((width, i) => ({ w: width, ...(inside[i] || { levels: lv(i) }) })), prefix: "L", seed: 5 }));
  const right = add(esRun(w.R, { u0: 0, depth: rd, top, doors: p.rightDoors, ...common,
    bays: rw.map((width, i) => ({ w: width, levels: rv(i) })), prefix: "R", seed: 9 }));

  const aisle = W - d - rd;
  const swing = Math.max(0, ...[...(p.leftDoors ? lw : []), ...(p.rightDoors ? rw : [])].map(x => (x > 24 ? x / 2 : x)));
  if (swing > aisle - 3) warnings.push(`A ${frac(swing, 8)} door nearly fills the ${frac(aisle, 8)} aisle when open. Split the widest box into two doors.`);
  for (const [name, run, fill] of [["Left", Lh, lFill], ["Right", RT, rFill]])
    if (fill > 6) warnings.push(`${name} wall: ${frac(fill, 8)} of filler. East Star widths are ${ES_WIDTHS.join(", ")}" and only add up to multiples of 3.`);

  // ---- plywood over the cabinets: a deck on their tops, dividers at the seams screwed to the
  // top studs, and one shelf. Nothing hangs off the cabinets; the cleats carry the back edge.
  const deck = top + PLY;
  if (p.aboveOn) {
    // the dividers run deck to ceiling, so the shelf between them is braced top and bottom
    const over = (wall, u0, u1, widths, depth) => {
      if (u1 - u0 < 12) return;
      const seams = widths.slice(0, -1).map((_, i) => u0 + widths.slice(0, i + 1).reduce((a, b) => a + b, 0));
      parts.push(box(wall, "cleat", u0, u1, 0, PLY, top - 1.5, top));
      parts.push(box(wall, "shelf", u0, u1, 0, depth, top, deck, { mark: true, label: "Deck over the cabinets" }));
      for (const s of [u0 + PLY / 2, ...seams, u1 - PLY / 2])
        parts.push(box(wall, "carcass", s - PLY / 2, s + PLY / 2, 0, depth, deck, p.ceiling,
          { mark: s === u0 + PLY / 2, label: "Divider, deck to ceiling" }));
      parts.push(box(wall, "cleat", u0, u1, 0, PLY, p.aboveZ - 1.5, p.aboveZ));
      parts.push(box(wall, "shelf", u0, u1, 0, depth, p.aboveZ, p.aboveZ + PLY, { mark: true, label: "Upper shelf" }));
      modules.push(box(wall, "band", u0, u1, 0, depth, { label: "Plywood above", sub: `deck ${frac(deck, 8)}, shelf ${frac(p.aboveZ, 8)}` }));
    };
    over(w.L, 0, lRun, lw, d);
    over(w.R, 0, RT, rw, rd);
    if (p.aboveZ < deck + 10) warnings.push(`Only ${frac(p.aboveZ - deck, 8)} between the deck and the upper shelf.`);
    if (p.aboveZ + PLY > p.ceiling - 8) warnings.push(`The upper shelf leaves ${frac(p.ceiling - p.aboveZ - PLY, 8)} to the ceiling.`);
  }

  // ---- back wall stays clear so you can reach the back end of both runs; the only thing on it
  // is a fold-down press board, 5" deep closed, centred in the gap between the two runs.
  const bw0 = d, bw1 = W - rd, bwFree = bw1 - bw0;
  if (p.pressOn && bwFree > p.pressW + 4)
    add(pressBoard(w.T, { u0: bw0 + (bwFree - p.pressW) / 2, width: p.pressW, z0: p.pressZ, down: p.pressDown }));
  if (p.pressOn && bwFree <= p.pressW + 4)
    warnings.push(`Only ${frac(bwFree, 8)} of back wall between the two runs - not enough for a ${frac(p.pressW, 8)} press cabinet.`);

  // ---- nook. Its shelves can run deeper than the 12.4" recess if a plywood gable extends the
  // NT-side wall out into the closet; the door wall carries the other end.
  const nookRun = Lh - RT, nLv = readShelves(p, "n", 7);
  // two things stop the nook coming further forward: the face of the right cabinets, and the
  // near jamb of the entry door. Whichever is shallower wins.
  const capCab = XN - (W - rd), capDoor = XN - (p.doorAt + p.doorRO), nookCap = Math.min(capCab, capDoor);
  const nd = Math.min(p.nookDepth, nookCap);
  // The plank that carries the open end of the nook shelves stands in the right wall's leftover
  // rather than in the nook, so the nook keeps its full length. It runs to the upper shelf.
  const nAbove = p.aboveOn ? [deck, p.aboveZ] : [];          // match the planks over the right wall
  const plankTo = p.aboveOn ? p.aboveZ + PLY : (nLv[nLv.length - 1] || 0) + PLY;
  if (nd > p.nookD + 0.05)
    parts.push(box(w.R, "carcass", RT - PLY, RT, 0, W - (XN - nd), 0, plankTo,
      { mark: true, label: "Plank, carries the nook shelves" }));
  add(fixedShelves(w.NR, { u0: 0, u1: nookRun, depth: nd, levels: [...nLv, ...nAbove], label: "Nook shelves" }));
  if (nAbove.length && nLv.length && deck - nLv[nLv.length - 1] < 6)
    warnings.push(`The top nook shelf at ${frac(nLv[nLv.length - 1], 8)} is only ${frac(deck - nLv[nLv.length - 1], 8)} under the deck the nook picks up from the right wall at ${frac(deck, 8)}. Turn it off or drop it.`);
  const nose = XN - nd;
  if (p.nookDepth > nookCap + 0.01) warnings.push(`The nook can only come forward to ${frac(nookCap, 8)} deep - past that it runs into ${capDoor < capCab ? "the entry door's near jamb" : "the face of the right cabinets"}.`);
  if (nose < p.hatchX1) warnings.push(`At ${frac(nd, 8)} the nook shelves overhang the crawl hatch by ${frac(p.hatchX1 - nose, 8)}, in the air. The gable and the floor stay clear, but you will be tilting the hatch lid out from under them.`);

  // ---- entry door on the bottom wall, LHI: hinge on the jamb nearer the left wall, swings in
  const u0 = XN - (p.doorAt + p.doorRO), u1 = XN - p.doorAt;
  const door = { wall: "B", u0, u1, slab: p.doorSlab, h: p.doorH, roH: p.doorH + 2.5, swing: "in", hingeU: u1 - 1, label: "LHI" };
  if (d > p.doorAt + 1 - 1.4 - 0.25) warnings.push("At this depth, cabinet 1 is in the way of the entry door when it's fully open.");

  const hatches = [{ x0: p.hatchX0, y0: p.hatchY0, x1: p.hatchX1, y1: p.hatchY1, label: "crawl hatch" }];
  if (hatchClashes(parts, hatches).length) warnings.push("Something that stands on the floor covers the crawl-space hatch.");
  for (const [i, n] of [[0, "Left 1"], [1, "Left 2"], [2, "Left 3"]]) warnings.push(...spacingWarnings(lv(i), n));
  for (const [i, n] of [[0, "Right 1"], [1, "Right 2"], [2, "Right 3"]]) warnings.push(...spacingWarnings(rv(i), n));
  warnings.push(...spacingWarnings([...nLv, ...nAbove], "Nook"));

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
      { k: "Boxes", v: `${lw.length + rw.length}`, s: `${frac(top, 8)} tall · ${frac(lFill + rFill, 8)} filler in total · East Star quotes both grades` },
      { k: "Left wall", v: lw.join(" + ") + '"', s: `${frac(d, 8)} deep${lFill ? ` · ${frac(lFill, 8)} filler` : ""}` },
      { k: "Right wall", v: rw.join(" + ") + '"', s: `${frac(rd, 8)} deep · ${frac(rFill, 8)} left at the nook end, ${frac(rFill - PLY, 8)} of it filler` },
      { k: "Nook", v: `${nLv.length + nAbove.length} planks × ${frac(nd, 8)}`, s: `full ${frac(nookRun, 8)} long${nAbove.length ? `, top two at ${frac(deck, 8)} and ${frac(p.aboveZ, 8)} to match the right wall` : ""}` },
      { k: "Above the cabinets", v: p.aboveOn ? `deck ${frac(deck, 8)} · shelf ${frac(p.aboveZ, 8)}` : "off", s: `plywood planks, ${frac(p.ceiling - p.aboveZ - PLY, 8)} left to the ceiling` },
      { k: "Drawers", v: `${left.drawers.length + right.drawers.length}`, s: `in the two ${lw[1] || 36}" boxes on the left wall` },
      { k: "Aisle", v: frac(aisle, 8), s: `widest door swings ${frac(swing, 8)}` },
      { k: "Back wall", v: p.pressOn ? `press board, ${frac(p.pressW, 8)}` : "clear", s: `${frac(bwFree, 8)} between the runs, kept open for access` },
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
      `  ${lw[0]}": shelves at ${lv(0).join('", ')}".`,
      ...lw.slice(1).map((width, i) => `  ${width}": ${fr(i ? p.fronts3 : p.fronts2).length} drawers at the bottom (${fr(i ? p.fronts3 : p.fronts2).slice().reverse().join('", ')}" fronts, top down), rod at ${frac(i ? p.rod3 : p.rod2, 8)}, open above.`),
      `RIGHT WALL, ${frac(RT, 8)} long, ${frac(rd, 8)} deep. Start flush in the back corner: ${rw.join('" + ')}", then ${frac(rFill, 8)} left at the nook end. No rods, no doors.`,
      ...rw.map((width, i) => `  ${width}": shelves at ${rv(i).join('", ')}".`),
      `Q: anything shallower than 15-1/2"? And a topper box for the ${frac(p.ceiling - top, 8)} above a ${frac(top, 8)} box?`,
      ``,
      `AMIR - 3/4" birch ply planks on 1x2 cleats, painted:`,
      `  Nook: ${nLv.length + nAbove.length} shelves at ${[...nLv, ...nAbove].join('", ')}", ${frac(nd, 8)} deep, over the full ${frac(nookRun, 8)}. The recess is only ${frac(p.nookD, 8)}, so a 3/4" plank runs out ${frac(W - (XN - nd), 8)} from the corner to carry the open end - floor to ${frac(plankTo, 8)}. It sits in the ${frac(rFill, 8)} left at the nook end of the right wall, not in the nook.`,
      ...(p.aboveOn ? [`  Over the cabinets: deck at ${frac(deck, 8)}, planks on edge at each seam, shelf at ${frac(p.aboveZ, 8)}.`] : []),
    ].join("\n"),
    warnings,
    notes: [
      `East Star does the two walls - anything with a drawer, a door or a carcass. Amir does the flat plywood: the nook shelves and the deck and shelf above the cabinets, cut and painted, sitting on 1x2 cleats.`,
      `Stock widths are ${ES_WIDTHS.join(", ")}", so every run adds up to a multiple of 3. ${frac(Lh, 8)} and ${frac(RT, 8)} land on ${lRun}" and ${rRun}". The left wall's ${frac(lFill, 8)} is filler in the back corner; the right wall's ${frac(rFill, 8)} goes to the nook end, where 3/4" of it becomes the plank that carries the nook shelves.`,
      `The dividers above the cabinets run from the deck all the way to the ceiling, so the upper shelf is braced top and bottom rather than sitting on short posts.`,
      `Nook shelves start at ${frac(nLv[0] || 24, 8)} and then step about 12" - and the one at eye level is deliberately left out, so 48" to 72" is a single ${frac(23.25, 8)} opening for the puja. Above them the nook picks up the same two plywood heights as the right wall, ${frac(deck, 8)} and ${frac(p.aboveZ, 8)}, so the lines run straight round the corner.`,
      `The nook is planks rather than a box on purpose: the recess is only ${frac(p.nookD, 8)} and East Star's shallowest is 15-1/2", which would stand proud and lap the crawl hatch. Planks fit it exactly.`,
      `The ${lw[0]}" box by the door sits behind the entry door. Opened fully the door stands about ${frac(p.doorAt + 1 - 1.4 - d, 8)} in front of it, so shut the entry door before opening that one.`,
      `A ${frac(top, 8)} box under a ${ftin(p.ceiling)} ceiling leaves ${frac(p.ceiling - top, 8)} above it. This is a walk-in, so a step ladder reaches it. Planks on the cabinet tops turn it into two more shelves.`,
      `The back wall stays clear on purpose. A cabinet there would sit right where you stand to open the doors on the back end of both runs. A 5"-deep press board takes almost nothing from the aisle closed, and folds down to a ${frac(42, 8)} board when you want it.`,
      `The crawl hatch runs ${frac(p.hatchX0, 8)}-${frac(p.hatchX1, 8)} from the left wall. Everything on the left and right walls clears it; only the nook box laps it.`,
    ],
  };
}
