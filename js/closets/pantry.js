// Pantry, oriented like the field sketch: door at the lower left (LHI, swings in).
// L-shaped 24"-deep quartz/porcelain counter on the back and right walls, outside the door swing;
// open plywood shelves under it (first shelf raised off the floor) and 12"-deep open shelves above.
import { box, diagPanel, polyPart, fixedShelves, collector } from "../model/builders.js";
import { PLY, frac, ftin } from "../lib/units.js";
import { shelfSlots, shelfControls, readShelves, spacingWarnings, LOOK, PLYWOOD_NOTE } from "./common.js";

export const INFO = { id: "pantry", name: "Pantry", room: "Kitchen", stuff: "pantry", concept: "L counter + open shelves", rev: "" };

export const FIELD = { W: 60.6, D: 53.8, ceiling: 120, doorAt: 2.5, doorRO: 27.9, doorSlab: 26, doorH: 96, outletZ: 42.4,
  outBack: 29.9,        // back wall, from the left
  outLeft: 9.6,         // left wall, from the back wall (height not recorded)
  outRightB: 8.5,       // right wall, from the back wall
  outRightF: 11.3 };    // right wall, from the front (height not recorded)

export const DEFAULTS = {
  counterDepth: 24, counterZ: 36, top: "quartz", underOn: true, underZ: 16, upDepth: 15, maxBay: 20, sideUprights: false, railH: 3.5, diagCorner: true,
  ...shelfSlots("u", [54, 68, 82, 96, 110], [48]),
  finish: "white", lights: true,
};

export const CONTROLS = [
  ["Counter · L-shaped", [
    { key: "counterDepth", label: "Depth", min: 18, max: 26, step: 0.5 },
    { key: "counterZ", label: "Height (top)", min: 34, max: 38, step: 0.25 },
    { key: "top", label: "Top", type: "select", options: [["quartz", "Quartz (3 cm)"], ["porcelain", "Porcelain slab (12 mm on plywood)"]] },
    { key: "underOn", label: "Shelf under the counter", type: "check" },
    { key: "underZ", label: "Its height (top)", min: 8, max: 24, step: 0.5 },
    { key: "diagCorner", label: "Diagonal divider at the corner", type: "check" },
    { key: "sideUprights", label: "Extra uprights between it and the walls", type: "check" },
    { key: "maxBay", label: "Widest bay, when those are on", min: 14, max: 44, step: 1 },
    { key: "railH", label: "Front cleat, on edge", type: "select",
      options: [["1.5", "1x2 · 1-1/2\""], ["2.5", "1x3 · 2-1/2\""], ["3.5", "1x4 · 3-1/2\""]] },
  ]],
  shelfControls("u", 6, "Open shelves above the counter", [
    { key: "upDepth", label: "Their depth", min: 10, max: 16, step: 0.5 },
  ]),
  LOOK,
];

export function build(p) {
  p = { ...p, ...FIELD };
  const W = p.W, D = p.D, t = 4.5, cd = p.counterDepth, cz = p.counterZ;
  const outline = [[0, 0], [W, 0], [W, D], [0, D]];
  const walls = [
    { id: "T", name: "Back wall", a: [0, 0], b: [W, 0] },
    { id: "R", name: "Right wall", a: [W, 0], b: [W, D] },
    { id: "B", name: "Door wall", a: [W, D], b: [0, D], hidden: true },
    { id: "L", name: "Left wall", a: [0, D], b: [0, 0] },
  ];
  const w = Object.fromEntries(walls.map(x => [x.id, x]));
  const { parts, modules, add } = collector();
  const warnings = [];
  const topT = p.top === "quartz" ? 1.25 : 0.5, sub = cz - topT;

  // outlets, as measured in the field. A duplex plate is about 2-3/4" x 4-1/2".
  const outlet = (wall, u, z, label) =>
    parts.push(box(wall, "outlet", u - 1.375, u + 1.375, 0, 0.6, z - 2.25, z + 2.25, { mark: true, label }));
  outlet(w.T, p.outBack, p.outletZ, "Outlet");
  outlet(w.R, p.outRightB, p.outletZ, "Outlet");
  outlet(w.R, D - p.outRightF, p.outletZ, "Outlet");
  outlet(w.L, D - p.outLeft, p.outletZ, "Outlet");

  // The counter is a row of open plywood boxes: uprights stand on the floor, a 1x2 on edge runs
  // across their front edges, and the sub-top rests on the uprights, the 1x2 and the wall cleats.
  const corner = W - cd, uD = cd - PLY, tz = sub - PLY;
  const bays = (a, b) => {   // interior upright positions along a run
    const n = Math.max(1, Math.ceil((b - a) / p.maxBay));
    return Array.from({ length: n - 1 }, (_, i) => a + (b - a) * (i + 1) / n);
  };
  // the diagonal carries the corner; these only break the runs between it and the walls
  const backG = p.sideUprights ? bays(0, corner) : [], rightG = p.sideUprights ? bays(cd, D) : [];

  parts.push(box(w.T, "shelf", 0, W, 0, cd, tz, sub));
  parts.push(box(w.R, "shelf", cd, D, 0, cd, tz, sub));
  parts.push(box(w.T, "counter", 0, W, 0, cd + 1, sub, cz, { mark: true, label: p.top === "quartz" ? "Quartz top" : "Porcelain top" }));
  parts.push(box(w.R, "counter", cd + 1, D, 0, cd + 1, sub, cz));

  if (p.diagCorner) parts.push(diagPanel(w.T, "carcass", [corner, cd], [W, 0], PLY, 0, tz, { mark: true, label: "Diagonal" }));
  else parts.push(box(w.T, "carcass", corner - PLY, corner, 0, uD, 0, tz, { mark: true, label: "Upright" }));
  for (const g of backG) parts.push(box(w.T, "carcass", g - PLY / 2, g + PLY / 2, 0, uD, 0, tz));
  for (const g of rightG) parts.push(box(w.R, "carcass", g - PLY / 2, g + PLY / 2, 0, uD, 0, tz));
  const rh = +p.railH;
  parts.push(box(w.T, "cleat", 0, corner, uD, cd, tz - rh, tz, { mark: true, label: `1x${rh + 0.5} on edge` }));
  parts.push(box(w.R, "cleat", cd, D, uD, cd, tz - rh, tz));
  parts.push(box(w.T, "cleat", 0, W, 0, PLY, tz - 1.5, tz));      // back wall
  parts.push(box(w.R, "cleat", 0, D, 0, PLY, tz - 1.5, tz));      // right wall
  parts.push(box(w.L, "cleat", D - cd, D, 0, PLY, tz - 1.5, tz));  // left wall
  parts.push(box(w.B, "cleat", 0, cd, 0, PLY, tz - 1.5, tz));      // front wall, right leg
  modules.push(box(w.T, "counter", 0, W, 0, cd, 0, 0, { label: "Counter", sub: `${frac(cd, 8)} deep at ${frac(cz, 8)}` }));
  modules.push(box(w.R, "counter", cd, D, 0, cd, 0, 0, { label: "Counter", sub: "right leg" }));

  if (p.underOn) {   // one shelf per bay, so nothing spans past an upright
    const sd = cd - 1, z0 = p.underZ - PLY;   // 1" shy of the front edge
    const shelf = (wall, u0, u1) => add(fixedShelves(wall, { u0, u1, depth: sd, levels: [p.underZ],
      label: "Under-counter shelf", nosing: 0.75, nosingT: 0.25, led: false }));
    const be = [0, ...backG.flatMap(g => [g - PLY / 2, g + PLY / 2]), corner - PLY];
    const re = [cd, ...rightG.flatMap(g => [g - PLY / 2, g + PLY / 2]), D];
    if (p.diagCorner) {
      // the bays that meet the diagonal are single shelves cut to it, not rectangles with gaps
      for (let i = 0; i + 2 < be.length; i += 2) shelf(w.T, be[i], be[i + 1]);
      for (let i = 2; i + 1 < re.length; i += 2) shelf(w.R, re[i], re[i + 1]);
      const bEnd = be[be.length - 2], rEnd = re[1];   // the uprights either side of the corner
      const dxAt = y => corner + (cd - y);            // the diagonal's x at a given plan y
      parts.push(polyPart(w.T, "shelf", [[bEnd, 0], [W, 0], [dxAt(sd), sd], [bEnd, sd]], z0, p.underZ,
        { mark: true, label: "Corner shelf, cut to the diagonal" }));
      parts.push(polyPart(w.R, "shelf", [[W, 0], [dxAt(sd), sd], [W - sd, rEnd], [W, rEnd]], z0, p.underZ,
        { mark: true, label: "Corner shelf, cut to the diagonal" }));
      for (const [wall, u0, u1] of [[w.T, bEnd, W], [w.R, 0, rEnd]])   // the wall cleats under them
        parts.push(box(wall, "cleat", u0, u1, 0, PLY, z0 - 1.5, z0));
    } else {
      for (let i = 0; i < be.length; i += 2) shelf(w.T, be[i], be[i + 1]);
      for (let i = 0; i < re.length; i += 2) shelf(w.R, re[i], re[i + 1]);
      shelf(w.T, corner, W);   // the blind corner, reached from the right leg
    }
  }
  const up = readShelves(p, "u", 6);
  const edge = { nosing: 1.25, nosingT: 0.25 };   // 1/4" x 1-1/4" poplar: just deep enough to hide the LED channel
  add(fixedShelves(w.T, { u0: 0, u1: W, depth: p.upDepth, levels: up, label: "Open shelves", ...edge }));
  add(fixedShelves(w.R, { u0: p.upDepth, u1: D, depth: p.upDepth, levels: up, label: "Open shelves", ...edge }));

  // door on the bottom wall, LHI: hinge on the left jamb, swings in along the left wall
  const u0 = W - (p.doorAt + p.doorRO), u1 = W - p.doorAt;
  const door = { wall: "B", u0, u1, slab: p.doorSlab, h: p.doorH, roH: p.doorH + 2.5, swing: "in", hingeU: u1 - 1, label: "LHI" };
  const swingTop = D - p.doorSlab - 1;
  if (cd > swingTop) warnings.push(`At ${frac(cd, 8)} deep, the back counter runs into the door swing (it reaches ${frac(swingTop, 8)} from the back wall).`);
  if (corner < p.doorAt + p.doorRO) warnings.push("The right leg of the counter reaches into the doorway.");
  if (up.length && up[0] < cz + 16) warnings.push(`Only ${frac(up[0] - cz - PLY, 8)} between the counter and the first shelf. Appliances want about 18".`);
  const widest = Math.max((corner) / (backG.length + 1), (D - cd) / (rightG.length + 1));
  // 3/4" x rh on edge, simply supported, carrying 12" of a 43 psf counter
  const sag = L => 5 * (43 / 144 * 12) * L ** 4 / (384 * 1.3e6 * (0.75 * rh ** 3 / 12));
  const need = [1.5, 2.5, 3.5].find(h => 5 * (43 / 144 * 12) * widest ** 4 / (384 * 1.3e6 * (0.75 * h ** 3 / 12)) < widest / 720);
  if (sag(widest) > widest / 720)
    warnings.push(`The widest bay is ${frac(widest, 8)} and a 1x${rh + 0.5} on edge sags ${frac(sag(widest), 16)} across it (${frac(widest / 720, 16)} is the limit for stone). ${need ? `Use a 1x${need + 0.5} on edge` : "Add an upright"}.`);
  const shelfSag = 5 * (30 / 144 * 23) * widest ** 4 / (384 * 1.3e6 * (23 * 0.75 ** 3 / 12));
  if (p.underOn && shelfSag > widest / 360)
    warnings.push(`The under-counter shelf spans ${frac(widest, 8)} and will sag about ${frac(shelfSag, 16)} loaded. Not structural, but you will see it.`);
  warnings.push(...spacingWarnings(up, "Open shelves"));

  return {
    info: INFO, params: p,
    closet: { outline, walls, ceiling: p.ceiling, wallT: t, nbr: [] },
    parts, modules, doors: [door], hatches: [],
    elevations: ["T", "R", "L"],
    planDims: [
      { a: [0, 0], b: [W, 0], label: frac(W, 8), off: -(t + 2.3) },
      { a: [W, 0], b: [W, D], label: frac(D, 8), off: -(t + 2.3) },
      { a: [0, D], b: [p.doorAt, D], label: frac(p.doorAt, 8), off: t + 2.3 },
      { a: [p.doorAt, D], b: [p.doorAt + p.doorRO, D], label: `${frac(p.doorRO, 8)} door`, off: t + 2.3 },
      { a: [p.doorAt + p.doorRO, D], b: [W, D], label: frac(W - p.doorAt - p.doorRO, 8), off: t + 2.3 },
      { a: [corner, 30], b: [W, 30], label: frac(cd, 8), off: 0 },
    ],
    drawerGroups: [],
    stats: [
      { k: "Counter", v: `${frac(W, 8)} + ${frac(D - cd, 8)}`, s: `L-shaped, ${frac(cd, 8)} deep, top at ${frac(cz, 8)}` },
      { k: "Uprights", v: `${backG.length + rightG.length + 1}`, s: p.diagCorner && !backG.length && !rightG.length
        ? `just the diagonal; the 1x${rh + 0.5} carries ${frac(widest, 8)} to each wall`
        : `widest bay ${frac(widest, 8)}${p.diagCorner ? "; the corner one runs on the diagonal" : ""}` },
      { k: "Under the counter", v: p.underOn ? `shelf at ${frac(p.underZ, 8)}` : "open", s: p.underOn ? `${frac(p.underZ - PLY - 1.5, 8)} clear below it` : "" },
      { k: "Open shelves", v: `${up.length} × ${frac(p.upDepth, 8)} deep`, s: up.length ? `tops at ${up.join(", ")}"` : "none on" },
      { k: "Door swing", v: "clear", s: `back leg stops ${frac(swingTop - cd, 8)} short of the swing` },
    ],
    titleMeta: [
      { k: "Pantry", v: `${ftin(W)} × ${ftin(D)}` },
      { k: "Ceiling", v: ftin(p.ceiling) },
      { k: "Counter", v: `${frac(cd, 8)} deep` },
      { k: "Shelves", v: `${up.length}` },
    ],
    gcText: [
      `PANTRY - plywood, painted. All 3/4" birch ply.`,
      `Counter: L-shaped, ${frac(cd, 8)} deep, top at ${frac(cz, 8)}. 3/4" ply sub-top on 1x2 wall cleats, with a 1x${rh + 0.5} on edge across the front of both runs.`,
      `${backG.length + rightG.length + 1} upright${backG.length + rightG.length ? "s" : ""}, ${frac(uD, 8)} deep, floor to ${frac(tz, 8)}${p.diagCorner ? `: one on the diagonal at the corner, wall corner to inside corner, both ends cut at 45` : ""}${backG.length || rightG.length ? `, plus ${[...backG.map(g => frac(g, 8) + " from the left"), ...rightG.map(g => frac(g, 8) + " from the back")].join(" and ")}` : ""}.`,
      ...(p.underOn ? [`Shelf under the counter at ${frac(p.underZ, 8)}. The two at the corner are cut to the diagonal - one 45 edge each.`] : []),
      `Open shelves above: ${up.map(z => frac(z, 8)).join(", ")} - ${frac(p.upDepth, 8)} deep, on 1x2 cleats into the studs. 1/4" x 1-1/4" poplar on each front edge.`,
      `Paint: kitchen colour, all sides.`,
    ].join("\n"),
    warnings,
    notes: [
      `Four outlets, marked amber: back wall ${frac(p.outBack, 8)} from the left; right wall ${frac(p.outRightB, 8)} from the back and ${frac(p.outRightF, 8)} from the front; left wall ${frac(p.outLeft, 8)} from the back.`,
      `At ${p.outletZ}" AFF they land about ${frac(p.outletZ - cz, 8)} above the counter, which is good for appliances. Only the back-wall and right-wall-back heights were measured; re-check the other two.`,
      `The counter is a row of open boxes: ${backG.length + rightG.length + 1} plywood uprights standing on the floor, a 1x2 on edge across their front edges, and the sub-top laid over the lot. Widest bay ${frac(widest, 8)}.`,
      ...(p.diagCorner ? [`The corner upright runs on the diagonal, from the inside corner of the counter to the corner of the two walls. That splits the ${frac(cd, 8)} square corner between the two runs, so each run ends in a wedge it can reach into instead of one deep blind box.`,
        `The shelf in each of those two bays is one piece cut to the diagonal, not a rectangle: a four-sided panel with one 45-degree edge. It sits on wall cleats and on a 1x2 run along the face of the diagonal panel.`] : []),
      "The 1x2 must be on edge (1-1/2\" tall), not laid flat. Flat it sags about 1/16\" and the stone cracks.",
      "Open-shelf front edge: 1/4\" x 1-1/4\" poplar, glued and pinned flush with the shelf top. It drops 1/2\" below the shelf, which hides the LED channel tucked up behind it.",
      "Quartz is usually cheapest as a remnant for a small L. A thin porcelain slab needs the full plywood sub-top under it.",
      PLYWOOD_NOTE,
    ],
  };
}
