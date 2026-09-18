// A-3 Summary numbers + a drawer table per drawer bank, for any closet model.
import { frac } from "../lib/units.js";

export function renderSchedule(root, model) {
  const card = s => `<div class="stat"><span class="k">${s.k}</span><span class="v mono">${s.v}</span><span class="s">${s.s || ""}</span></div>`;
  const table = grp => `
  <h3 class="tblh">${grp.name}, top to bottom</h3>
  <div class="tblwrap"><table>
    <thead><tr>
      <th>Drawer</th><th>Front height</th><th>Usable height inside</th>
      <th>Inside depth, front to back</th><th>Inside width</th><th>Box (W × H × L)</th>
    </tr></thead>
    <tbody>
      ${[...grp.drawers].reverse().map(d => `<tr>
        <td><span class="tag2">${d.label}</span></td>
        <td class="mono">${frac(d.frontH, 8)}</td>
        <td class="mono"><b>${frac(d.inH, 8)}</b></td>
        <td class="mono"><b>${frac(d.inL, 8)}</b></td>
        <td class="mono">${frac(d.inW, 8)}</td>
        <td class="mono">${frac(d.boxW, 8)} × ${frac(d.boxH, 8)} × ${d.boxL}"</td>
      </tr>`).join("")}
    </tbody>
  </table></div>`;

  root.innerHTML = `
  <div class="stats">${model.stats.map(card).join("")}</div>
  ${(model.notes || []).length ? `<ul class="notes">${model.notes.map(n => `<li>${n}</li>`).join("")}</ul>` : ""}
  ${model.drawerGroups.map(table).join("")}
  <p class="info">Boxes are 1/2" plywood with a 1/4" bottom set in a groove, so the usable height is 1/2" less than the box.
  Full-extension side-mount slides take 1/2" per side. The fronts overlay the carcass with 1/8" reveals between them.
  Everything follows the controls. Field-verify before cutting.</p>
  ${model.warnings.map(w => `<div class="warn">${w}</div>`).join("")}`;
}
