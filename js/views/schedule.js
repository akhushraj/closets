// Drawer schedule + summary numbers for a built closet model.
import { frac } from "../lib/units.js";

export function renderSchedule(root, model) {
  const m = model.metrics;
  const rows = [...model.drawers].reverse();   // top drawer first
  const card = (k, v, s = "") => `<div class="stat"><span class="k">${k}</span><span class="v mono">${v}</span><span class="s">${s}</span></div>`;

  root.innerHTML = `
  <div class="stats">
    ${card("Hanging rod", frac(m.rodLen, 8), `one level at ${frac(m.rodZ, 8)} to the rod`)}
    ${card("Drawers", `${rows.length} × ${m.slide}" deep`, `${m.slide}" full-extension slides`)}
    ${card("Drawer tower", `${frac(m.towerW, 8)} W × ${frac(m.towerDepth, 8)} D`, `counter at ${frac(m.counterZ, 8)}`)}
    ${card("Aisle", frac(m.aisle, 8), `${frac(Math.max(0, m.openClear), 8)} left with a drawer fully open`)}
  </div>

  <h3 class="tblh">Drawers, top to bottom</h3>
  <div class="tblwrap"><table>
    <thead><tr>
      <th>Drawer</th><th>Front height</th><th>Usable height inside</th>
      <th>Inside depth, front to back</th><th>Inside width</th><th>Box (W × H × L)</th>
    </tr></thead>
    <tbody>
      ${rows.map(d => `<tr>
        <td><span class="tag2">${d.label}</span></td>
        <td class="mono">${frac(d.frontH, 8)}</td>
        <td class="mono"><b>${frac(d.inH, 8)}</b></td>
        <td class="mono"><b>${frac(d.inL, 8)}</b></td>
        <td class="mono">${frac(d.inW, 8)}</td>
        <td class="mono">${frac(d.boxW, 8)} × ${frac(d.boxH, 8)} × ${d.boxL}"</td>
      </tr>`).join("")}
    </tbody>
  </table></div>
  <p class="info">Boxes are 1/2" plywood with a 1/4" bottom set in a groove, so the usable height is 1/2" less than the box.
  Full-extension side-mount slides take 1/2" per side. The fronts overlay the carcass with 1/8" reveals between them.
  Everything follows the controls. Field-verify before cutting.</p>
  ${m.warnings.map(w => `<div class="warn">${w}</div>`).join("")}
  `;
}
