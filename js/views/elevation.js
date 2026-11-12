// A-2 Wall elevations: one drawing per wall, looking at it from inside the closet.
import { el, clear, dim } from "../lib/svg.js";
import { frac, ftin } from "../lib/units.js";

const S = 4.8;   // px per inch

export function renderElevations(root, model) {
  clear(root);
  const order = model.elevations || model.closet.walls.filter(w => !w.hidden).map(w => w.id);
  for (const id of order) {
    const w = model.closet.walls.find(x => x.id === id);
    if (!w) continue;
    const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
    const fig = document.createElement("figure");
    fig.className = "elev";
    const cap = document.createElement("figcaption");
    const ds = [...new Set(model.parts.filter(p => p.wall === id && p.kind === "shelf" && p.mark)
      .map(p => Math.round((p.v1 - p.v0) * 8) / 8))].filter(d => d > 1.25);
    const depth = ds.length === 1 ? ` \u00b7 ${frac(ds[0], 8)} deep` : "";
    cap.innerHTML = `<span class="tag2">${id}</span> ${w.name} <span class="mono dimtxt">${frac(len, 8)} wide${depth}</span>`;
    const svg = el("svg", { role: "img", "aria-label": `Elevation of ${w.name}` });
    drawWall(svg, w, len, model);
    fig.append(cap, svg);
    root.append(fig);
  }
}

function drawWall(svg, w, len, model) {
  const ceil = model.closet.ceiling;
  const ox = 46, oy = 12;
  const Hpx = oy + ceil * S + 46;
  const U = u => ox + u * S, Z = z => oy + (ceil - z) * S;
  const g = el("g", {}, svg);

  el("rect", { x: U(0), y: Z(ceil), width: len * S, height: ceil * S, class: "wallbg" }, g);
  const marks = [];

  for (const door of model.doors.filter(d => d.wall === w.id)) {
    el("rect", { x: U(door.u0), y: Z(door.roH), width: (door.u1 - door.u0) * S, height: door.roH * S, class: "opening" }, g);
    if (door.swing === "slide") {
      const n = door.panels || 3, pw = (door.u1 - door.u0) / n;
      for (let k = 0; k < n; k++) el("rect", { x: U(door.u0 + k * pw), y: Z(door.h), width: pw * S, height: door.h * S, class: "leaf" }, g);
      marks.push({ z: door.roH, label: "Door R.O." });
      continue;
    }
    const a = door.u0 + 1, b = door.u1 - 1, nearA = Math.abs(door.hingeU - a) < Math.abs(door.hingeU - b);
    const hU = nearA ? a : b, lU = nearA ? b : a, inward = door.swing === "in";
    el("rect", { x: U(a), y: Z(door.h), width: (b - a) * S, height: door.h * S, class: inward ? "leafin" : "leaf" }, g);
    el("path", { d: `M${U(hU)} ${Z(door.h)} L${U(lU)} ${Z(door.h / 2)} L${U(hU)} ${Z(0)}`, class: "swingel" }, g);
    el("text", { x: U((a + b) / 2), y: Z(door.h) + 14, class: "lb", "font-size": 12, "text-anchor": "middle" }, g, `door · ${door.label || ""}`);
    el("text", { x: U((a + b) / 2), y: Z(door.h) + 27, class: "lbs", "font-size": 11, "text-anchor": "middle" }, g, inward ? "swings in" : "swings out");
    marks.push({ z: door.roH, label: "Door R.O." });
  }

  // Runs on the other walls that die into this one, in outline. Without them a corner reads as
  // a wall that stops for no reason - the pantry's left wall came out blank although the whole
  // back counter and every shelf lands on it.
  const ux = (w.b[0] - w.a[0]) / len, uy = (w.b[1] - w.a[1]) / len;
  const uOf = (x, y) => (x - w.a[0]) * ux + (y - w.a[1]) * uy;
  const vOf = (x, y) => (x - w.a[0]) * -uy + (y - w.a[1]) * ux;
  for (const p of model.parts) {
    // a diagonal or a cut panel is nothing like its bounding box, so leave those out
    if (p.wall === w.id || p.poly || p.diag) continue;
    if (!["shelf", "counter", "carcass", "cleat"].includes(p.kind)) continue;
    const cs = [[p.x0, p.y0], [p.x1, p.y0], [p.x1, p.y1], [p.x0, p.y1]];
    if (Math.min(...cs.map(c => vOf(...c))) > 0.6) continue;   // never reaches this wall
    const us = cs.map(c => uOf(...c));
    const a0 = Math.max(0, Math.min(...us)), a1 = Math.min(len, Math.max(...us));
    if (a1 - a0 < 1) continue;
    el("rect", { x: U(a0), y: Z(p.z1), width: (a1 - a0) * S,
      height: Math.max(0.6, (p.z1 - p.z0) * S), class: "p-return" }, g);
  }

  const parts = model.parts.filter(p => p.wall === w.id).sort((a, b) => a.v1 - b.v1);
  for (const p of parts) {
    const r = { x: U(p.u0), y: Z(p.z1), width: Math.max(0.6, (p.u1 - p.u0) * S), height: Math.max(0.6, (p.z1 - p.z0) * S) };
    if (p.kind === "garment") { el("rect", { ...r, rx: 1.2, class: `p-garment g${p.tone}` }, g); continue; }
    el("rect", { ...r, class: "p-" + p.kind, rx: p.kind === "hamper" ? 3 : 0 }, g);
    if (p.kind === "front") {   // label left, height right, so the centred pull stays clear
      const ty = r.y + r.height / 2;
      el("text", { x: r.x + 4, y: ty, class: "lbf", "font-size": 11, "dominant-baseline": "middle" }, g, p.label);
      el("text", { x: r.x + r.width - 4, y: ty, class: "lbf", "font-size": 11, "text-anchor": "end",
        "dominant-baseline": "middle" }, g, frac(p.h - 1 / 8, 8));
    }
    if (p.kind === "hamper")
      el("text", { x: r.x + r.width / 2, y: r.y + r.height / 2, class: "lbs", "font-size": 11,
        "text-anchor": "middle", "dominant-baseline": "middle" }, g, "hamper");
    if (!p.mark) continue;
    if (p.kind === "rod") marks.push({ z: (p.z0 + p.z1) / 2, label: "Rod" });
    else if (p.kind === "front") marks.push({ z: p.z0 - 1 / 16, label: "" });
    else if (p.kind === "kick") marks.push({ z: p.z1, label: "Toe kick" });
    else marks.push({ z: p.z1, label: p.label || "", d: p.v1 - p.v0 });
  }

  const hz = Math.min(...model.doors.map(d => d.h));
  if (isFinite(hz)) {
    el("line", { x1: U(0), y1: Z(hz), x2: U(len), y2: Z(hz), class: "headerline" }, g);
    el("text", { x: U(len) - 3, y: Z(hz) - 4, class: "lbs", "font-size": 11, "text-anchor": "end" }, g, `door header ${frac(hz, 8)}`);
  }
  el("line", { x1: U(0) - 8, y1: Z(0), x2: U(len) + 8, y2: Z(0), class: "ob floorline" }, g);
  el("line", { x1: U(0) - 8, y1: Z(ceil), x2: U(len) + 8, y2: Z(ceil), class: "ob" }, g);

  // AFF height ladder on the right, nudged apart so labels never collide
  marks.sort((a, b) => b.z - a.z);
  const merged = [];
  for (const mk of marks) {
    const last = merged[merged.length - 1];
    if (last && Math.abs(last.z - mk.z) < 0.6) { if (!last.label) { last.label = mk.label; last.d = mk.d; } continue; }
    merged.push({ ...mk });
  }
  let prevY = -Infinity;
  const x0 = U(len) + 5;
  for (const mk of merged) {
    const y = Z(mk.z), ty = Math.max(y, prevY + 13.5);
    prevY = ty;
    el("line", { x1: U(len), y1: y, x2: x0 + 6, y2: y, class: "ext" }, g);
    el("path", { d: `M${x0 + 6} ${y} L${x0 + 12} ${ty}`, class: "ext" }, g);
    el("text", { x: x0 + 15, y: ty, class: "dt", "font-size": 11, "dominant-baseline": "middle" }, g, frac(mk.z, 8));
    if (mk.label) el("text", { x: x0 + 70, y: ty, class: "lbs", "font-size": 11, "dominant-baseline": "middle" }, g,
      // under about an inch it is trim or a face plate, and the number is its thickness
      mk.label + (mk.d > 1.25 ? ` \u00b7 ${frac(mk.d, 8)} deep` : ""));
  }

  dim(g, U(0), Z(0), U(0), Z(ceil), ftin(ceil), -22);
  dim(g, U(0), Z(0), U(len), Z(0), frac(len, 8), 18);

  // dimensions the model asks for on this wall - bay widths, a divider's distance off a wall
  for (const dm of (model.elevDims || []).filter(x => x.wall === w.id))
    dim(g, U(dm.u0), Z(dm.z), U(dm.u1), Z(dm.z), dm.label || frac(dm.u1 - dm.u0, 8), dm.off ?? -14, 11.5);

  const widest = Math.max(0, ...merged.map(m => (m.label || "").length +
    (m.d > 1.25 ? frac(m.d, 8).length + 8 : 0)));
  const right = Math.max(196, 88 + widest * 6);
  const Wpx = ox + len * S + right;
  svg.setAttribute("viewBox", `0 0 ${Wpx} ${Hpx}`);
  // Always draw at full size. Letting the browser shrink a wide wall to fit would take the
  // lettering down with it, so the figure scrolls sideways instead.
  svg.style.width = Wpx + "px";
  svg.style.maxWidth = "none";
}
