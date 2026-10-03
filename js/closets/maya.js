// Maya's reach-in: an East Star box at each end (drawers, rod above them, open shelf above that,
// no doors) with site-built plywood shelves filling the middle. The middle's lowest shelf sits
// high enough for a laundry basket. Above the cabinets, a plywood deck and one long shelf on
// dividers use the 26" that a 94" box leaves under the 10' ceiling. 3-panel sliding doors.
import { box, esRun, fixedShelves, packStock, collector } from "../model/builders.js";
import { PLY, frac, ftin } from "../lib/units.js";
import { parseFronts } from "./rohan.js";
import { shelfSlots, shelfControls, readShelves, spacingWarnings, LOOK } from "./common.js";
import { ES_WIDTHS } from "./master.js";

export const INFO = { id: "maya", name: "Maya's Closet", room: "Maya's room",
  stuff: "books", concept: "East Star in the middle + plywood ends", rev: "" };

export const FIELD = { W: 112.4, D: 29.8, ceiling: 120, stubL: 8.6, opening: 95.8, stubR: 8.1, wallAtOpening: 6.3, doorH: 96 };

export const DEFAULTS = {
  esPlan: "30, 30", esAlign: "centre", esTop: 84, depth: 24, fronts: "10, 11, 12", rodZ: 68,
  ...shelfSlots("e", [40, 74], [54, 64, 84]),
  ends: "ply", gableOn: false,
  ...shelfSlots("s", [30, 46, 62, 78], [16, 86]),
  aboveOn: true, above2On: true, aboveZ2: 102, aboveDepth2: 18, midDiv: true, drawersOut: false,
  finish: "white", lights: true,
};

export const CONTROLS = [
  ["East Star · in the middle, clear of the door frames", [
    { key: "esPlan", label: "Box widths", type: "text" },
    { key: "esAlign", label: "Where they sit", type: "select",
      options: [["centre", "Centred"], ["thirds", "On the outer door panels (one slide per drawer)"]] },
    { key: "esTop", label: "Height", type: "select", options: [["84", "84\""], ["90", "90\""], ["94", "94\""]] },
    { key: "depth", label: "Depth (whole closet)", min: 15.5, max: 24, step: 0.5 },
    { key: "rodZ", label: "Rod height (moves up as she grows)", min: 40, max: 80, step: 0.5 },
    { key: "fronts", label: "Drawer fronts, top → bottom", type: "text" },
    { key: "drawersOut", label: "Show the drawers open", type: "check" },
  ]],
  shelfControls("e", 5, "Shelves inside the East Star boxes"),
  ["The two ends", [
    { key: "ends", label: "What goes either side of the middle boxes", type: "select",
      options: [["ply", "Plywood shelves by Amir"], ["es", "East Star boxes (filler at each wall)"]] },
    { key: "gableOn", label: "Plywood gable at each join (plywood ends only)", type: "check" },
  ]],
  shelfControls("s", 6, "Shelves at the two ends"),
  ["Plywood over the boxes", [
    { key: "aboveOn", label: "Shelf right across, sitting on the box tops", type: "check" },
    { key: "above2On", label: "A second one higher up", type: "check" },
    { key: "aboveZ2", label: "Its height", min: 94, max: 112, step: 1 },
    { key: "aboveDepth2", label: "Its depth (shallower, you reach it over the header)", min: 12, max: 24, step: 1.5 },
    { key: "midDiv", label: "One divider in the middle, between the two shelves", type: "check" },
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
  // the slider: three panels, so one slide exposes a third and two slides expose two thirds
  const op0 = p.stubL, pw = p.opening / 3;
  const thirds = [0, 1, 2].map(i => [op0 + i * pw, op0 + (i + 1) * pw]);
  const slides = (a, b) => thirds.some(([s0, e0]) => a >= s0 - 0.1 && b <= e0 + 0.1) ? 1
    : [0, 1].some(i => a >= thirds[i][0] - 0.1 && b <= thirds[i + 1][1] + 0.1) ? 2 : 0;
  // boxes either centred, or sat on the outer panels so each drawer needs a single slide
  const onThirds = p.esAlign === "thirds" && esW.length === 2;
  const boxAt = onThirds
    ? [thirds[0][0] + (pw - esW[0]) / 2, thirds[2][0] + (pw - esW[1]) / 2]
    : (() => { let u = (W - esRun0) / 2; return esW.map(x => { const a = u; u += x; return a; }); })();
  const m0 = Math.min(...boxAt), m1 = Math.max(...boxAt.map((a, i) => a + esW[i]));
  const fronts = [...parseFronts(p.fronts, [7, 8, 9])].reverse();
  const eLv = readShelves(p, "e", 5);
  const es = { drawers: [], parts: [], modules: [] };
  esW.forEach((width, i) => {
    const r = add(esRun(w.T, { u0: boxAt[i], depth: d, top, doors: false, drawersOut: p.drawersOut,
      prefix: `M${i + 1}`, seed: 5 + i * 4,
      bays: [{ w: width, fronts, rods: [p.rodZ], levels: eLv, garment: "pants" }] }));
    es.drawers.push(...r.drawers);
  });
  const worstSlide = Math.max(...esW.map((width, i) => slides(boxAt[i], boxAt[i] + width)));

  // plywood shelves either side of the boxes and, when they sit on the outer panels, between them
  const lv = readShelves(p, "s", 6);
  const g = p.gableOn ? PLY : 0;
  if (onThirds) {
    const gap0 = boxAt[0] + esW[0], gap1 = boxAt[1];
    if (gap1 - gap0 > 10) add(fixedShelves(w.T, { u0: gap0 + g, u1: gap1 - g, depth: d, levels: lv, label: "Shelves · middle" }));
  }
  const gTop = p.aboveOn ? p.aboveZ - PLY : (lv[lv.length - 1] || top);
  const endFill = [];
  if (p.ends === "es") {
    // East Star at both ends too. Stock widths only go 15/18/21/24/30/36, so each end takes the
    // widest set that fits and the remainder becomes a filler scribed to the side wall.
    const run = (u0, u1, outerIsLeft, seed) => {
      const widths = packStock(u1 - u0);
      const used = widths.reduce((a, b) => a + b, 0), fill = (u1 - u0) - used;
      if (!used) return;
      // boxes butt the middle run; the filler lands against the side wall
      const start = outerIsLeft ? u0 + fill : u0;
      add(esRun(w.T, { u0: start, depth: d, top, doors: false,
        bays: widths.map(x => ({ w: x, levels: lv })), prefix: outerIsLeft ? "EL" : "ER", seed }));
      if (fill > 0.5) {
        const f0 = outerIsLeft ? u0 : u1 - fill;
        parts.push(box(w.T, "carcass", f0, f0 + fill, 0, d, 0, top,
          { mat: "oak", mark: outerIsLeft, label: `Filler, ${frac(fill, 8)}, at the wall` }));
        endFill.push(fill);
      }
    };
    run(0, m0, true, 31);
    run(m1, W, false, 37);
  } else {
    if (p.gableOn) for (const u of [m0, m1 + PLY])
      parts.push(box(w.T, "carcass", u - PLY, u, 0, d, 0, gTop, { mark: u === m0, label: "Gable, plywood meets East Star" }));
    add(fixedShelves(w.T, { u0: 0, u1: m0 - g, depth: d, levels: lv, label: "Shelves · left end" }));
    add(fixedShelves(w.T, { u0: m1 + g, u1: W, depth: d, levels: lv, label: "Shelves · right end" }));
  }
  const basket = lv.length ? lv[0] - PLY - 1.5 : top;

  // One plywood shelf right across, sitting straight on the box tops. The boxes carry the
  // middle 6 ft of it and the end walls carry the rest, so it needs nothing hanging from above.
  const aboveZ = top + PLY;
  if (p.aboveOn) {
    add(fixedShelves(w.T, { u0: 0, u1: W, depth: d, levels: [aboveZ], label: "Shelf on the box tops" }));
    // No posts under the top shelf. It is cleated along its whole back edge into the studs,
    // so every slice of it cantilevers over its 18" depth rather than spanning the room: about
    // 1/25" of droop at the front. Posts would only be needed if it rested on its two ends.
    if (p.above2On) add(fixedShelves(w.T, { u0: 0, u1: W, depth: p.aboveDepth2, levels: [p.aboveZ2], label: "Top shelf" }));
    // One divider on the centre line, which is also the seam between the two boxes, so it lands
    // straight over two box sides. It splits the long open band in two - it is not holding
    // anything up, the top shelf is cleated along its back edge.
    if (p.above2On && p.midDiv) {
      const mu = W / 2;
      parts.push(box(w.T, "carcass", mu - PLY / 2, mu + PLY / 2, 0, p.aboveDepth2, aboveZ + PLY, p.aboveZ2 - PLY,
        { mark: true, label: "Divider, on the centre line" }));
    }
  }

  const u0 = W - (p.stubL + p.opening), u1 = W - p.stubL;
  const door = { wall: "F", u0, u1, slab: p.opening / 3 + 1, h: p.doorH, roH: p.doorH + 2.5, swing: "slide", panels: 3, hingeU: u0, label: "3-track slider" };

  const endW = m0;   // each end run
  const esEnds = p.ends === "es";
  const endPlan = endFill.length ? packStock(endW) : [];
  if (!esW.length) warnings.push(`No usable box widths in "${p.esPlan}". East Star makes ${ES_WIDTHS.join(", ")}".`);
  // what matters is whether a drawer front overlaps a door-frame stub, not how wide the end run is
  if (m0 < p.stubL) warnings.push(`A drawer front reaches to ${frac(m0, 8)} and the left door frame comes in ${frac(p.stubL, 8)}. It would hit it on the way out.`);
  if (m1 > W - p.stubR) warnings.push(`A drawer front reaches to ${frac(m1, 8)} and the right door frame starts at ${frac(W - p.stubR, 8)}. It would hit it on the way out.`);
  if (worstSlide === 0) warnings.push(`A drawer front is wider than two door panels - it can never be fully opened.`);
  else if (worstSlide > 1) warnings.push(`Each drawer needs ${worstSlide} panel slides before it will open: a ${esW[0]}" box straddles two of the three ${frac(pw, 8)} door panels. Sitting them on the outer panels would take one slide, but it leaves under 1" to the door-frame stubs - not enough for framing tolerance. Two slides is the better trade.`);
  if (basket < 24) warnings.push(`Only ${frac(basket, 8)} under the lowest end shelf. A tall hamper wants about 28".`);
  if (eLv.length && eLv[0] < fronts.reduce((a, b) => a + b, 0) + 1) warnings.push(`The lowest shelf inside the boxes (${frac(eLv[0], 8)}) is below the top of the drawers (${frac(fronts.reduce((a, b) => a + b, 0), 8)}).`);
  if (eLv.some(z => Math.abs(z - p.rodZ) < 3)) warnings.push(`A shelf lands within 3" of the rod at ${frac(p.rodZ, 8)}. Hangers need about 2" of clear above the rod.`);
  if (p.aboveOn && p.above2On) {
    const droop = (20 / 144) * p.aboveDepth2 ** 4 / (8 * 1.3e6 * (PLY ** 3 / 12));
    if (droop > 0.12) warnings.push(`At ${frac(p.aboveDepth2, 8)} deep the top shelf's front edge droops ${frac(droop, 16)} off its back cleat. Make it shallower or put a post under it.`);
    if (p.aboveZ2 - aboveZ < 12) warnings.push(`Only ${frac(p.aboveZ2 - aboveZ - PLY, 8)} between the two shelves above the boxes.`);
  }
  if (top + PLY > p.doorH - 2) warnings.push(`The boxes top out at ${frac(top, 8)}, so the shelf on them lands at ${frac(top + PLY, 8)} against a ${frac(p.doorH, 8)} header - you will not be able to see onto it. 84" boxes leave room for a shelf you can look into.`);
  const clothesTo = p.rodZ - 26;   // a six-year-old's clothes, not an adult's
  const clash = eLv.filter(z => z > clothesTo - 1 && z < p.rodZ - 2);
  if (clash.length) warnings.push(`A shelf at ${clash.map(z => frac(z, 8)).join(", ")} cuts through the hanging clothes, which reach down to about ${frac(clothesTo, 8)}.`);
  const high = [...lv, ...(p.aboveOn ? [aboveZ] : [])].filter(z => z > p.doorH + 0.5);
  if (high.length) warnings.push(`This is a reach-in, so the ${frac(p.doorH, 8)} header is the reach limit. ${high.map(z => frac(z, 8)).join(", ")} sit above it.`);
  if (d > D - 5) warnings.push(`At ${frac(d, 8)} deep there is only ${frac(D - d, 8)} in front of the boxes. A 3-track slider needs about 5".`);
  warnings.push(...spacingWarnings(lv, "End shelves"));

  const drawers = es.drawers;
  return {
    info: { ...INFO, concept: esEnds ? "East Star right across, filler at the walls" : "East Star in the middle + plywood ends" },
    params: p,
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
      { k: "Layout", v: onThirds ? `${frac(m0, 8)} + ${esW[0]}" + ${frac(boxAt[1] - boxAt[0] - esW[0], 8)} + ${esW[1]}" + ${frac(W - m1, 8)}` : `${frac(endW, 8)} + ${esW.join(" + ")}" + ${frac(endW, 8)}`,
        s: onThirds ? `boxes on the outer door panels, plywood between and beside them` : `plywood ends, East Star middle, all ${frac(d, 8)} deep` },
      { k: "Rods", v: `${esW.length} × ${frac(esW[0] - 1.5, 8)}`, s: `at ${frac(p.rodZ, 8)}, ${fronts.length} drawers under each` },
      { k: "The two ends", v: esEnds ? `East Star ${endPlan.join(" + ")}"` : `plywood, ${frac(endW - g, 8)} wide`,
        s: esEnds ? `${frac(endFill[0] || 0, 8)} filler at each wall; ${lv.length} shelves inside` : `${lv.length} shelves${p.gableOn ? ", on a plywood gable" : ", cleated into the box side"}` },
      { k: "Inside the boxes", v: `${eLv.length} shelves`, s: `at ${eLv.join('", ')}", rod at ${frac(p.rodZ, 8)}` },
      { k: "Under the lowest shelf", v: frac(basket, 8), s: "clear at the cleats, for a laundry basket" },
      { k: "Clear of the door frames", v: `${frac(m0 - p.stubL, 8)} / ${frac((W - m1) - p.stubR, 8)}`, s: "left / right, box face to frame" },
      { k: "To open a drawer", v: worstSlide === 1 ? "one panel slide" : worstSlide ? `${worstSlide} panel slides` : "cannot", s: `panels are ${frac(pw, 8)}; a box is ${esW.join("/")}"` },
      { k: "Shelf on the box tops", v: p.aboveOn ? frac(aboveZ, 8) : "off", s: p.aboveOn ? `${frac((p.above2On ? p.aboveZ2 : p.ceiling) - aboveZ - PLY, 8)} clear above it, under the ${frac(p.doorH, 8)} header` : "" },
      { k: "Top shelf", v: p.above2On ? `${frac(p.aboveZ2, 8)} × ${frac(p.aboveDepth2, 8)} deep` : "off", s: p.above2On ? `${frac(p.aboveZ2 - p.doorH, 8)} above the header, cleated along the back${p.midDiv ? `, one divider on the centre line at ${frac(W / 2, 8)}` : ", no posts"}` : "" },
    ],
    titleMeta: [
      { k: "Closet", v: `${ftin(W)} × ${ftin(D)}` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "East Star", v: frac(esRun0, 8) },
      { k: "Drawers", v: `${drawers.length}` },
    ],
    gcText: [
      `MAYA'S CLOSET - ${frac(W, 8)} wide, everything ${frac(d, 8)} deep.`,
      `EAST STAR, centred: ${esW.join('" + ')}" boxes, ${frac(top, 8)} tall, NO doors. Each: ${fronts.length} drawers at the bottom (${fronts.slice().reverse().join('", ')}" fronts, top down), rod at ${frac(p.rodZ, 8)}, shelves at ${eLv.join('", ')}". Floor-standing, screwed through the back into studs.`,
      `They start ${frac(m0, 8)} in from each end, so the drawers pull straight out through the opening and clear the door frames.`,
      ...(p.gableOn && !esEnds ? [`AMIR: one 3/4" plywood gable at each join, floor to ${frac(gTop, 8)}, standing against the side of the box. The end shelves land on it.`] : []),
      ...(esEnds ? [`EAST STAR, the two ends: one ${endPlan.join(" + ")}" box at each end, ${frac(top, 8)} tall, ${frac(d, 8)} deep, no doors, shelves at ${lv.map(z => frac(z, 8)).join(", ")}. ${frac(endFill[0] || 0, 8)} filler at each side wall, scribed. Boxes butt the middle run.`] : []),
      `AMIR:${esEnds ? "" : ` 3/4" birch plywood shelves on 1x2 cleats into the studs, ${frac(endW - g, 8)} wide at each end, ${frac(d, 8)} deep, at ${lv.map(z => frac(z, 8)).join(", ")}.`}${p.aboveOn ? `${esEnds ? "" : " Plus"} one shelf right across the full ${frac(W, 8)}, sitting on the box tops at ${frac(aboveZ, 8)}.` : ""}${p.above2On ? ` And a top shelf at ${frac(p.aboveZ2, 8)}, only ${frac(p.aboveDepth2, 8)} deep, on 1x2 cleats into the studs.` : ""}${p.above2On && p.midDiv ? ` One 3/4" divider between the two upper shelves, on the centre line at ${frac(W / 2, 8)} from the left wall - it lands on the seam between the two boxes.` : ""}`,
      `Nothing below ${frac(lv[0] || 0, 8)} at the ends - ${frac(basket, 8)} clear for laundry baskets.`,
      `Paint room colour, all sides.`,
    ].join("\n"),
    warnings,
    notes: [
      `The East Star boxes are centred on purpose. At the ends, a ${esW[0]}" drawer front would have to pass the door-frame stub (${frac(p.stubL, 8)} left, ${frac(p.stubR, 8)} right) on its way out and would hit it. Centred, they sit ${frac(m0 - p.stubL, 8)} and ${frac((W - m1) - p.stubR, 8)} clear of those stubs and pull straight through the opening. That clearance is the reason to keep them centred: framing moves more than an inch, and boxes sat on the outer panels would have under 1" to spare.`,
      esEnds
        ? `All East Star: ${endPlan.join(" + ")}" at each end and ${esW.join(" + ")}" in the middle, ${frac(esRun0 + 2 * endPlan.reduce((a, b) => a + b, 0), 8)} of box in a ${frac(W, 8)} wall. Stock widths are ${ES_WIDTHS.join(", ")}" only, so the ${frac(endFill[0] || 0, 8)} that will not divide becomes a filler at each side wall, where it scribes to the plaster and nobody sees it.`
        : `East Star only makes ${ES_WIDTHS.join(", ")}" wide, so the boxes come to ${frac(esRun0, 8)} and the plywood takes the ${frac(endW, 8)} left at each end.`,
      `The boxes stop at ${frac(d, 8)} deep because that is East Star's maximum. The ${frac(D - d, 8)} in front is not wasted: a 3-track slider needs about 5" for its tracks.`,
      `Bought boxes show as white oak in the 3D, site-built plywood in the finish you pick.`,
      `The rod starts at ${frac(p.rodZ, 8)} and moves up as she grows.`,
      `${frac(top, 8)} boxes rather than 94". A 94" box puts its shelf at 94-3/4", right under the ${frac(p.doorH, 8)} header, where you can neither see onto it nor reach across it. At ${frac(top, 8)} the shelf lands at ${frac(aboveZ, 8)} with ${frac(p.aboveZ2 - aboveZ - PLY, 8)} of clear, visible space over it, and the awkward height moves up to the ${frac(p.aboveZ2, 8)} shelf where it belongs.`,
      ...(p.midDiv && p.above2On ? [`The one divider between the upper shelves is there to split a ${frac(W, 8)} run in two so stacks have something to lean on, not to hold the shelf up - that shelf is cleated along its whole back edge and droops about 1/25" at the front whatever its length. It sits on the centre line, which is also the seam between the two boxes, so it bears straight onto two box sides.`] : []),
      `That top shelf is only ${frac(p.aboveDepth2, 8)} deep on purpose: you reach it over the header, so your arm cannot go 24" back.`,
      `The shelf across needs nothing hanging from the ceiling. Sitting straight on the ${frac(top, 8)} box tops, the boxes carry the middle ${frac(esRun0, 8)} of it continuously and the end walls carry the ${frac(endW - g, 8)} at each side. That leaves ${frac(p.ceiling - aboveZ, 8)} open above it.`,
      ...(esEnds ? [] : [`The end shelves sit on the back wall, the side wall, and a third cleat screwed into the side of the East Star box${p.gableOn ? "" : " - no gable, so none of that 20-odd inches is given up to a slab of plywood"}. On the shaker grade that side is plywood; on the chipboard grade use coarse cabinet screws.`]),
      `The opening is ${frac(p.doorH, 8)} tall in a ${ftin(p.ceiling)} room, so ${frac(p.ceiling - p.doorH, 8)} of wall sits above it and nothing above that header can be reached. ${frac(top, 8)} boxes plus the shelf at ${frac(p.aboveZ, 8)} stay under it.`,
    ],
  };
}
