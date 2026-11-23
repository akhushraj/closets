// A-6 Sections: a vertical cut through a wall, looking along it rather than at it.
// v runs to the right (out from the wall face), z up. An elevation sees a divider edge-on and
// draws it as a 3/4" stripe, which hides the one thing about it worth drawing - that it changes
// depth as it rises. Here it reads as the shape it actually is.
import { el, clear, dim } from "../lib/svg.js";
import { frac, ftin } from "../lib/units.js";

const S = 4.8;   // px per inch, same as the elevations

export function renderSections(root, model, cuts = model.sections || []) {
  clear(root);
  for (const cut of cuts) {
    const fig = document.createElement("figure");
    fig.className = "elev";
    const cap = document.createElement("figcaption");
    cap.innerHTML = `<span class="tag2">${cut.tag || "S"}</span> ${cut.name}` +
      ` <span class="mono dimtxt">cut at ${frac(cut.u, 8)} from the left · looking ${cut.look || "left"}</span>`;
    const svg = el("svg", { role: "img", class: "ev", "aria-label": `Section through ${cut.name}` });
    drawCut(svg, model, cut);
    fig.append(cap, svg);
    root.append(fig);
  }
}

function drawCut(svg, model, cut) {
  const ceil = model.closet.ceiling;
  const depth = cut.depth || 24;
  const tol = cut.tol ?? 2;                       // how far either side of the cut still counts
  const ox = 46, oy = 12;
  const notes = cut.lines || [];
  const Hpx = oy + ceil * S + 46 + (notes.length ? notes.length * 14 + 10 : 0);
  const V = v => ox + v * S, Z = z => oy + (ceil - z) * S;
  const g = el("g", {}, svg);

  el("rect", { x: V(0), y: Z(ceil), width: depth * S, height: ceil * S, class: "wallbg" }, g);

  // the parts the cut passes through
  const hit = model.parts
    .filter(p => p.wall === cut.wall && p.u1 > cut.u - tol && p.u0 < cut.u + tol)
    .filter(p => !["led", "garment", "outlet", "device", "rack", "ups"].includes(p.kind))
    // the profiled panel goes down first; the shelves crossing it read as lines over the top
    .sort((a, b) => (b.prof ? 1 : 0) - (a.prof ? 1 : 0));

  const marks = [];
  for (const p of hit) {
    const cls = "p-" + p.kind + (p.bought ? " bought" : "");
    if (p.prof) el("path", { d: "M" + p.prof.map(([v, z]) => `${V(v)} ${Z(z)}`).join(" L") + " Z", class: cls }, g);
    else el("rect", { x: V(p.v0), y: Z(p.z1), width: Math.max(0.6, (p.v1 - p.v0) * S),
      height: Math.max(0.6, (p.z1 - p.z0) * S), class: cls }, g);
    if (p.mark && p.kind !== "cleat") marks.push({ z: p.z1, label: p.label || "", d: p.v1 - p.v0 });
  }

  // the door opening's header, so you can see what is above reach
  const hz = Math.min(...(model.doors || []).map(d => d.h));
  if (isFinite(hz)) {
    el("line", { x1: V(0), y1: Z(hz), x2: V(depth), y2: Z(hz), class: "headerline" }, g);
    el("text", { x: V(depth) - 3, y: Z(hz) - 4, class: "lbs", "font-size": 11, "text-anchor": "end" }, g, `door header ${frac(hz, 8)}`);
  }
  el("line", { x1: V(0) - 8, y1: Z(0), x2: V(depth) + 8, y2: Z(0), class: "ob floorline" }, g);
  el("line", { x1: V(0) - 8, y1: Z(ceil), x2: V(depth) + 8, y2: Z(ceil), class: "ob" }, g);

  // height ladder on the right, same manners as an elevation
  marks.sort((a, b) => b.z - a.z);
  const txt = m => (m.label || "") + (m.d > 1.25 ? ` · ${frac(m.d, 8)} deep` : "");
  const merged = [];
  for (const mk of marks) {
    const last = merged[merged.length - 1], t = txt(mk);
    if (last && Math.abs(last.z - mk.z) < 0.6) { if (t && !last.parts.includes(t)) last.parts.push(t); continue; }
    merged.push({ z: mk.z, parts: t ? [t] : [] });
  }
  let prevY = -Infinity;
  const x0 = V(depth) + 5;
  for (const mk of merged) {
    const y = Z(mk.z), ty = Math.max(y, prevY + 13.5);
    prevY = ty;
    el("line", { x1: V(depth), y1: y, x2: x0 + 6, y2: y, class: "ext" }, g);
    el("path", { d: `M${x0 + 6} ${y} L${x0 + 12} ${ty}`, class: "ext" }, g);
    el("text", { x: x0 + 15, y: ty, class: "dt", "font-size": 11, "dominant-baseline": "middle" }, g, frac(mk.z, 8));
    if (mk.parts.length) el("text", { x: x0 + 70, y: ty, class: "lbs", "font-size": 11,
      "dominant-baseline": "middle" }, g, mk.parts.join(" + "));
  }

  dim(g, V(0), Z(0), V(0), Z(ceil), ftin(ceil), -22);
  dim(g, V(0), Z(0), V(depth), Z(0), frac(depth, 8), 18);
  for (const dm of cut.dims || [])
    dim(g, V(dm.v0), Z(dm.z0), V(dm.v1), Z(dm.z1), dm.label, dm.off ?? -14, 11.5);

  notes.forEach((t, i) => el("text", { x: V(0) - 8, y: Z(0) + 46 + i * 14, class: "elevnote", "font-size": 11.5 }, g, t));

  const widest = Math.max(0, ...merged.map(m => m.parts.join(" + ").length));
  const right = Math.max(196, 88 + widest * 6);
  const Wpx = ox + depth * S + right;
  svg.setAttribute("viewBox", `0 0 ${Wpx} ${Hpx}`);
  svg.style.width = Wpx + "px";
  svg.style.maxWidth = "none";
}
