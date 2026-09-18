export const NS = "http://www.w3.org/2000/svg";

export function el(tag, attrs = {}, parent, text) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

// Architectural dimension between two points (SVG coords). `off` pushes the
// dimension line along the left-hand normal of (p1 -> p2); negative flips it.
export function dim(g, x1, y1, x2, y2, label, off = 14, fs = 10) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux, s = Math.sign(off) || 1;
  const ax = x1 + nx * off, ay = y1 + ny * off, bx = x2 + nx * off, by = y2 + ny * off;
  const ext = (px, py) => el("line", {
    x1: px + nx * 2 * s, y1: py + ny * 2 * s,
    x2: px + nx * (off + 4 * s), y2: py + ny * (off + 4 * s), class: "ext" }, g);
  ext(x1, y1); ext(x2, y2);
  el("line", { x1: ax, y1: ay, x2: bx, y2: by, class: "dl" }, g);
  const tick = (px, py) => el("line", {
    x1: px - (ux + nx) * 2.6, y1: py - (uy + ny) * 2.6,
    x2: px + (ux + nx) * 2.6, y2: py + (uy + ny) * 2.6, class: "dl", "stroke-width": 1.4 }, g);
  tick(ax, ay); tick(bx, by);
  const mx = (ax + bx) / 2 + nx * s * fs * 0.7, my = (ay + by) / 2 + ny * s * fs * 0.7;
  let ang = Math.atan2(uy, ux) * 180 / Math.PI;
  if (ang > 90 || ang <= -90) ang += 180;
  el("text", { x: mx, y: my, class: "dt", "font-size": fs, "text-anchor": "middle",
    "dominant-baseline": "middle", transform: `rotate(${ang} ${mx} ${my})` }, g, label);
}

// Leader-line callout: from a point on the drawing to a text label.
export function callout(g, px, py, tx, ty, text, anchor = "start", fs = 10) {
  el("path", { d: `M${px} ${py} L${tx} ${ty}`, class: "lead" }, g);
  el("circle", { cx: px, cy: py, r: 1.6, class: "leaddot" }, g);
  el("text", { x: tx + (anchor === "start" ? 3 : anchor === "end" ? -3 : 0), y: ty,
    class: "lb", "font-size": fs, "text-anchor": anchor, "dominant-baseline": "middle" }, g, text);
}
