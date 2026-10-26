// A supplier-neutral sheet to send out for quoting: the plan, an elevation of every wall that
// carries cabinets, and a numbered box list. Sizes only - no brand, no part numbers.
import { frac, ftin } from "../lib/units.js";

const R = x => Math.round(x);

// What a vendor would actually quote: one line per box. A box drawn as a 94" carcass with a
// topper on it is one 108" cabinet to price; the corner unit is one L-shaped box, not two legs.
export function units(model) {
  const cab = model.modules.filter(m => m.kind === "cabinets");
  const merged = new Set(), out = [];
  for (const b of cab) {
    if (merged.has(b) || b.leg) continue;
    let zb = b.zb;
    for (let again = true; again;) {
      again = false;
      for (const t of cab) {
        if (t === b || merged.has(t) || t.wall !== b.wall) continue;
        if (Math.abs(t.u0 - b.u0) < 0.1 && Math.abs(t.u1 - b.u1) < 0.1 && Math.abs(t.za - zb) < 0.1) {
          zb = t.zb; merged.add(t); again = true;
        }
      }
    }
    merged.add(b);
    const leg = cab.find(x => x.leg && Math.abs(x.za - b.za) < 0.1 && Math.abs(x.zb - b.zb) < 0.1
      && Math.abs((x.u1 - x.u0) - (b.u1 - b.u0)) < 0.1 && x.wall !== b.wall);
    out.push({ wall: b.wall, u0: b.u0, u1: b.u1, za: b.za, zb,
      w: b.u1 - b.u0, h: zb - b.za, d: b.v1 - b.v0, x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1,
      corner: !!leg, legWall: leg && leg.wall });
  }
  return out.sort((a, b) => a.wall.localeCompare(b.wall) || a.za - b.za || a.u0 - b.u0);
}

const fit = (model, u) => {
  const ins = model.parts.filter(p => p.wall === u.wall && p.u0 >= u.u0 - 0.5 && p.u1 <= u.u1 + 0.5
    && p.z0 >= u.za - 1 && p.z1 <= u.zb + 1);
  const n = k => ins.filter(p => p.kind === k).length;
  const bits = [];
  if (n("rod")) bits.push("hanging rod");
  if (n("front")) bits.push(`${n("front")} drawers`);
  if (n("shelf")) bits.push(`${n("shelf")} shelves`);
  if (n("cabdoor")) bits.push(`${n("cabdoor")} door${n("cabdoor") > 1 ? "s" : ""}`);
  return bits.join(", ") || "open box";
};

export function renderBoxSheet(root, model) {
  const U = units(model);
  const walls = Object.fromEntries(model.closet.walls.map(w => [w.id, w.name]));
  const num = new Map(U.map((u, i) => [u, i + 1]));
  const C = model.closet.ceiling;

  // ---------- plan
  const xs = model.closet.outline.map(p => p[0]), ys = model.closet.outline.map(p => p[1]);
  const W = Math.max(...xs), H = Math.max(...ys), pad = 16;
  const fsOf = vbW => Math.round((vbW / 42) * 10) / 10;   // keeps text the same size on screen
  const f1 = fsOf(W + pad * 2);
  const plan = `
  <svg viewBox="${-pad} ${-pad} ${W + pad * 2} ${H + pad * 2}" class="bs">
    <polygon points="${model.closet.outline.map(p => p.join(",")).join(" ")}" class="room"/>
    ${U.map(u => `<rect x="${u.x0}" y="${u.y0}" width="${u.x1 - u.x0}" height="${u.y1 - u.y0}" class="bx"/>
      <text x="${(u.x0 + u.x1) / 2}" y="${(u.y0 + u.y1) / 2 + f1 * 0.36}" class="n" font-size="${f1}">${num.get(u)}</text>`).join("")}
    ${model.closet.walls.filter(w => !w.hidden).map(w => {
      const mx = (w.a[0] + w.b[0]) / 2, my = (w.a[1] + w.b[1]) / 2;
      const nx = -(w.b[1] - w.a[1]), ny = w.b[0] - w.a[0];
      const L = Math.hypot(nx, ny) || 1;
      return `<text x="${mx - (nx / L) * 7}" y="${my - (ny / L) * 7 + f1 * 0.3}" class="wl" font-size="${f1 * 0.7}">${w.name.split(" · ")[0]}</text>`;
    }).join("")}
  </svg>`;

  // ---------- one elevation per wall that carries boxes
  const byWall = {};
  for (const u of U) (byWall[u.wall] ??= []).push(u);
  const elev = Object.entries(byWall).map(([id, list]) => {
    const u1 = Math.max(...list.map(b => b.u1)), p2 = 14;
    const f2 = fsOf(Math.max(u1, C) + p2 * 2);
    const depths = [...new Set(list.map(b => R(b.d)))].sort((a, b) => a - b);
    return `
    <h4 class="bsh">${walls[id]} &mdash; ${depths.map(d => `${d}" deep`).join(" and ")}</h4>
    <svg viewBox="${-p2} ${-p2} ${u1 + p2 * 2} ${C + p2 * 2}" class="bs el">
      <rect x="0" y="0" width="${u1}" height="${C}" class="wallbg"/>
      ${list.map(b => {
        const y = C - b.zb;
        return `<rect x="${b.u0}" y="${y}" width="${b.w}" height="${b.h}" class="bx"/>
          <text x="${b.u0 + b.w / 2}" y="${y + b.h / 2 - f2 * 0.25}" class="n" font-size="${f2}">${num.get(b)}</text>
          <text x="${b.u0 + b.w / 2}" y="${y + b.h / 2 + f2 * 0.95}" class="dim" font-size="${f2 * 0.78}">${R(b.w)}W &#215; ${R(b.h)}H</text>`;
      }).join("")}
      <text x="${u1 / 2}" y="${C + f2 * 1.3}" class="d" font-size="${f2 * 0.62}">${frac(u1, 8)} of wall &#183; floor at bottom, ceiling ${R(C)}"</text>
    </svg>`;
  }).join("");

  root.innerHTML = `
  <h3 class="tblh">${model.info.name} &mdash; cabinet boxes for quoting</h3>
  <p class="info">Room ${ftin(W)} &#215; ${ftin(H)}, ceiling ${ftin(C)}. ${U.length} boxes.
  Sizes are finished outside dimensions in inches: <b>W</b> wide &#215; <b>H</b> high &#215; <b>D</b> front to back.
  No brand or part numbers &mdash; quote them however you build them.</p>

  <div class="bswrap">${plan}</div>
  <p class="info">Plan. Numbers match the list below.</p>

  ${elev}

  <div class="tblwrap"><table>
    <thead><tr><th>#</th><th>Wall</th><th>Width</th><th>Height</th><th>Depth</th><th>What goes in it</th></tr></thead>
    <tbody>
      ${U.map(u => `<tr>
        <td><span class="tag2">${num.get(u)}</span></td>
        <td>${walls[u.wall].split(" · ")[0]}${u.corner ? ` + ${walls[u.legWall].split(" · ")[0]}` : ""}</td>
        <td class="mono">${R(u.w)}"${u.corner ? " each leg" : ""}</td>
        <td class="mono">${R(u.h)}"</td>
        <td class="mono">${R(u.d)}"</td>
        <td>${u.corner ? "L-shaped corner unit, bi-fold front. " : ""}${fit(model, u)}</td>
      </tr>`).join("")}
    </tbody>
  </table></div>
  <p class="info">Boxes sit on the floor unless the elevation shows them up the wall.
  Anything taller than you make in one piece can be two stacked &mdash; tell us how you would do it.</p>`;
}
