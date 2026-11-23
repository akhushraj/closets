// Plan details: one piece drawn from above, large, with its own dimensions. An elevation can
// only ever show a shelf edge-on as a line, so a shape cut in plan - a corner on a 45 - has to
// be drawn looking down or it is not drawn at all.
import { el, clear, dim } from "../lib/svg.js";
import { frac } from "../lib/units.js";

const S = 7.6;   // px per inch - details are small, so they get drawn bigger than a plan

export function renderDetails(root, model, details = model.details || []) {
  clear(root);
  for (const d of details) root.append(figureFor(d));
}

export function figureFor(d) {
  const fig = document.createElement("figure");
  fig.className = "elev detail";
  const cap = document.createElement("figcaption");
  cap.innerHTML = `<span class="tag2">${d.tag || "D"}</span> ${d.name}` +
    (d.sub ? ` <span class="mono dimtxt">${d.sub}</span>` : "");
  const svg = el("svg", { role: "img", class: "ev", "aria-label": d.name });
  draw(svg, d);
  fig.append(cap, svg);
  return fig;
}

let uid = 0;

function draw(svg, d) {
  const xs = d.poly.map(q => q[0]), ys = d.poly.map(q => q[1]);
  const hid = `hatch${++uid}`;
  const w = Math.max(...xs), h = Math.max(...ys);
  const pad = 46, bot = (d.lines || []).length ? (d.lines.length * 15 + 30) : 12;
  const X = x => pad + x * S, Y = y => pad + y * S;
  const g = el("g", {}, svg);
  // anything that is not plywood gets hatched, so the edge of Amir's work is never in doubt
  const pat = el("pattern", { id: hid, width: 7, height: 7, patternUnits: "userSpaceOnUse",
    patternTransform: "rotate(45)" }, el("defs", {}, svg));
  el("line", { x1: 0, y1: 0, x2: 0, y2: 7, class: "hatchline" }, pat);

  // the two walls this sits in, drawn as a thick L so the orientation is never in doubt
  const t = 4;
  el("rect", { x: X(0) - t, y: Y(0) - t, width: w * S + t, height: t, class: "wallfill" }, g);
  el("rect", { x: X(0) - t, y: Y(0) - t, width: t, height: h * S + t, class: "wallfill" }, g);

  // the cabinets either side go down first, hatched, so the plywood's edge draws over them
  for (const n of d.neighbours || []) {
    const r = { x: X(n.x0), y: Y(n.y0), width: (n.x1 - n.x0) * S, height: (n.y1 - n.y0) * S };
    el("rect", { ...r, class: "d-cab" }, g);
    el("rect", { ...r, fill: `url(#${hid})`, stroke: "none" }, g);
    el("text", { x: r.x + r.width / 2, y: r.y + r.height / 2, class: "lbs", "font-size": 10.5,
      "text-anchor": "middle", "dominant-baseline": "middle",
      transform: n.rot ? `rotate(${n.rot} ${r.x + r.width / 2} ${r.y + r.height / 2})` : null }, g, n.label || "cabinet");
  }

  el("path", { d: "M" + d.poly.map(([x, y]) => `${X(x)} ${Y(y)}`).join(" L") + " Z", class: "p-shelf d-ply" }, g);

  for (const c of d.cleats || [])
    el("line", { x1: X(c[0][0]), y1: Y(c[0][1]), x2: X(c[1][0]), y2: Y(c[1][1]), class: "cleatline" }, g);

  for (const dm of d.dims || [])
    dim(g, X(dm.a[0]), Y(dm.a[1]), X(dm.b[0]), Y(dm.b[1]), dm.label, dm.off ?? -14, 11.5);

  for (const t2 of d.labels || [])
    el("text", { x: X(t2.x), y: Y(t2.y), class: t2.cls || "lbs", "font-size": t2.size || 11,
      "text-anchor": t2.anchor || "middle", transform: t2.rot ? `rotate(${t2.rot} ${X(t2.x)} ${Y(t2.y)})` : null }, g, t2.t);

  (d.lines || []).forEach((t2, i) => el("text", { x: X(0) - t, y: Y(h) + 78 + i * 15, class: "elevnote", "font-size": 11.5 }, g, t2));

  const Wpx = pad + w * S + pad, Hpx = pad + h * S + pad + bot;
  svg.setAttribute("viewBox", `0 0 ${Wpx} ${Hpx}`);
  svg.style.width = Wpx + "px";
  svg.style.maxWidth = "none";
}
