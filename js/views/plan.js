// A-1 Plan view: walls, door swing, module footprints, key dimensions.
import { el, clear, dim } from "../lib/svg.js";
import { frac } from "../lib/units.js";
import { frame } from "../model/builders.js";

const S = 7;   // px per inch

export function renderPlan(svg, model) {
  clear(svg);
  const c = model.closet, t = c.wallT, door = model.door, m = model.metrics;
  const ox = (t + 8) * S + 30, oy = (t + 6) * S + 24;
  const X = x => ox + x * S, Y = y => oy + y * S;
  const Wpx = X(c.W + t + door.slab + 8) + 40, Hpx = Y(c.L + t + 8) + 64;
  svg.setAttribute("viewBox", `0 0 ${Wpx} ${Hpx}`);
  const g = el("g", {}, svg);
  const wallOf = id => c.walls.find(w => w.id === id);

  // walls = outer offset polygon minus the room polygon
  const P = c.outline, n = P.length, N = [];
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    N.push([-(b[1] - a[1]) / L, (b[0] - a[0]) / L]);
  }
  const outer = P.map((p, i) => { const a = N[(i - 1 + n) % n], b = N[i]; return [p[0] - t * (a[0] + b[0]), p[1] - t * (a[1] + b[1])]; });
  const poly = pts => "M" + pts.map(p => `${X(p[0])} ${Y(p[1])}`).join(" L") + " Z";

  el("rect", { x: X(0), y: Y(c.M + t), width: (c.nx - t) * S, height: (c.L - c.M) * S, class: "nbr" }, g);
  el("text", { x: X((c.nx - t) / 2), y: Y((c.M + c.L) / 2 + t / 2), class: "lbs", "font-size": 9.5, "text-anchor": "middle" }, g, "notch");
  el("path", { d: poly(P), class: "floor" }, g);
  el("path", { d: poly(outer) + " " + poly(P), class: "wallfill", "fill-rule": "evenodd" }, g);

  // door opening + swing into the bedroom
  el("rect", { x: X(c.W) - 0.5, y: Y(door.u0), width: t * S + 1, height: (door.u1 - door.u0) * S, class: "gap" }, g);
  const hx = X(c.W + t), hy = Y(door.hingeU), R = door.slab * S, near = door.hinge === "near";
  const closedY = hy + (near ? R : -R);
  el("path", { d: `M${hx} ${hy} L${hx + R} ${hy}`, class: "leafp" }, g);
  el("path", { d: `M${hx} ${closedY} A${R} ${R} 0 0 ${near ? 0 : 1} ${hx + R} ${hy}`, class: "swing" }, g);
  el("text", { x: hx + R * 0.42, y: hy + (near ? R * 0.52 : -R * 0.42), class: "lb", "font-size": 11, "text-anchor": "middle" }, g,
    near ? "LHO" : "RHO");
  el("text", { x: hx + R * 0.42, y: hy + (near ? R * 0.52 + 13 : -R * 0.42 + 13), class: "lbs", "font-size": 9.5, "text-anchor": "middle" }, g,
    `${door.slab}" slab · swings out`);

  // modules: band first (overhead, dashed), then floor-level pieces
  const order = ["band", "hang", "tower", "shelves", "hamper"];
  const mods = [...model.modules].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  for (const md of mods)
    el("rect", { x: X(md.x0), y: Y(md.y0), width: (md.x1 - md.x0) * S, height: (md.y1 - md.y0) * S,
      class: "m-" + md.kind, rx: md.kind === "hamper" ? 4 : 0 }, g);

  const txt = (x, y, s, cls = "lb", fs = 11) => el("text", { x: X(x), y: Y(y), class: cls, "font-size": fs,
    "text-anchor": "middle", "dominant-baseline": "middle" }, g, s);

  for (const md of mods) {
    const w = wallOf(md.wall), f = frame(w), cx = (md.x0 + md.x1) / 2, cy = (md.y0 + md.y1) / 2;
    if (md.kind === "hang") {
      const p = (u, v) => [f.ax + f.dx * u + f.nx * v, f.ay + f.dy * u + f.ny * v];
      const [x1, y1] = p(md.u0 + 0.5, md.rodV), [x2, y2] = p(md.u1 - 0.5, md.rodV);
      el("line", { x1: X(x1), y1: Y(y1), x2: X(x2), y2: Y(y2), class: "rodline" }, g);
      txt(cx + 6, cy - 5.5, "Hanging", "lb b");
      txt(cx + 6, cy + 5.5, `rod ${frac(md.rodLen, 8)} at ${frac(md.rodZ, 8)}`, "lbs", 10);
      txt(md.x0 + 9, cy + 5.5, "coats", "lbs", 9.5);
    }
    if (md.kind === "tower") {
      const gb = { u0: md.u0, u1: md.u1, v0: md.v1, v1: md.v1 + md.slide + 1.1 };
      const p = (u, v) => [f.ax + f.dx * u + f.nx * v, f.ay + f.dy * u + f.ny * v];
      const [ax, ay] = p(gb.u0, gb.v0), [bx, by] = p(gb.u1, gb.v1);
      el("rect", { x: X(Math.min(ax, bx)), y: Y(Math.min(ay, by)), width: Math.abs(bx - ax) * S,
        height: Math.abs(by - ay) * S, class: "ghost" }, g);
      txt((Math.min(ax, bx) + Math.max(ax, bx)) / 2, Math.max(ay, by) - 3, "drawer fully open", "lbs", 9.5);
      txt(cx, cy - 6, "Drawer", "lb b"); txt(cx, cy + 1, "tower", "lb b");
      txt(cx, cy + 9, `${md.drawerCount} × ${md.slide}" deep`, "lbs", 10);
    }
    if (md.kind === "shelves") txt(cx, md.y1 - 2.2, `shelves from ${frac(md.bottom, 8)} up`, "lbs", 9.5);
    if (md.kind === "hamper") txt(cx, cy - 1, "Hamper", "lb b", 10.5);
  }

  // elevation tags on each wall
  for (const w of c.walls) {
    if (w.id === "N1") continue;
    // a quarter of the way along the wall, clear of the centred overall dimensions
    const f = frame(w), u = f.len * 0.25, mx = f.ax + f.dx * u - f.nx * (t + 4.5), my = f.ay + f.dy * u - f.ny * (t + 4.5);
    el("circle", { cx: X(mx), cy: Y(my), r: 9, class: "etag" }, g);
    el("text", { x: X(mx), y: Y(my), class: "etagt", "font-size": 9, "text-anchor": "middle", "dominant-baseline": "central" }, g, w.id);
  }

  // dimensions
  dim(g, X(0), Y(0), X(c.W), Y(0), frac(c.W, 8), -(t * S + 16));
  dim(g, X(0), Y(0), X(0), Y(c.M), frac(c.M, 8), t * S + 18);
  dim(g, X(c.nx), Y(c.L), X(c.W), Y(c.L), frac(c.A, 8), t * S + 16);
  const off = -(t * S + R + 16);
  dim(g, X(c.W), Y(0), X(c.W), Y(door.u0), frac(door.u0, 8), off);
  dim(g, X(c.W), Y(door.u0), X(c.W), Y(door.u1), frac(door.u1 - door.u0, 8) + " R.O.", off);
  dim(g, X(c.W), Y(door.u1), X(c.W), Y(c.L), frac(c.L - door.u1, 8), off);
  dim(g, X(c.W), Y(0), X(c.W), Y(c.L), frac(c.L, 8), off - 30);
  dim(g, X(m.towerDepth), Y(m.towerW / 2 + (c.M - m.towerW) + 7), X(c.W), Y(m.towerW / 2 + (c.M - m.towerW) + 7), `aisle ${frac(m.aisle, 8)}`, 0);
  dim(g, X(0), Y(c.M - 3), X(m.towerDepth), Y(c.M - 3), frac(m.towerDepth, 8), 0);
  const hd = c.M - m.towerW;
  dim(g, X(c.W - 3), Y(0), X(c.W - 3), Y(hd), frac(hd, 8), 0);

  // legend
  const ly = Hpx - 26; let lx = 20;
  const items = [["m-hang", "Hanging"], ["m-tower", "Drawers"], ["m-shelves", "Shelves"], ["m-hamper", "Hamper"],
    ["m-band", "Upper shelves (above door)"], ["ghost", "Drawer pulled out"]];
  for (const [cls, label] of items) {
    el("rect", { x: lx, y: ly - 6, width: 16, height: 12, class: cls }, g);
    const tt = el("text", { x: lx + 21, y: ly, class: "lbs", "font-size": 10.5, "dominant-baseline": "middle" }, g, label);
    lx += 30 + label.length * 5.6;
  }
}
