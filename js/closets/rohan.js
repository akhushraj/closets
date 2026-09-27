// Rohan's closet. Wall A is the alcove, wall B the long wall, wall C the short one at the end,
// wall D the entry door. Two layouts, and they are exclusive: everything on wall C, or everything
// on wall B. The other of the two stays bare. Wall A's alcove shelves are there either way.
// All plywood, plus a bought dresser under the low shelf.
import { hangRun, fixedShelves, floorItem, collector, box } from "../model/builders.js";
import { shelfSlots as slots, shelfControls, readShelves, spacingWarnings } from "./common.js";
import { PLY, frac, ftin } from "../lib/units.js";

export const INFO = { id: "rohan", name: "Rohan's Closet", room: "Bedroom 2", stuff: "books",
  concept: "One wall or the other · rod, shelves, dresser", rev: "" };

// Measured in the field (2026-09-18). These always override stored or default values.
export const FIELD = { closetW: 46.2, mainD: 52.1, alcoveW: 25.2, totalL: 78.7, ceiling: 120,
  doorAt: 31.1, doorRO: 30.3, doorSlab: 28, doorH: 96, hinge: "near" };

// IKEA HEMNES 3-drawer dresser
const HEMNES = { w: 42.5, d: 19.625, h: 37.75 };

export const DEFAULTS = {
  layout: "rodC", rodZ: 85, bDepth: 21, cDepth: 24,
  ...slots("l", [89, 101, 113], [77, 95]),   // above the rod
  lowOn: true, lowZ: 41, dresser: true,
  s1: 16, s1on: false, s2: 28, s2on: true, s3: 40, s3on: true, s4: 52, s4on: true,
  s5: 64, s5on: true, s6: 76, s6on: true, s7: 88, s7on: true, s8: 104, s8on: true,
  casingW: 3.5, hamperW: 16, hamperD: 16, hamperH: 25,
  finish: "oak", lights: true,
};

export const CONTROLS = [
  ["Layout", [
    { key: "layout", label: "Everything goes on", type: "select",
      options: [["rodC", "Wall C only — wall B stays bare"], ["rodB", "Wall B only — wall C stays bare"]] },
    { key: "rodZ", label: "Rod height", min: 60, max: 90, step: 0.5 },
    { key: "bDepth", label: "Wall B depth", min: 14, max: 24, step: 0.5 },
    { key: "cDepth", label: "Wall C depth", min: 14, max: 24, step: 0.5 },
  ]],
  shelfControls("l", 5, "Above the rod"),
  ["Under the rod · dresser shelf", [
    { key: "lowOn", label: "Shelf right across the rod wall", type: "check" },
    { key: "lowZ", label: "Its height (top)", min: 30, max: 48, step: 1 },
    { key: "dresser", label: "IKEA HEMNES 3-drawer under it", type: "check" },
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
    { id: "T",  name: "Wall C · short end",        a: [0, 0],  b: [W, 0] },
    { id: "D",  name: "Wall D · entry door",       a: [W, 0],  b: [W, L] },
    { id: "E",  name: "Wall A · alcove shelves",   a: [W, L],  b: [nx, L] },
    { id: "N2", name: "Alcove side",               a: [nx, L], b: [nx, M] },
    { id: "N1", name: "Notch face",                a: [nx, M], b: [0, M], hidden: true },
    { id: "L",  name: "Wall B · long wall",        a: [0, M],  b: [0, 0], tagU: 0.5 },
  ];
  const w = Object.fromEntries(walls.map(x => [x.id, x]));
  const { parts, modules, add } = collector();
  const warnings = [];

  // One wall carries everything and the other stays bare.
  const onC = p.layout === "rodC", bd = p.bDepth, cd = p.cDepth;
  const rodW = onC ? w.T : w.L;
  const rodLen = onC ? W : M, rodDepth = onC ? cd : bd;

  const lLv = readShelves(p, "l", 5);                      // above the rod
  const overRod = lLv[0] ?? p.ceiling;
  const clothesTo = p.rodZ - 42;                           // an adult shirt on a hanger

  // the rod, its wall, and the shelf right across under it
  add(hangRun(rodW, { u0: 0, u1: rodLen, depth: rodDepth, rodZ: p.rodZ, coatsTo: 0.1, hat: false }));
  if (p.lowOn) add(fixedShelves(rodW, { u0: 0, u1: rodLen, depth: rodDepth, levels: [p.lowZ], label: "Shelf under the clothes" }));
  if (p.dresser) {   // HEMNES 3-drawer, standing under that shelf
    const a = 1.5, b = a + HEMNES.w, v1 = 0.5 + HEMNES.d, fh = (HEMNES.h - 3) / 3;
    parts.push(box(rodW, "dresser", a, b, 0.5, v1 - 0.6, 0, HEMNES.h - 0.75, { label: "HEMNES dresser" }));
    parts.push(box(rodW, "dresser", a, b, 0.5, v1, HEMNES.h - 0.75, HEMNES.h, { mark: true, label: "Dresser top" }));
    for (let i = 0; i < 3; i++) {
      const z0 = 1 + i * (fh + 0.4);
      parts.push(box(rodW, "dresserfront", a + 0.4, b - 0.4, v1 - 0.6, v1, z0, z0 + fh));
    }
    modules.push(box(rodW, "dresser", a, b, 0.5, v1, 0, 0, { label: "HEMNES 3-drawer", sub: `${HEMNES.w} × ${HEMNES.d} × ${HEMNES.h}"` }));
  }

  add(fixedShelves(rodW, { u0: 0, u1: rodLen, depth: rodDepth, levels: lLv, label: "Shelves above the rod" }));

  // wall A: the alcove, as deep as the entry door casing allows
  const belowDoor = L - (p.doorAt + p.doorRO);
  const alcDepth = Math.floor((belowDoor - p.casingW - 0.25) * 8) / 8;
  const alcLevels = [1, 2, 3, 4, 5, 6, 7, 8].filter(i => p[`s${i}on`]).map(i => +p[`s${i}`]).sort((a, b) => a - b);
  add(fixedShelves(w.E, { u0: 0, u1: A, depth: alcDepth, levels: alcLevels, label: "Wall A shelves" }));
  add(floorItem(w.E, "hamper", { u0: (A - p.hamperW) / 2, u1: (A + p.hamperW) / 2, v0: 1, v1: 1 + p.hamperD, h: p.hamperH, label: "Hamper" }));

  const door = { wall: "D", u0: p.doorAt, u1: p.doorAt + p.doorRO, slab: p.doorSlab, h: p.doorH, roH: p.doorH + 2.5,
    swing: "out", hingeU: p.hinge === "near" ? p.doorAt + 1 : p.doorAt + p.doorRO - 1,
    label: p.hinge === "near" ? "LHO" : "RHO" };
  const cw = p.casingW;
  parts.push(box(w.D, "casing", door.u0 - cw, door.u0, 0, 0.75, 0, door.roH + cw));
  parts.push(box(w.D, "casing", door.u1, door.u1 + cw, 0, 0.75, 0, door.roH + cw));
  parts.push(box(w.D, "casing", door.u0 - cw, door.u1 + cw, 0, 0.75, door.roH, door.roH + cw, { mark: true, label: "Casing top" }));

  const rodName0 = onC ? "Wall C" : "Wall B";
  const underCleats = p.lowZ - PLY - 1.5;
  if (p.lowOn && p.dresser && underCleats < HEMNES.h)
    warnings.push(`The shelf at ${frac(p.lowZ, 8)} leaves ${frac(underCleats, 8)} under its cleats and the HEMNES is ${HEMNES.h}" tall. It needs to be at ${frac(HEMNES.h + PLY + 1.5 + 1, 8)} or higher.`);
  if (p.lowOn && p.lowZ > clothesTo - 1)
    warnings.push(`The shelf at ${frac(p.lowZ, 8)} runs into the hanging clothes, which reach ${frac(clothesTo, 8)}. Raise the rod to about ${frac(p.lowZ + 43, 8)}.`);
  if (p.dresser && HEMNES.w > rodLen - 3)
    warnings.push(`The HEMNES is ${HEMNES.w}" wide and that wall is ${frac(rodLen, 8)}. It only just fits.`);
  if (overRod - p.rodZ < 4) warnings.push(`The first L is only ${frac(overRod - p.rodZ, 8)} over the rod. Hangers need about 2" plus room to lift them off.`);
  if (Math.abs(alcDepth - rodDepth) > 0.5) warnings.push(`Wall A shelves are ${frac(alcDepth, 8)} deep against ${rodName0}'s ${frac(rodDepth, 8)} - the entry door casing caps wall A, so they can't match.`);
  warnings.push(...spacingWarnings([...(p.lowOn ? [p.lowZ] : []), ...lLv].sort((a, b) => a - b), "Shelves"));
  for (let i = 1; i < alcLevels.length; i++)
    if (alcLevels[i] - alcLevels[i - 1] < 6)
      warnings.push(`Two alcove shelves are only ${frac(alcLevels[i] - alcLevels[i - 1], 8)} apart (tops at ${alcLevels[i - 1]}" and ${alcLevels[i]}").`);
  if (alcLevels.length && alcLevels[0] - 1.5 - 0.5 < p.hamperH)
    warnings.push(`The lowest alcove shelf (${alcLevels[0]}") is too low for a ${p.hamperH}" hamper under its front edge.`);

  // LED wiring: one supply at the top, trunk down the back corner, a WAGO pair per shelf
  const stripLen = A - 6.5, stripFt = alcLevels.length * stripLen / 12;
  const watts = Math.round(stripFt * 4.4);
  const driver = watts * 1.25 <= 60 ? 60 : watts * 1.25 <= 100 ? 100 : 150;
  const supplyZ = Math.min(p.ceiling - 10, (alcLevels[alcLevels.length - 1] || 90) + 8);
  const trunkFt = Math.ceil(((supplyZ - (alcLevels[0] || 0)) + alcLevels.length * (A - 4) + 24) / 12);
  const wiring = alcLevels.length ? { wall: "E", width: A, ceiling: p.ceiling, levels: alcLevels,
    supplyZ, watts, driver, trunkFt } : null;

  const rodName = onC ? "Wall C" : "Wall B", othName = onC ? "Wall B" : "Wall C";
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
      { a: [0, M - 3], b: [bd, M - 3], label: frac(bd, 8), off: 0 },
      { a: [W - 3, 0], b: [W - 3, cd], label: frac(cd, 8), off: 0 },
      { a: [W - 8, L - alcDepth], b: [W - 8, L], label: frac(alcDepth, 8), off: 0 },
    ],
    drawerGroups: [],
    stats: [
      { k: "Layout", v: `Rod on ${rodName}`, s: `${frac(rodLen, 8)} end to end at ${frac(p.rodZ, 8)}, ${frac(rodDepth, 8)} deep` },
      { k: "Above the rod", v: lLv.map(z => frac(z, 8)).join(", "), s: `${lLv.length} shelves, ${frac(rodLen, 8)} × ${frac(rodDepth, 8)} deep` },
      { k: othName, v: "bare", s: "nothing on it in this layout" },
      { k: "Under the rod", v: p.lowOn ? `shelf at ${frac(p.lowZ, 8)}` : "open", s: p.lowOn ? `${frac(underCleats, 8)} under its cleats${p.dresser ? `, HEMNES is ${HEMNES.h}"` : ""}` : `clothes reach ${frac(clothesTo, 8)}` },
      { k: "Wall A · alcove", v: `${alcLevels.length} × ${frac(alcDepth, 8)} deep`, s: "capped by the wall D casing" },
    ],
    titleMeta: [
      { k: "Closet", v: `${ftin(W)} × ${ftin(L)}` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "Rod", v: `${rodName} @ ${frac(p.rodZ, 8)}` },
      { k: "L shelves", v: `${lLv.length}` },
    ],
    gcText: [
      `ROHAN'S CLOSET - all plywood, 3/4" birch, painted, on 1x2 cleats screwed through the drywall into the studs. Only bought item is the dresser.`,
      ``,
      `${rodName.toUpperCase()} (${frac(rodLen, 8)} long, ${frac(rodDepth, 8)} deep): rod at ${frac(p.rodZ, 8)} end to end, no hat shelf.`,
      ...(p.lowOn ? [`  One shelf right across at ${frac(p.lowZ, 8)}, ${frac(underCleats, 8)} clear under its cleats.${p.dresser ? ` An IKEA HEMNES 3-drawer (${HEMNES.w} x ${HEMNES.d} x ${HEMNES.h}") stands under it.` : ""}`] : []),
      `  Shelves above the rod at ${lLv.map(z => frac(z, 8)).join(", ")}.`,
      ``,
      `${othName.toUpperCase()}: nothing. Leave it bare.`,
      ``,
      `WALL A alcove: ${alcLevels.length} shelves at ${alcLevels.join('", ')}", ${frac(alcDepth, 8)} deep (the entry door casing caps it), wall to wall at ${frac(A, 8)}.`,
      `Front edge on every shelf: 3/4" x 1-1/2" solid nosing - it hides the LED channel.`,
      `LED: single-colour 24V strip in an aluminium channel under every shelf, behind the nosing. One driver, one trunk down the back corner, a WAGO pair per shelf. See the A-4 tab.`,
    ].join("\n"),
    warnings,
    notes: [
      `The two layouts are exclusive: everything goes on ${rodName} and ${othName} stays bare. Flip the select and they swap over. ${rodName} gives ${frac(rodLen, 8)} of rod at ${frac(rodDepth, 8)} deep; the other gives ${frac(onC ? M : W, 8)} at ${frac(onC ? bd : cd, 8)}.`,
      `The HEMNES is ${HEMNES.h}" tall, so the shelf over it cannot sit lower than ${frac(HEMNES.h + PLY + 1.5 + 1, 8)}. 39" only leaves ${frac(39 - PLY - 1.5, 8)} under the cleats - three quarters of an inch short.`,
      `That shelf then sets the rod. A 42" shirt hanging clear of a ${frac(p.lowZ, 8)} shelf needs the rod at ${frac(p.lowZ + 43, 8)}, which is why it is at ${frac(p.rodZ, 8)} rather than the 6'-3" first sketched. At 6'-3" the clothes reach ${frac(75 - 42, 8)} and the tallest dresser that fits under them is about 29-3/4".`,
      `Wall A can't match the others for depth. The return beside the entry door is ${frac(belowDoor, 8)}; take off a ${frac(cw, 8)} casing and 1/4" and the alcove shelves cap out at ${frac(alcDepth, 8)}.`,
      "Mounting: the drywall is up, so shelves can't be nailed straight to studs. Under each, screw a 3/4\" x 1-1/2\" cleat through the drywall into the studs, then set the shelf on the cleats.",
    ],
    wiring,
  };
}
