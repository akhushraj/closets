// Rohan's closet (Bedroom 2), Concept A: hang across the top wall, drawer tower on the
// left wall, shelves over a free-standing hamper in the alcove, upper band above the door.
// Plan orientation is as drawn on the architect's plan: x to the right, y down the page.
import { hangRun, esRun, fixedShelves, floorItem, collector, box, packStock } from "../model/builders.js";
import { shelfSlots as slots, shelfControls, readShelves, spacingWarnings } from "./common.js";
import { PLY, frac, ftin } from "../lib/units.js";

export const INFO = {
  id: "rohan", name: "Rohan's Closet", room: "Bedroom 2", stuff: "books", concept: "Full-L shelves · rod end to end on wall B", rev: "",
};

// Measured in the field (2026-09-18). These always override stored or default values.
export const FIELD = { closetW: 46.2, mainD: 52.1, alcoveW: 25.2, totalL: 78.7, ceiling: 120,
  doorAt: 31.1, doorRO: 30.3, doorSlab: 28, doorH: 96, hinge: "near" };

export const DEFAULTS = {
  wallC: "ply", cornerTo: "front",
  ...slots("l", [88, 104], [96, 112]),          // shared: these run the full L
  ...slots("c", [45, 60], [68]),                 // wall C only, from where wall B stops to wall D
  cDepth: 24, cFullOn: true, cFullZ: 30, sideOn: true,
  dresser: false, midOn: false, midZ: 35, divU: 34,
  esDepth: 24, esTop: 94, esFronts: "9, 10, 11, 12",
  aboveOn: true, aboveZ: 107,
  frontDepth: 21, rodZ: 74, lowOn: false, lowZ: 22,
  // alcove shelves, lowest first: top-of-shelf height AFF and on/off
  s1: 16, s1on: false, s2: 28, s2on: true, s3: 40, s3on: true, s4: 52, s4on: true,
  s5: 64, s5on: true, s6: 76, s6on: true, s7: 88, s7on: true, s8: 104, s8on: true,
  casingW: 3.5,
  hamperW: 16, hamperD: 16, hamperH: 25,
  finish: "oak", lights: true,
};

export const CONTROLS = [
  ["Wall C", [
    { key: "wallC", label: "Build it from", type: "select",
      options: [["ply", "Plywood shelves, L with wall B"], ["es", "East Star boxes"]] },
    { key: "esDepth", label: "East Star depth", min: 15.5, max: 24, step: 8.5 },
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
    { key: "frontDepth", label: "Wall B depth", min: 14, max: 24, step: 0.5 },
    { key: "rodZ", label: "Rod height", min: 48, max: 84, step: 0.5 },
    { key: "dresser", label: "Dresser under the rod (IKEA MALM 3-drawer)", type: "check" },
    { key: "midOn", label: "Shelf wall to wall under the clothes, on a vertical", type: "check" },
    { key: "midZ", label: "Its height (top)", min: 31, max: 42, step: 0.5 },
    { key: "divU", label: "Where the vertical stands, from the notch", min: 20, max: 40, step: 0.5 },

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

const MALM = { w: 31.5, d: 18.875, h: 30.75 };   // IKEA MALM 3-drawer chest

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

  // ---- Wall B runs to the corner at 21" deep; wall C picks up where it stops, 24" deep.
  // Three levels carry straight round as a full L: the hat shelf over the rod, and two above it.
  const ed = p.esDepth, top = +p.esTop, fd = p.frontDepth, sd = fd, cd = p.cDepth;
  const ply = p.wallC === "ply";
  const rightOwns = !ply && p.cornerTo === "right";
  const tU0 = rightOwns ? 0 : fd, tRun = W - tU0, lU1 = rightOwns ? M - ed : M;
  const tw = ply ? [] : packStock(tRun), tFill = ply ? 0 : tRun - tw.reduce((a, b) => a + b, 0);
  const esFronts = [...parseFronts(p.esFronts)].reverse();
  const drawerTop = esFronts.reduce((a, b) => a + b, 0);
  const hatZ = p.rodZ + 2;
  const lLv = [hatZ, ...readShelves(p, "l", 4)].sort((a, b) => a - b);   // the full-L levels
  const cLv = readShelves(p, "c", 4);                                    // wall C only

  // wall B: rod end to end with its hat shelf, then the shared levels above
  const bays = p.midOn ? [[0, p.divU - PLY / 2], [p.divU + PLY / 2, lU1]] : [[0, lU1]];
  const hangs = bays.map(([a, b]) => add(hangRun(w.L, { u0: a, u1: b, depth: fd, rodZ: p.rodZ, shelfDepth: sd, coatsTo: a + 0.1 })));
  const hang = hangs[0];
  add(fixedShelves(w.L, { u0: 0, u1: lU1, depth: sd, levels: lLv.filter(z => z > hatZ + 0.5), label: "Wall B shelves" }));

  // wall C
  const es = ply ? { drawers: [] }
    : add(esRun(w.T, { u0: tU0, depth: ed, top, doors: false, prefix: "R", seed: 7,
        bays: tw.map((width, i) => ({ w: width, ...(i === 0 ? { fronts: esFronts } : {}),
          levels: [20, 34, 48, 62, 76].filter(z => i > 0 || z > drawerTop + 3) })) }));
  if (ply) {
    add(fixedShelves(w.T, { u0: fd, u1: W, depth: cd, levels: lLv, label: "Wall C · the L" }));
    if (cLv.length) add(fixedShelves(w.T, { u0: fd, u1: W, depth: cd, levels: cLv, label: "Wall C shelves" }));
    if (p.cFullOn) add(fixedShelves(w.T, { u0: 0, u1: W, depth: cd, levels: [p.cFullZ], label: "Wall C · right across" }));
    // a plywood side up the open edge of the wall C shelves, so nothing slides off toward wall B
    if (p.sideOn && cLv.length)
      parts.push(box(w.T, "carcass", fd, fd + PLY, 0, cd, cLv[0], hatZ,
        { mark: true, label: "Side, stops things falling off" }));
  }

  // ---- plywood planks over the boxes, when wall C is East Star
  const deck = top + PLY, tU1 = tU0 + tw.reduce((a, b) => a + b, 0);
  if (p.aboveOn && !ply) {
    const seams = tw.slice(0, -1).map((_, i) => tU0 + tw.slice(0, i + 1).reduce((a, b) => a + b, 0));
    parts.push(box(w.T, "cleat", tU0, tU1, 0, PLY, top - 1.5, top));
    parts.push(box(w.T, "shelf", tU0, tU1, 0, ed, top, deck, { mark: true, label: "Deck over the boxes" }));
    for (const q of [tU0 + PLY / 2, ...seams, tU1 - PLY / 2])
      parts.push(box(w.T, "carcass", q - PLY / 2, q + PLY / 2, 0, ed, deck, p.aboveZ));
    parts.push(box(w.T, "cleat", tU0, tU1, 0, PLY, p.aboveZ - 1.5, p.aboveZ));
    parts.push(box(w.T, "shelf", tU0, tU1, 0, ed, p.aboveZ, p.aboveZ + PLY, { mark: true, label: "Upper shelf" }));
  }
  if (p.dresser) {   // IKEA MALM 3-drawer, standing under the clothes
    const a = 1.5, b = a + MALM.w, v1 = 0.5 + MALM.d, fh = (MALM.h - 2.5) / 3;
    parts.push(box(w.L, "dresser", a, b, 0.5, v1 - 0.6, 0, MALM.h - 0.75, { label: "Dresser" }));
    parts.push(box(w.L, "dresser", a, b, 0.5, v1, MALM.h - 0.75, MALM.h, { mark: true, label: "Dresser top" }));
    for (let i = 0; i < 3; i++) {
      const z0 = 1 + i * (fh + 0.4);
      parts.push(box(w.L, "dresserfront", a + 0.4, b - 0.4, v1 - 0.6, v1, z0, z0 + fh));
    }
    modules.push(box(w.L, "dresser", a, b, 0.5, v1, 0, 0, { label: "Dresser", sub: `MALM 3-drawer · ${MALM.w} × ${MALM.d}` }));
  }

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
  const clothesTo = p.rodZ - 42;   // an adult shirt on a hanger
  if (p.aboveOn && !ply && p.aboveZ < deck + 10) warnings.push(`Only ${frac(p.aboveZ - deck, 8)} between the deck and the shelf above it.`);
  if (!ply && tFill > 6) warnings.push(`${frac(tFill, 8)} of filler on wall C. East Star widths only add up to multiples of 3, so ${frac(tRun, 8)} lands on ${tw.reduce((a, b) => a + b, 0)}".`);
  if (p.cFullOn && p.dresser && p.cFullZ - PLY - 1.5 < MALM.h)
    warnings.push(`The shelf right across at ${frac(p.cFullZ, 8)} passes over the dresser, which is ${MALM.h}" tall. One of them has to move.`);
  if (p.cFullOn && p.cFullZ > clothesTo - 1)
    warnings.push(`The shelf right across at ${frac(p.cFullZ, 8)} runs into the hanging clothes, which reach ${frac(clothesTo, 8)}.`);
  if (ply && cLv.length && cLv[cLv.length - 1] > hatZ - 8)
    warnings.push(`A wall C shelf at ${frac(cLv[cLv.length - 1], 8)} is close under the ${frac(hatZ, 8)} hat shelf.`);
  if (p.rodZ < 46) warnings.push(`The rod at ${frac(p.rodZ, 8)} leaves ${frac(p.rodZ - 4, 8)} of hanging above the floor. A jacket wants about 40".`);
  for (let i = 1; i < alcLevels.length; i++)
    if (alcLevels[i] - alcLevels[i - 1] < 6)
      warnings.push(`Two alcove shelves are only ${frac(alcLevels[i] - alcLevels[i - 1], 8)} apart (tops at ${alcLevels[i - 1]}" and ${alcLevels[i]}").`);
  if (alcLevels.length && alcLevels[0] - 1.5 - 0.5 < p.hamperH)
    warnings.push(`The lowest alcove shelf (${alcLevels[0]}") is too low for a ${p.hamperH}" hamper under its front edge.`);
  if (Math.abs(alcDepth - sd) > 0.5) warnings.push(`Wall A shelves are ${frac(alcDepth, 8)} deep against wall B's ${frac(sd, 8)} - the entry door casing caps wall A, so they can't match.`);
  if (ply) warnings.push(...spacingWarnings([...cLv, ...lLv], "Wall C"));
  const notes = [
    `Three different things, on purpose. The right wall is East Star boxes - that is where the drawers are. The front wall and the left alcove are plywood planks on 1x2 cleats, cut and painted on site.`,
    `Right wall: ${tw.join('" + ')}" of ${frac(ed, 8)}-deep boxes at ${frac(top, 8)} tall, no doors, ${esFronts.length} drawers in the first one. ${frac(tFill, 8)} of filler.`,
    `Above them, plywood: a deck on the box tops at ${frac(deck, 8)} and a shelf at ${frac(p.aboveZ, 8)}, leaving ${frac(p.ceiling - p.aboveZ - PLY, 8)} to the ceiling. Planks on edge at each box seam carry it, with 1x2 cleats into the studs behind.`,
    `Wall B: rod at ${frac(p.rodZ, 8)} end to end, ${frac(lU1, 8)}, ${frac(fd, 8)} deep - the notch there is ${frac(nx, 8)} wide, so that fits exactly. Nothing below the rod. Above it: ${lLv.map(z => frac(z, 8)).join(", ")}, all ${frac(sd, 8)} deep.`,
    `Those ${lLv.length} levels carry straight round onto wall C, so they read as one L. Wall C is ${frac(cd, 8)} deep and picks up where wall B stops, ${frac(fd, 8)} off the corner.`,
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
      ply ? { k: "Wall C · plywood", v: `${(cLv.length + lLv.length + (p.cFullOn ? 1 : 0))} shelves`, s: `${frac(cd, 8)} deep` }
          : { k: "Wall C · East Star", v: tw.join(" + ") + '"', s: `${frac(ed, 8)} deep, ${frac(top, 8)} tall, no doors · ${frac(tFill, 8)} filler` },
      { k: "Drawers", v: p.dresser ? "3, in a dresser" : (ply ? "none" : `${n}`), s: p.dresser ? `MALM 3-drawer under the rod` : (ply ? "nothing on wall B below the rod" : `in the ${tw[0]}" box`) },
      ...(ply ? [] : [{ k: "Above them", v: p.aboveOn ? `deck ${frac(deck, 8)} · shelf ${frac(p.aboveZ, 8)}` : "off", s: `plywood, ${frac(p.ceiling - p.aboveZ - PLY, 8)} to the ceiling` }]),
      { k: "Wall B · rod", v: frac(rodLen, 8), s: `at ${frac(p.rodZ, 8)}, running the full ${frac(lU1, 8)} to wall C` },
      { k: "The full L", v: lLv.map(z => frac(z, 8)).join(", "), s: `wall B ${frac(sd, 8)} deep, wall C ${frac(cd, 8)} deep` },
      { k: "Wall C only", v: cLv.length ? cLv.map(z => frac(z, 8)).join(", ") : "none", s: `${frac(W - fd, 8)} wide, wall B's face to wall D${p.sideOn && cLv.length ? `, with a side up to ${frac(hatZ, 8)}` : ""}` },
      { k: "Right across", v: p.cFullOn ? frac(p.cFullZ, 8) : "off", s: p.cFullOn ? `full ${frac(W, 8)}, wall B to wall D, under the clothes` : "" },
      { k: "Under the rod", v: "open", s: `clothes reach ${frac(clothesTo, 8)}` },
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
      ply ? `ROHAN'S CLOSET - all plywood${p.dresser ? ", with a bought dresser under the clothes" : ", nothing bought"}.`
          : `ROHAN'S CLOSET - East Star on wall C, Amir's plywood on walls A and B.`,
      ``,
      ...(ply ? [] : [`EAST STAR, wall C: ${tw.join('" + ')}" box, ${frac(ed, 8)} deep, ${frac(top, 8)} tall, NO doors, ${frac(tFill, 8)} filler. ${esFronts.length} drawers at the bottom of the ${tw[0]}" box (${esFronts.slice().reverse().join('", ')}" fronts, top down); shelves in the rest. Floor-standing, screwed through the back into studs.`]),

      ``,
      `AMIR - 3/4" birch plywood, painted, on 1x2 cleats screwed through the drywall into the studs:`,
      ...(p.aboveOn && !ply ? [`  Over the boxes: a deck at ${frac(deck, 8)} on the cabinet tops, planks on edge at each box seam, and a shelf at ${frac(p.aboveZ, 8)}.`] : []),
      `  Wall B (${frac(lU1, 8)} long, ${frac(sd, 8)} deep): rod at ${frac(p.rodZ, 8)} end to end, nothing below it. Shelves at ${lLv.map(z => frac(z, 8)).join(", ")}.`,
      `  Wall C (${frac(cd, 8)} deep): the same ${lLv.length} levels carry round from wall B as one L. Below them, ${cLv.map(z => frac(z, 8)).join(" and ")} run only from wall B's face (${frac(fd, 8)} off the corner) to wall D.${p.sideOn && cLv.length ? ` A 3/4" plywood side closes their open edge from ${frac(cLv[0], 8)} up to ${frac(hatZ, 8)} so nothing slides off.` : ""}${p.cFullOn ? ` One more at ${frac(p.cFullZ, 8)} runs right across, wall B to wall D.` : ""}`,
      `  Wall A alcove: ${alcLevels.length} shelves at ${alcLevels.join('", ')}", ${frac(alcDepth, 8)} deep (the door casing caps it), wall to wall at ${frac(A, 8)}.`,
      `  Front edge on every plywood shelf: 3/4" x 1-1/2" solid nosing - it hides the LED channel.`,
      ``,
      `LED: single-colour 24V strip in an aluminium channel under every plywood shelf and under the hat shelf, behind the nosing. One driver, one trunk down the back corner, a WAGO pair per shelf. See the A-4 tab.`,
    ].join("\n"),
    warnings, notes, wiring,
  };
}
