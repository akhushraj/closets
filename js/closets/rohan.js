// Rohan's closet. Wall A is the alcove, wall B the long wall, wall C the short one at the end,
// wall D the entry door. The shelves above the rod run round both B and C as one L whichever
// layout you pick. What moves is the rod and the shelf under it: wall C in one, wall B in the
// other, with the HEMNES underneath. All plywood bar the dresser.
import { hangRun, fixedShelves, floorItem, collector, box } from "../model/builders.js";
import { shelfSlots as slots, shelfControls, readShelves, spacingWarnings } from "./common.js";
import { PLY, frac, ftin } from "../lib/units.js";

export const INFO = { id: "rohan", name: "Rohan's Closet", room: "Bedroom 2", stuff: "books",
  concept: "L shelves above · rod on one wall", rev: "" };

// Measured in the field (2026-09-18). These always override stored or default values.
export const FIELD = { closetW: 46.2, mainD: 52.1, alcoveW: 25.2, totalL: 78.7, ceiling: 120,
  doorAt: 31.1, doorRO: 30.3, doorSlab: 28, doorH: 96, hinge: "near" };

// Default is IKEA HAVSTA 6-drawer, 47-5/8 x 18-1/2 x 35 - the widest thing that still clears
// the bottom of the hanging clothes. Adjust to whatever chest you actually buy.

export const DEFAULTS = {
  layout: "rodB", rodZ: 72, hang: 36, bDepth: 21, cDepth: 24,
  ...slots("l", [76, 96], [108, 111, 114]),   // above the rod, these run the full L
  lowOn: false, dresser: true, dressW: 47.625, dressD: 18.5, dressH: 35,
  chestOn: true, chestW: 14, chestD: 18, chestH: 50,
  s1: 16, s1on: false, s2: 24, s2on: true, s3: 36, s3on: true, s4: 48, s4on: true,
  s5: 60, s5on: true, s6: 72, s6on: true, s7: 84, s7on: true, s8: 96, s8on: true,
  casingW: 2.25, hamperW: 16, hamperD: 16, hamperH: 20,
  finish: "oak", lights: true,
};

export const CONTROLS = [
  ["Layout", [
    { key: "layout", label: "The rod and the dresser go on", type: "select",
      options: [["rodC", "Wall C — 24\" deep"], ["rodB", "Wall B — 21\" deep"]] },
    { key: "rodZ", label: "Rod height", min: 60, max: 90, step: 0.5 },
    { key: "hang", label: "Hanging height (the shelf below sits this far down)", min: 30, max: 48, step: 1 },
    { key: "bDepth", label: "Wall B depth", min: 14, max: 24, step: 0.5 },
    { key: "cDepth", label: "Wall C depth", min: 14, max: 24, step: 0.5 },
  ]],
  shelfControls("l", 5, "Above the rod · these run the full L on B and C"),
  ["Under the rod · dresser shelf", [
    { key: "lowOn", label: "Shelf along the rod wall, under the clothes", type: "check" },
    { key: "dresser", label: "Chest of drawers under it", type: "check" },
    { key: "dressW", label: "Chest width", min: 24, max: 60, step: 0.125 },
    { key: "dressD", label: "Chest depth", min: 14, max: 24, step: 0.125 },
    { key: "dressH", label: "Chest height", min: 24, max: 48, step: 0.125 },
  ]],
  ["Narrow chest in the corner · if storage gets tight", [
    { key: "chestOn", label: "Stand one in the far corner", type: "check" },
    { key: "chestW", label: "Width", min: 10, max: 24, step: 1 },
    { key: "chestD", label: "Depth", min: 12, max: 20, step: 1 },
    { key: "chestH", label: "Height", min: 30, max: 72, step: 1 },
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

  // The rod wall owns the inside corner and runs its full length; the other starts clear of it.
  // The shelves above the rod run round both as one L either way.
  const onC = p.layout === "rodC", bd = p.bDepth, cd = p.cDepth;
  const rodW = onC ? w.T : w.L, othW = onC ? w.L : w.T;
  const rodLen = onC ? W : M, rodDepth = onC ? cd : bd;
  const othU0 = onC ? 0 : bd, othU1 = onC ? M - cd : W, othDepth = onC ? bd : cd;
  const othRun = othU1 - othU0;

  const lLv = readShelves(p, "l", 5);                      // the full-L levels
  const overRod = lLv[0] ?? p.ceiling;
  const lowZ = p.rodZ - p.hang;                            // the shelf sits a hang's height below
  const clothesTo = p.rodZ - p.hang;                       // where the clothes stop

  // the rod, its wall, and the shelf right across under it
  add(hangRun(rodW, { u0: 0, u1: rodLen, depth: rodDepth, rodZ: p.rodZ, coatsTo: 0.1, hat: false }));
  if (p.lowOn) add(fixedShelves(rodW, { u0: 0, u1: rodLen, depth: rodDepth, levels: [lowZ], label: "Shelf under the clothes" }));
  const DR = { w: p.dressW, d: p.dressD, h: p.dressH };
  if (p.dresser) {   // the chest, standing under the clothes
    const a = 1.5, b = a + DR.w, v1 = 0.5 + DR.d, fh = (DR.h - 3) / 3;
    parts.push(box(rodW, "dresser", a, b, 0.5, v1 - 0.6, 0, DR.h - 0.75, { label: "Chest of drawers" }));
    parts.push(box(rodW, "dresser", a, b, 0.5, v1, DR.h - 0.75, DR.h, { mark: true, label: "Chest top" }));
    for (let i = 0; i < 3; i++) {
      const z0 = 1 + i * (fh + 0.4);
      parts.push(box(rodW, "dresserfront", a + 0.4, b - 0.4, v1 - 0.6, v1, z0, z0 + fh));
    }
    modules.push(box(rodW, "dresser", a, b, 0.5, v1, 0, 0, { label: "Chest of drawers", sub: `${frac(DR.w, 8)} × ${frac(DR.d, 8)} × ${frac(DR.h, 8)}` }));
  }

  add(fixedShelves(rodW, { u0: 0, u1: rodLen, depth: rodDepth, levels: lLv, label: "The L" }));
  if (othRun > 8) add(fixedShelves(othW, { u0: othU0, u1: othU1, depth: othDepth, levels: lLv, label: "The L, round the corner" }));

  // a narrow tall chest in the corner of the wall without the rod, at the end AWAY from the rod
  // wall, so it is not up against the dresser or the shelves on that side
  if (p.chestOn && othRun > p.chestW + 2) {
    const c0 = onC ? othU0 + 1 : othU1 - p.chestW - 1, c1 = c0 + p.chestW, fh = (p.chestH - 3) / 4;
    parts.push(box(othW, "dresser", c0, c1, 0.5, 0.5 + p.chestD - 0.6, 0, p.chestH - 0.75, { label: "Narrow chest" }));
    parts.push(box(othW, "dresser", c0, c1, 0.5, 0.5 + p.chestD, p.chestH - 0.75, p.chestH, { mark: true, label: "Chest top" }));
    for (let i = 0; i < 4; i++) {
      const z0 = 1 + i * (fh + 0.4);
      parts.push(box(othW, "dresserfront", c0 + 0.4, c1 - 0.4, 0.5 + p.chestD - 0.6, 0.5 + p.chestD, z0, z0 + fh));
    }
    modules.push(box(othW, "dresser", c0, c1, 0.5, 0.5 + p.chestD, 0, 0, { label: "Narrow chest", sub: `${p.chestW} × ${p.chestD} × ${p.chestH}"` }));
  }

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
  const underCleats = lowZ - PLY - 1.5;
  // room in front of the dresser, measured off its own face, not the shelf's
  const dFront = 0.5 + DR.d;
  const inFront = onC ? Math.min(M, L - alcDepth) - dFront : W - dFront;
  const aisle = onC ? M - cd : W - bd;
  if (p.lowOn && p.dresser && underCleats < DR.h)
    warnings.push(`The shelf lands at ${frac(lowZ, 8)}, leaving ${frac(underCleats, 8)} under its cleats, and the chest is ${frac(DR.h, 8)} tall. Raise the rod or shorten the hang so the shelf sits at ${frac(DR.h + PLY + 1.5 + 1, 8)} or higher.`);
  if (p.chestOn && p.chestH > overRod - 2)
    warnings.push(`The chest is ${frac(p.chestH, 8)} tall and the first L shelf is at ${frac(overRod, 8)}. It won't go under.`);
  if (p.chestOn && othRun <= p.chestW + 2)
    warnings.push(`${othName} is only ${frac(othRun, 8)} clear of the corner - no room for a ${frac(p.chestW, 8)} chest.`);
  if (p.hang < 34) warnings.push(`${frac(p.hang, 8)} of hanging is short - a jacket is about 34" on the hanger.`);
  if (p.dresser && !p.lowOn && DR.h > clothesTo)
    warnings.push(`The chest is ${frac(DR.h, 8)} tall and the clothes hang down to ${frac(clothesTo, 8)}, so the bottom ${frac(DR.h - clothesTo, 8)} of every shirt rests on its top. Keep it under ${frac(clothesTo, 8)}.`);
  if (p.dresser && DR.d > rodDepth + 0.5)
    warnings.push(`The chest is ${frac(DR.d, 8)} deep against the ${frac(rodDepth, 8)} shelf above it, so it stands ${frac(DR.d - rodDepth, 8)} proud of the shelf front.`);
  if (p.dresser && DR.w > rodLen)
    warnings.push(`The chest is ${frac(DR.w, 8)} wide and that wall is only ${frac(rodLen, 8)}. It will not go in.`);
  else if (p.dresser && DR.w > rodLen - 1)
    warnings.push(`The chest is ${frac(DR.w, 8)} into a ${frac(rodLen, 8)} wall - ${frac(rodLen - DR.w, 8)} total to spare. Measure before you buy.`);
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
      { k: "The L, above the rod", v: lLv.map(z => frac(z, 8)).join(", "), s: `${rodName} full length, ${othName} ${frac(othRun, 8)} round the corner` },
      { k: "Hanging", v: frac(p.hang, 8), s: `rod ${frac(p.rodZ, 8)}, shelf under it ${frac(lowZ, 8)}` },
      { k: "Under that shelf", v: p.lowOn ? frac(underCleats, 8) : "open", s: p.lowOn && p.dresser ? `clear at the cleats; HEMNES is ${DR.h}" tall` : "" },
      { k: "In front of the dresser", v: frac(inFront, 8), s: `${frac(inFront - 18, 8)} left with a drawer out; aisle off the shelf face is ${frac(aisle, 8)}` },
      { k: "Open as you walk in", v: frac(onC ? W : W - bd, 8), s: onC ? `wall B carries nothing below the L, so the floor runs clear to it` : `wall B's run stops you ${frac(W - bd, 8)} in` },
      ...(p.chestOn ? [{ k: "Corner chest", v: `${p.chestW} × ${p.chestD} × ${p.chestH}"`, s: `${onC ? "notch corner" : "wall D corner"} of ${othName}, clear of ${rodName}` }] : []),
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
      ...(p.lowOn ? [`  One shelf along it at ${frac(lowZ, 8)}, ${frac(p.hang, 8)} below the rod, ${frac(underCleats, 8)} clear under its cleats.${p.dresser ? ` An IKEA HEMNES 3-drawer (${DR.w} x ${DR.d} x ${DR.h}") stands under it.` : ""}`] : []),
      `  Shelves above the rod at ${lLv.map(z => frac(z, 8)).join(", ")}.`,
      ``,
      `${othName.toUpperCase()} (${frac(othDepth, 8)} deep, starting ${frac(othU0, 8)} off the corner, ${frac(othRun, 8)} long): only the ${lLv.length} shelves above the rod, at the same heights, so they carry round as one L. Nothing below them.`,
      ``,
      ...(p.chestOn ? [`  A narrow chest ${p.chestW} x ${p.chestD} x ${p.chestH}" stands in the ${onC ? "notch" : "wall D"} corner of ${othName}, under the ${frac(overRod, 8)} shelf, clear of ${rodName}.`] : []),
      ``,
      `WALL A alcove: ${alcLevels.length} shelves at ${alcLevels.join('", ')}", ${frac(alcDepth, 8)} deep (the entry door casing caps it), wall to wall at ${frac(A, 8)}.`,
      `Front edge on every shelf: 3/4" x 1-1/2" solid nosing - it hides the LED channel.`,
      `LED: single-colour 24V strip in an aluminium channel under every shelf, behind the nosing. One driver, one trunk down the back corner, a WAGO pair per shelf. See the A-4 tab.`,
    ].join("\n"),
    warnings,
    notes: [
      `The shelves above the rod are the same either way - they run round B and C as one L. What the layout changes is which wall gets the rod and the dresser shelf under it. ${rodName} gives ${frac(rodLen, 8)} of rod at ${frac(rodDepth, 8)} deep; the other would give ${frac(onC ? M : W, 8)} at ${frac(onC ? bd : cd, 8)}.`,
      `${othName} carries only the L shelves, and it starts ${frac(othU0, 8)} off the corner so it never runs into the hanging clothes.`,
      `That matters for how the room feels. ${onC ? `With the rod on wall C, wall B has nothing below ${frac(overRod, 8)}, so you walk in to ${frac(W, 8)} of clear floor and can turn to wall C on your right or wall A on your left from where you stand.` : `With the rod on wall B, its run stops you ${frac(W - bd, 8)} in, and you work in the strip between it and the door wall.`}`,
      `The HEMNES is ${DR.h}" tall, so the shelf over it cannot sit lower than ${frac(DR.h + PLY + 1.5 + 1, 8)}. At ${frac(p.hang, 8)} of hanging the shelf lands at ${frac(lowZ, 8)} and clears it by ${frac(underCleats - DR.h, 8)}.`,
      ...(!p.lowOn && p.dresser ? [`Nothing over the dresser, so the clothes hang past it. At ${frac(p.hang, 8)} they reach ${frac(clothesTo, 8)} against a ${DR.h}" dresser top - fine at his size now, and the rod moves up when it stops being.`] : []),
      `${frac(p.hang, 8)} of hanging clears a jacket, which is about 34" on the hanger. Only a full-length coat would want more, and that would push the rod to ${frac(lowZ + 43, 8)}.`,
      `Room to open a drawer is measured off the dresser's own face, ${frac(DR.d, 8)} off the wall - not off the ${frac(rodDepth, 8)} shelf above it. That leaves ${frac(inFront, 8)} here, ${frac(inFront - 18, 8)} with a drawer pulled right out.`,
      `Wall A can't match the others for depth. The return beside the entry door is ${frac(belowDoor, 8)}; take off a ${frac(cw, 8)} casing and 1/4" and the alcove shelves cap out at ${frac(alcDepth, 8)}.`,
      "Mounting: the drywall is up, so shelves can't be nailed straight to studs. Under each, screw a 3/4\" x 1-1/2\" cleat through the drywall into the studs, then set the shelf on the cleats.",
    ],
    wiring,
  };
}
