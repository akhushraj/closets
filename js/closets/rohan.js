// Rohan's closet (Bedroom 2), Concept A: hang across the top wall, drawer tower on the
// left wall, shelves over a free-standing hamper in the alcove, upper band above the door.
// Plan orientation is as drawn on the architect's plan: x to the right, y down the page.
import { hangRun, esRun, fixedShelves, floorItem, collector, box, packStock } from "../model/builders.js";
import { PLY, frac, ftin } from "../lib/units.js";

export const INFO = {
  id: "rohan", name: "Rohan's Closet", room: "Bedroom 2", concept: "Wall C East Star · walls A and B plywood", rev: "",
};

// Measured in the field (2026-09-18). These always override stored or default values.
export const FIELD = { closetW: 46.2, mainD: 52.1, alcoveW: 25.2, totalL: 78.7, ceiling: 120,
  doorAt: 31.1, doorRO: 30.3, doorSlab: 28, doorH: 96, hinge: "near" };

export const DEFAULTS = {
  cornerTo: "front",
  esDepth: 24, esTop: 94, esFronts: "6, 7, 8, 8, 9",
  aboveOn: true, aboveZ: 107,
  frontDepth: 21, rodZ: 70, frontShelf1: 88, frontShelf2: 102,
  // alcove shelves, lowest first: top-of-shelf height AFF and on/off
  s1: 16, s1on: false, s2: 28, s2on: true, s3: 40, s3on: true, s4: 52, s4on: true,
  s5: 64, s5on: true, s6: 76, s6on: true, s7: 88, s7on: true, s8: 104, s8on: true,
  casingW: 3.5,
  hamperW: 16, hamperD: 16, hamperH: 25,
  finish: "oak", lights: true,
};

export const CONTROLS = [
  ["Wall C · East Star", [
    { key: "esDepth", label: "Depth", min: 15.5, max: 24, step: 8.5 },
    { key: "esTop", label: "Height", type: "select", options: [["84", "84\""], ["90", "90\""], ["94", "94\""], ["96", "96\""]] },
    { key: "esFronts", label: "Drawer fronts in the first box, top → bottom", type: "text" },
    { key: "cornerTo", label: "The corner belongs to", type: "select",
      options: [["front", "Wall B - its shelves run through to wall C"], ["right", "Wall C - wider boxes, shorter wall B"]] },
  ]],
  ["Above it · plywood planks", [
    { key: "aboveOn", label: "Deck and shelf over the boxes", type: "check" },
    { key: "aboveZ", label: "Upper shelf height", min: 100, max: 116, step: 1 },
  ]],
  ["Wall B · plywood hanging + shelves", [
    { key: "frontDepth", label: "Depth (shelves are 1/4\" shy of this)", min: 14, max: 21, step: 0.25 },
    { key: "rodZ", label: "Rod height", min: 48, max: 84, step: 0.5 },
    { key: "frontShelf1", label: "Shelf above it", min: 80, max: 100, step: 1 },
    { key: "frontShelf2", label: "And another", min: 94, max: 116, step: 1 },
  ]],
  ["Wall A · alcove shelves", [
    ...[1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ key: `s${i}`, onKey: `s${i}on`, type: "shelf",
      label: i === 1 ? "Shelf 1 (lowest)" : `Shelf ${i}`, min: 4, max: 114, step: 0.5 })),
    { key: "casingW", label: "Door casing width (sets the shelf depth)", min: 2, max: 4.5, step: 0.25 },
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
  p = { ...p, ...FIELD };
  const W = p.closetW, M = p.mainD, A = p.alcoveW, L = p.totalL, nx = W - A, t = 4.5;
  const outline = [[0, 0], [W, 0], [W, L], [nx, L], [nx, M], [0, M]];
  const walls = [
    { id: "T",  name: "Wall C · East Star",   a: [0, 0],  b: [W, 0] },
    { id: "D",  name: "Wall D · entry door",  a: [W, 0],  b: [W, L] },
    { id: "E",  name: "Wall A · alcove shelves", a: [W, L], b: [nx, L] },
    { id: "N2", name: "Alcove side",          a: [nx, L], b: [nx, M] },
    { id: "N1", name: "Notch face",           a: [nx, M], b: [0, M], hidden: true },
    { id: "L",  name: "Wall B · hanging + shelves", a: [0, M], b: [0, 0] },
  ];
  const w = Object.fromEntries(walls.map(x => [x.id, x]));
  const { parts, modules, add } = collector();

  // ---- right wall (T): East Star boxes, no doors, drawers in the first one.
  // The inside corner is 21" x esDepth; one run owns it and the other starts clear of it.
  const ed = p.esDepth, top = +p.esTop, fd = p.frontDepth;
  const rightOwns = p.cornerTo === "right";
  const tU0 = rightOwns ? 0 : fd, tRun = W - tU0, lU1 = rightOwns ? M - ed : M;
  const tw = packStock(tRun), tFill = tRun - tw.reduce((a, b) => a + b, 0);
  const esFronts = [...parseFronts(p.esFronts)].reverse();
  const drawerTop = esFronts.reduce((a, b) => a + b, 0);
  const es = add(esRun(w.T, { u0: tU0, depth: ed, top, doors: false, prefix: "R", seed: 7,
    bays: tw.map((width, i) => ({ w: width, ...(i === 0 ? { fronts: esFronts } : {}),
      levels: [20, 34, 48, 62, 76].filter(z => i > 0 || z > drawerTop + 3) })) }));

  // ---- plywood planks over the boxes: a deck on their tops and one shelf above it
  const deck = top + PLY, tU1 = tU0 + tw.reduce((a, b) => a + b, 0);
  if (p.aboveOn) {
    const seams = tw.slice(0, -1).map((_, i) => tU0 + tw.slice(0, i + 1).reduce((a, b) => a + b, 0));
    parts.push(box(w.T, "cleat", tU0, tU1, 0, PLY, top - 1.5, top));
    parts.push(box(w.T, "shelf", tU0, tU1, 0, ed, top, deck, { mark: true, label: "Deck over the boxes" }));
    for (const q of [tU0 + PLY / 2, ...seams, tU1 - PLY / 2])
      parts.push(box(w.T, "carcass", q - PLY / 2, q + PLY / 2, 0, ed, deck, p.aboveZ));
    parts.push(box(w.T, "cleat", tU0, tU1, 0, PLY, p.aboveZ - 1.5, p.aboveZ));
    parts.push(box(w.T, "shelf", tU0, tU1, 0, ed, p.aboveZ, p.aboveZ + PLY, { mark: true, label: "Upper shelf" }));
    modules.push(box(w.T, "band", tU0, tU1, 0, ed, { label: "Plywood above", sub: `deck ${frac(deck, 8)}, shelf ${frac(p.aboveZ, 8)}` }));
  }

  // ---- front wall (L): plywood rod with a hat shelf and LED over it, then open shelves
  const sd = fd - 0.25;   // every shelf on wall B is the same depth, a hair shy of the run
  const hang = add(hangRun(w.L, { u0: 0, u1: lU1, depth: fd, rodZ: p.rodZ, shelfDepth: sd, coatsTo: fd }));
  const fLv = [p.frontShelf1, p.frontShelf2].filter(z => z > p.rodZ + 10 && z < p.ceiling - 6);
  if (fLv.length) add(fixedShelves(w.L, { u0: 0, u1: lU1, depth: sd, levels: fLv, label: "Wall B shelves" }));

  // ---- left alcove: fixed plywood shelves wall to wall on cleats, LED under each
  const belowDoor = L - (p.doorAt + p.doorRO);
  const alcDepth = Math.floor((belowDoor - p.casingW - 0.25) * 8) / 8;
  const alcLevels = [1, 2, 3, 4, 5, 6, 7, 8].filter(i => p[`s${i}on`]).map(i => +p[`s${i}`]).sort((a, b) => a - b);
  add(fixedShelves(w.E, { u0: 0, u1: A, depth: alcDepth, levels: alcLevels, label: "Wall A shelves" }));
  add(floorItem(w.E, "hamper", { u0: (A - p.hamperW) / 2, u1: (A + p.hamperW) / 2, v0: 1, v1: 1 + p.hamperD, h: p.hamperH, label: "Hamper" }));

  const door = { wall: "D", u0: p.doorAt, u1: p.doorAt + p.doorRO, slab: p.doorSlab, h: p.doorH, roH: p.doorH + 2.5,
    swing: "out", hingeU: p.hinge === "near" ? p.doorAt + 1 : p.doorAt + p.doorRO - 1,
    label: p.hinge === "near" ? "LHO" : "RHO" };
  // door casing on the closet side of the door wall
  const cw = p.casingW;
  parts.push(box(w.D, "casing", door.u0 - cw, door.u0, 0, 0.75, 0, door.roH + cw));
  parts.push(box(w.D, "casing", door.u1, door.u1 + cw, 0, 0.75, 0, door.roH + cw));
  parts.push(box(w.D, "casing", door.u0 - cw, door.u1 + cw, 0, 0.75, door.roH, door.roH + cw, { mark: true, label: "Casing top" }));

  const aisle = W - fd, warnings = [];
  if (p.aboveOn && p.aboveZ < deck + 10) warnings.push(`Only ${frac(p.aboveZ - deck, 8)} between the deck and the shelf above it.`);
  if (tFill > 6) warnings.push(`${frac(tFill, 8)} of filler on the right wall. East Star widths only add up to multiples of 3, so ${frac(tRun, 8)} lands on ${tw.reduce((a, b) => a + b, 0)}".`);
  if (lU1 < 24) warnings.push(`Wall B is only ${frac(lU1, 8)} long. Give the corner to wall B instead.`);
  if (Math.abs(alcDepth - sd) > 0.5) warnings.push(`Wall A shelves are ${frac(alcDepth, 8)} deep against wall B's ${frac(sd, 8)} - the entry door casing caps wall A, so they can't match.`);
  if (p.rodZ - 42 < 4) warnings.push("Long coats will touch the floor at this rod height.");
  if (p.rodZ < 46) warnings.push(`The rod at ${frac(p.rodZ, 8)} leaves ${frac(p.rodZ - 4, 8)} of hanging above the floor. A grown-up jacket wants about 40".`);
  for (let i = 1; i < alcLevels.length; i++)
    if (alcLevels[i] - alcLevels[i - 1] < 6)
      warnings.push(`Two alcove shelves are only ${frac(alcLevels[i] - alcLevels[i - 1], 8)} apart (tops at ${alcLevels[i - 1]}" and ${alcLevels[i]}").`);
  if (alcLevels.length && alcLevels[0] - 1.5 - 0.5 < p.hamperH)
    warnings.push(`The lowest alcove shelf (${alcLevels[0]}") is too low for a ${p.hamperH}" hamper under its front edge.`);
  const notes = [
    `Three different things, on purpose. The right wall is East Star boxes - that is where the drawers are. The front wall and the left alcove are plywood planks on 1x2 cleats, cut and painted on site.`,
    `Right wall: ${tw.join('" + ')}" of ${frac(ed, 8)}-deep boxes at ${frac(top, 8)} tall, no doors, ${esFronts.length} drawers in the first one. ${frac(tFill, 8)} of filler.`,
    `Above them, plywood: a deck on the box tops at ${frac(deck, 8)} and a shelf at ${frac(p.aboveZ, 8)}, leaving ${frac(p.ceiling - p.aboveZ - PLY, 8)} to the ceiling. Planks on edge at each box seam carry it, with 1x2 cleats into the studs behind.`,
    `Wall B: rod at ${frac(p.rodZ, 8)} running the full ${frac(lU1, 8)} to wall C, ${frac(fd, 8)} deep - the notch there is ${frac(nx, 8)} wide, so that fits exactly. Every shelf on this wall is ${frac(sd, 8)} deep: the hat shelf over the rod, then ${fLv.join('" and ')}".`,
    `Wall A can't match that depth. The return beside the entry door is only ${frac(belowDoor, 8)}; take off a ${frac(cw, 8)} casing and 1/4" and the alcove shelves cap out at ${frac(alcDepth, 8)} deep, wall to wall at ${frac(A, 8)}. Any deeper and they foul the door casing.`,
    "LEDs: single-colour 24V strip in an aluminium channel under the front edge of every plywood shelf and under the hat shelf, hidden behind the 3/4\" x 1-1/2\" nosing. One driver, one trunk down the back corner, a WAGO pair at each shelf.",
    "Mounting: the drywall is up, so shelves can't be nailed straight to studs. Under each, screw a 3/4\" x 1-1/2\" cleat through the drywall into the studs on all three walls, then set the shelf on the cleats.",
  ];

  // LED wiring: one supply at the top, trunk down the back corner, a WAGO pair per shelf
  const stripLen = A - 6.5, stripFt = alcLevels.length * stripLen / 12;
  const watts = Math.round(stripFt * 4.4);
  const driver = watts * 1.25 <= 60 ? 60 : watts * 1.25 <= 100 ? 100 : 150;
  const supplyZ = Math.min(p.ceiling - 10, (alcLevels[alcLevels.length - 1] || 90) + 8);
  const trunkFt = Math.ceil(((supplyZ - (alcLevels[0] || 0)) + alcLevels.length * (A - 4) + 24) / 12);
  const wiring = alcLevels.length ? { wall: "E", width: A, ceiling: p.ceiling, levels: alcLevels,
    supplyZ, watts, driver, trunkFt } : null;

  const rodLen = hang.module.rodLen, n = es.drawers.length;
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
      { a: [fd, M - 6], b: [W, M - 6], label: `aisle ${frac(aisle, 8)}`, off: 0 },
      { a: [0, M - 3], b: [fd, M - 3], label: frac(fd, 8), off: 0 },
      { a: [W - 3, 0], b: [W - 3, ed], label: frac(ed, 8), off: 0 },
      { a: [W - 8, L - alcDepth], b: [W - 8, L], label: frac(alcDepth, 8), off: 0 },
    ],
    drawerGroups: [{ name: "East Star drawers", drawers: es.drawers }],
    stats: [
      { k: "Wall C · East Star", v: tw.join(" + ") + '"', s: `${frac(ed, 8)} deep, ${frac(top, 8)} tall, no doors · ${frac(tFill, 8)} filler` },
      { k: "Drawers", v: `${n}`, s: `in the ${tw[0]}" box, fronts ${esFronts.slice().reverse().join(", ")}"` },
      { k: "Above them", v: p.aboveOn ? `deck ${frac(deck, 8)} · shelf ${frac(p.aboveZ, 8)}` : "off", s: `plywood, ${frac(p.ceiling - p.aboveZ - PLY, 8)} to the ceiling` },
      { k: "Wall B · rod", v: frac(rodLen, 8), s: `at ${frac(p.rodZ, 8)}, running the full ${frac(lU1, 8)} to wall C` },
      { k: "Wall B · shelves", v: `${fLv.length + 1} × ${frac(sd, 8)} deep`, s: `hat shelf over the rod, then ${fLv.join('", ')}"` },
      { k: "Wall A · alcove", v: `${alcLevels.length} × ${frac(alcDepth, 8)} deep`, s: `capped by the wall D casing, not by choice` },
      { k: "Aisle", v: frac(aisle, 8), s: "between wall B and wall D" },
    ],
    titleMeta: [
      { k: "Closet", v: `${ftin(W)} × ${ftin(L)}` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "Rod", v: `${frac(rodLen, 8)} @ ${frac(p.rodZ, 8)}` },
      { k: "Drawers", v: `${n}` },
    ],
    gcText: [
      `ROHAN'S CLOSET - three parts. East Star does the right wall; Amir does the plywood.`,
      ``,
      `EAST STAR, wall C: ${tw.join('" + ')}" box, ${frac(ed, 8)} deep, ${frac(top, 8)} tall, NO doors, ${frac(tFill, 8)} filler. ${esFronts.length} drawers at the bottom of the ${tw[0]}" box (${esFronts.slice().reverse().join('", ')}" fronts, top down); shelves in the rest. Floor-standing, screwed through the back into studs.`,
      ``,
      `AMIR - 3/4" birch plywood, painted, on 1x2 cleats screwed through the drywall into the studs:`,
      ...(p.aboveOn ? [`  Over the boxes: a deck at ${frac(deck, 8)} on the cabinet tops, planks on edge at each box seam, and a shelf at ${frac(p.aboveZ, 8)}.`] : []),
      `  Wall B: rod at ${frac(p.rodZ, 8)} the full ${frac(lU1, 8)} to wall C. Every shelf on this wall ${frac(sd, 8)} deep - hat shelf over the rod, then ${fLv.join('" and ')}".`,
      `  Wall A alcove: ${alcLevels.length} shelves at ${alcLevels.join('", ')}", ${frac(alcDepth, 8)} deep (the door casing caps it), wall to wall at ${frac(A, 8)}.`,
      `  Front edge on every plywood shelf: 3/4" x 1-1/2" solid nosing - it hides the LED channel.`,
      ``,
      `LED: single-colour 24V strip in an aluminium channel under every plywood shelf and under the hat shelf, behind the nosing. One driver, one trunk down the back corner, a WAGO pair per shelf. See the A-4 tab.`,
    ].join("\n"),
    warnings, notes, wiring,
  };
}
