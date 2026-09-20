// A-4 LED wiring: one 24V supply at the top, a 2-wire trunk down the back corner,
// and a pair of WAGO 221-413 lever connectors at each shelf branching to that shelf's strip.
// Drawn as a straight-on view of the shelf wall; the strips sit behind the front nosings.
import { el, clear } from "../lib/svg.js";
import { frac } from "../lib/units.js";

const S = 4;                       // px per inch
const POS = "#C0392B", NEG = "#2C3033";   // + red, - black

export function renderWiring(svg, model) {
  clear(svg);
  const g0 = model.wiring;
  if (!g0 || !g0.levels.length) return;
  const { levels, width, ceiling, supplyZ } = g0;
  const X = x => 70 + x * S, Z = z => 46 + (ceiling - z) * S;
  const Wpx = 680, Hpx = Z(0) + 54;
  svg.setAttribute("viewBox", `0 0 ${Wpx} ${Hpx}`);
  const g = el("g", {}, svg);

  // wall, floor, ceiling
  el("rect", { x: X(0), y: Z(ceiling), width: width * S, height: ceiling * S, class: "wallbg" }, g);
  el("line", { x1: X(0) - 8, y1: Z(0), x2: X(width) + 8, y2: Z(0), class: "ob floorline" }, g);
  el("text", { x: X(width / 2), y: Z(0) + 18, class: "lbs", "font-size": 10, "text-anchor": "middle" }, g,
    `shelf wall · ${frac(width, 8)} wide`);

  const tPos = X(1.4), tNeg = X(3.2);          // trunk pair, tucked into the back corner
  const top = Z(supplyZ) + 8, bottom = Z(levels[0]) + 16;
  el("line", { x1: tPos, y1: top, x2: tPos, y2: bottom, stroke: POS, "stroke-width": 2 }, g);
  el("line", { x1: tNeg, y1: top, x2: tNeg, y2: bottom, stroke: NEG, "stroke-width": 2 }, g);

  // 24V supply, plugged into the outlet at the top
  const sx = X(width) - 96, sy = Z(supplyZ) - 34;
  el("rect", { x: sx, y: sy, width: 92, height: 30, rx: 3, class: "p-cabinet" }, g);
  el("text", { x: sx + 46, y: sy + 13, class: "lbf", "font-size": 10, "text-anchor": "middle" }, g, "24V supply");
  el("text", { x: sx + 46, y: sy + 24, class: "lbs", "font-size": 9.5, "text-anchor": "middle" }, g, `${g0.watts}W of strip`);
  el("path", { d: `M${sx + 10} ${sy} V${sy - 12} h22`, class: "lead" }, g);
  el("text", { x: sx + 34, y: sy - 14, class: "lbs", "font-size": 9.5 }, g, "outlet at the top");
  el("path", { d: `M${sx} ${sy + 12} H${tPos}`, stroke: POS, "stroke-width": 2, fill: "none" }, g);
  el("path", { d: `M${sx} ${sy + 20} H${tNeg}`, stroke: NEG, "stroke-width": 2, fill: "none" }, g);

  // shelves, top down, each with its WAGO pair and strip
  for (const z of [...levels].reverse()) {
    const y = Z(z);
    el("rect", { x: X(0), y, width: width * S, height: 3, class: "p-shelf" }, g);
    el("rect", { x: X(0), y, width: width * S, height: 6, class: "p-nosing" }, g);
    el("text", { x: X(0) - 8, y: y + 4, class: "dt", "font-size": 9.5, "text-anchor": "end" }, g, frac(z, 8));

    const cy = y + 16;
    wago(g, tPos, cy, "+");
    wago(g, tNeg, cy + 13, "−");
    const stripX0 = X(5.5), stripX1 = X(width - 1);
    el("path", { d: `M${tPos + 9} ${cy} H${stripX0 - 6} V${y + 9}`, stroke: POS, "stroke-width": 1.4, fill: "none" }, g);
    el("path", { d: `M${tNeg + 9} ${cy + 13} H${stripX0 - 3} V${y + 12}`, stroke: NEG, "stroke-width": 1.4, fill: "none" }, g);
    el("rect", { x: stripX0, y: y + 8, width: stripX1 - stripX0, height: 5, rx: 1, class: "p-led" }, g);
  }

  // callout on the top shelf
  const cz = levels[levels.length - 1], cyTop = Z(cz) + 16;
  const lx = X(width) + 24;
  el("path", { d: `M${tPos + 10} ${cyTop + 6} H${lx - 6}`, class: "lead" }, g);
  const note = (dy, text, cls = "lbs") => el("text", { x: lx, y: cyTop + dy, class: cls, "font-size": 10 }, g, text);
  note(-4, "WAGO 221-413 × 2 per shelf", "lb");
  note(9, "one on +, one on −. Each takes");
  note(21, "trunk in, trunk out and the branch.");
  note(33, "Last shelf: trunk ends, so two ports.");

  // parts list
  const px = X(width) + 24, py = Z(0) - 132;
  el("text", { x: px, y: py, class: "lb b", "font-size": 11 }, g, "Parts");
  const parts = [
    `1 × 24V supply, ${g0.watts}W of strip → use a ${g0.driver}W driver`,
    `${levels.length} × LED strip + aluminium channel, ${frac(width - 6.5, 8)} long`,
    `${levels.length * 2} × WAGO 221-413 (3-port lever connector)`,
    `≈ ${g0.trunkFt} ft of 18 AWG 2-conductor low-voltage cable`,
    "1 × 24V motion sensor or door-jamb switch, inline after the supply",
    `${levels.length} × 2-pin plug, so a shelf can lift out`,
  ];
  parts.forEach((t, i) => el("text", { x: px, y: py + 16 + i * 14, class: "lbs", "font-size": 10 }, g, "· " + t));

  // legend
  const gy = Z(0) + 18;
  el("line", { x1: px, y1: gy - 4, x2: px + 16, y2: gy - 4, stroke: POS, "stroke-width": 2 }, g);
  el("text", { x: px + 22, y: gy, class: "lbs", "font-size": 10 }, g, "+24V");
  el("line", { x1: px + 66, y1: gy - 4, x2: px + 82, y2: gy - 4, stroke: NEG, "stroke-width": 2 }, g);
  el("text", { x: px + 88, y: gy, class: "lbs", "font-size": 10 }, g, "− (common)");
  el("text", { x: px, y: gy + 15, class: "lbs", "font-size": 10 }, g,
    "Trunk runs down the back corner; branches follow the side wall under each shelf.");
}

function wago(g, x, y, sign) {
  el("rect", { x: x - 9, y: y - 6, width: 18, height: 12, rx: 2, class: "wago" }, g);
  el("text", { x, y: y + 1, class: "lbf", "font-size": 9, "text-anchor": "middle", "dominant-baseline": "middle" }, g, sign);
}
