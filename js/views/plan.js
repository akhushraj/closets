// A-1 Plan view, generic over any closet model: walls, doors (in or out swing), module
// footprints with labels, open-drawer / fold-down ghosts, hatches, and the model's dimensions.
import { el, clear, dim } from "../lib/svg.js";
import { frame } from "../model/builders.js";

const S = 7;   // px per inch
const ORDER = ["clear", "band", "hang", "coats", "dress", "tower", "cabinets", "shelves", "counter", "press", "equip", "desk", "ups", "appliance", "sink", "dresser", "hamper"];
const LEGEND = { hang: "Hanging", tower: "Drawers", shelves: "Shelves", press: "Press board", equip: "Network gear",
  desk: "Desk", ups: "UPS", hamper: "Hamper", band: "Upper shelves", dress: "Drawers + hanging", cabinets: "Cabinets",
  appliance: "Washer / dryer", sink: "Sink", counter: "Counter", coats: "Coats (open)", dresser: "Dresser", clear: "Keep clear" };

export function renderPlan(svg, model) {
  clear(svg);
  const c = model.closet, t = c.wallT;
  const wallOf = id => c.walls.find(w => w.id === id);
  const P = (w, u, v) => { const f = frame(w); return [f.ax + f.dx * u + f.nx * v, f.ay + f.dy * u + f.ny * v]; };

  // bounds: walls, out-swinging leaves, wall tags, dimension lines
  const pts = [];
  const n = c.outline.length, N = [];
  for (let i = 0; i < n; i++) {
    const a = c.outline[i], b = c.outline[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    N.push([-(b[1] - a[1]) / L, (b[0] - a[0]) / L]);
  }
  const outer = c.outline.map((p, i) => { const a = N[(i - 1 + n) % n], b = N[i]; return [p[0] - t * (a[0] + b[0]), p[1] - t * (a[1] + b[1])]; });
  pts.push(...outer);
  for (const d of model.doors) if (d.swing === "out") pts.push(P(wallOf(d.wall), d.hingeU, -t - d.slab - 2));
  for (const w of c.walls) if (!w.hidden) { const f = frame(w); pts.push(P(w, f.len * (w.tagU ?? 0.25), -(t + 6.5))); }
  for (const d of model.planDims) {
    const L = Math.hypot(d.b[0] - d.a[0], d.b[1] - d.a[1]) || 1, nx = -(d.b[1] - d.a[1]) / L, ny = (d.b[0] - d.a[0]) / L;
    const o = d.off + Math.sign(d.off || 1) * 2.4;
    pts.push([d.a[0] + nx * o, d.a[1] + ny * o], [d.b[0] + nx * o, d.b[1] + ny * o]);
  }
  const minX = Math.min(...pts.map(p => p[0])) - 2, maxX = Math.max(...pts.map(p => p[0])) + 2;
  const minY = Math.min(...pts.map(p => p[1])) - 2, maxY = Math.max(...pts.map(p => p[1])) + 2;
  const X = x => 16 + (x - minX) * S, Y = y => 16 + (y - minY) * S;
  const Wpx = X(maxX) + 16, Hpx = Y(maxY) + 50;
  svg.setAttribute("viewBox", `0 0 ${Wpx} ${Hpx}`);
  svg.style.maxWidth = Math.max(560, Wpx) + "px";
  const g = el("g", {}, svg);
  const poly = ps => "M" + ps.map(p => `${X(p[0])} ${Y(p[1])}`).join(" L") + " Z";
  const txt = (x, y, s, cls = "lb", fs = 11, rot = false) => el("text", { x: X(x), y: Y(y), class: cls, "font-size": fs,
    "text-anchor": "middle", "dominant-baseline": "middle", transform: rot ? `rotate(-90 ${X(x)} ${Y(y)})` : null }, g, s);

  for (const r of c.nbr || []) {
    el("rect", { x: X(r.x0), y: Y(r.y0), width: (r.x1 - r.x0) * S, height: (r.y1 - r.y0) * S, class: "nbr" }, g);
    if (r.label) txt((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, r.label, "lbs", 9.5);
  }
  el("path", { d: poly(c.outline), class: "floor" }, g);
  el("path", { d: poly(outer) + " " + poly(c.outline), class: "wallfill", "fill-rule": "evenodd" }, g);

  // modules
  const mods = [...model.modules].sort((a, b) => (ORDER.indexOf(a.kind) + 99) % 99 - (ORDER.indexOf(b.kind) + 99) % 99);
  for (const m of mods) {
    el("rect", { x: X(m.x0), y: Y(m.y0), width: (m.x1 - m.x0) * S, height: (m.y1 - m.y0) * S,
      class: "m-" + (LEGEND[m.kind] ? m.kind : "other"), rx: m.kind === "hamper" ? 4 : 0 }, g);
    const w = wallOf(m.wall);
    for (const r of m.rods || []) {
      const [x1, y1] = P(w, m.u0 + 0.5, r.v), [x2, y2] = P(w, m.u1 - 0.5, r.v);
      el("line", { x1: X(x1), y1: Y(y1), x2: X(x2), y2: Y(y2), class: "rodline" }, g);
    }
  }
  for (const m of mods) {
    if (!m.ghost) continue;
    const w = wallOf(m.wall), [ax, ay] = P(w, m.ghost.u0, m.ghost.v0), [bx, by] = P(w, m.ghost.u1, m.ghost.v1);
    const x0 = Math.min(ax, bx), y0 = Math.min(ay, by), x1 = Math.max(ax, bx), y1 = Math.max(ay, by);
    el("rect", { x: X(x0), y: Y(y0), width: (x1 - x0) * S, height: (y1 - y0) * S, class: "ghost" }, g);
    const [lx, ly] = P(w, (m.ghost.u0 + m.ghost.u1) / 2, m.ghost.v1 - 2.2);
    const f = frame(w);
    txt(lx, ly, m.ghost.label || "", "lbs", 9.5, Math.abs(f.dx) > 0.5 ? false : false);
  }
  for (const m of mods) {
    if (m.kind === "band" || !m.label) continue;
    const cx = (m.x0 + m.x1) / 2, cy = (m.y0 + m.y1) / 2, pw = (m.x1 - m.x0) * S, ph = (m.y1 - m.y0) * S;
    const need = Math.max(m.label.length * 6.6, (m.sub || "").length * 5.4);
    const rot = need > pw - 6 && ph > pw;
    const room = rot ? ph : pw;
    const showSub = m.sub && (m.sub.length * 5.4 < room - 4) && (rot ? pw : ph) > 30;
    if (showSub) {
      const off = 6.5 / S;
      txt(rot ? cx - off : cx, rot ? cy : cy - off, m.label, "lb b", 11, rot);
      txt(rot ? cx + off : cx, rot ? cy : cy + off, m.sub, "lbs", 9.5, rot);
    } else txt(cx, cy, m.label, "lb b", m.label.length * 6.6 < room - 4 ? 11 : 9.5, rot);
  }

  // hatches
  for (const h of model.hatches || []) {
    el("rect", { x: X(h.x0), y: Y(h.y0), width: (h.x1 - h.x0) * S, height: (h.y1 - h.y0) * S, class: "hatch" }, g);
    txt((h.x0 + h.x1) / 2, h.y1 - 1.8, h.label || "hatch", "lbs", 9.5);
  }

  // doors
  for (const d of model.doors) {
    const w = wallOf(d.wall), out = d.swing === "out", v = out ? -t : 0;
    el("path", { d: poly([P(w, d.u0, 0.4), P(w, d.u1, 0.4), P(w, d.u1, -t - 0.4), P(w, d.u0, -t - 0.4)]), class: "gap" }, g);
    if (d.swing === "slide") {   // bypass panels, one per track across the wall thickness
      const n = d.panels || 3, pw = (d.u1 - d.u0) / n;
      for (let k = 0; k < n; k++) {
        const vv = -t * (k + 0.5) / n, [x1, y1] = P(w, d.u0 + k * pw - (k ? 1 : 0), vv), [x2, y2] = P(w, d.u0 + (k + 1) * pw + (k < n - 1 ? 1 : 0), vv);
        el("line", { x1: X(x1), y1: Y(y1), x2: X(x2), y2: Y(y2), class: "leafp" }, g);
      }
      const [lx, ly] = P(w, (d.u0 + d.u1) / 2, -t - 3);
      txt(lx, ly, d.label || "sliding doors", "lbs", 9.5);
      continue;
    }
    const other = d.hingeU < (d.u0 + d.u1) / 2 ? d.hingeU + d.slab : d.hingeU - d.slab;
    const [hx, hy] = P(w, d.hingeU, v), [cx, cy] = P(w, other, v), [ox, oy] = P(w, d.hingeU, v + (out ? -d.slab : d.slab));
    const ax = X(cx) - X(hx), ay = Y(cy) - Y(hy), bx = X(ox) - X(hx), by = Y(oy) - Y(hy);
    const sweep = ax * by - ay * bx > 0 ? 1 : 0, R = d.slab * S;
    el("path", { d: `M${X(hx)} ${Y(hy)} L${X(ox)} ${Y(oy)}`, class: "leafp" }, g);
    el("path", { d: `M${X(cx)} ${Y(cy)} A${R} ${R} 0 0 ${sweep} ${X(ox)} ${Y(oy)}`, class: "swing" }, g);
    const lx = hx + (cx - hx) * 0.42 + (ox - hx) * 0.42, ly = hy + (cy - hy) * 0.42 + (oy - hy) * 0.42;
    txt(lx, ly - 1, d.label || "door", "lb", 10.5);
    txt(lx, ly + 1.1, `swings ${out ? "out" : "in"}`, "lbs", 9);
  }

  // wall tags (elevation keys)
  for (const w of c.walls) {
    if (w.hidden) continue;
    const f = frame(w), [mx, my] = P(w, f.len * (w.tagU ?? 0.25), -(t + 4.5));
    el("circle", { cx: X(mx), cy: Y(my), r: 9, class: "etag" }, g);
    el("text", { x: X(mx), y: Y(my), class: "etagt", "font-size": 9, "text-anchor": "middle", "dominant-baseline": "central" }, g, w.id);
  }

  for (const d of model.planDims) dim(g, X(d.a[0]), Y(d.a[1]), X(d.b[0]), Y(d.b[1]), d.label, d.off * S);

  // legend
  const kinds = new Set(model.modules.map(m => m.kind));
  const items = Object.entries(LEGEND).filter(([k]) => kinds.has(k)).map(([k, l]) => ["m-" + k, l]);
  if (model.modules.some(m => m.ghost)) items.push(["ghost", "Pulled out / folded down"]);
  if ((model.hatches || []).length) items.push(["hatch", "Floor hatch, keep clear"]);
  const ly = Hpx - 22; let lx = 16;
  for (const [cls, label] of items) {
    el("rect", { x: lx, y: ly - 6, width: 16, height: 12, class: cls }, g);
    el("text", { x: lx + 21, y: ly, class: "lbs", "font-size": 10.5, "dominant-baseline": "middle" }, g, label);
    lx += 30 + label.length * 5.6;
  }
}
