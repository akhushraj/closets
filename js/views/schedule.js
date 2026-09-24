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
  ${model.gcText ? `<div class="gcbox"><div class="gchead"><b>Send to Amir</b><button class="copybtn" type="button">Copy</button></div><pre class="gctext">${model.gcText}</pre></div>` : ""}
  ${model.warnings.map(w => `<div class="warn">${w}</div>`).join("")}
  <details class="more"><summary>Everything else &mdash; numbers, notes${model.drawerGroups.length ? ", drawer boxes" : ""}</summary>
    <div class="stats">${model.stats.map(card).join("")}</div>
    ${(model.notes || []).length ? `<ul class="notes">${model.notes.map(n => `<li>${n}</li>`).join("")}</ul>` : ""}
    ${model.drawerGroups.map(table).join("")}
    ${model.drawerGroups.length ? `<p class="info">Boxes are 1/2" plywood with a 1/4" bottom set in a groove, so the usable height is 1/2" less than the box.
    Full-extension slides take 1/2" per side. Fronts overlay the carcass with 1/8" reveals.</p>` : ""}
  </details>`;

  const btn = root.querySelector(".copybtn");
  if (btn) btn.onclick = async () => {
    try { await navigator.clipboard.writeText(model.gcText); btn.textContent = "Copied"; }
    catch { const r = document.createRange(); r.selectNode(root.querySelector(".gctext")); getSelection().removeAllRanges(); getSelection().addRange(r); btn.textContent = "Select + copy"; }
    setTimeout(() => (btn.textContent = "Copy"), 1800);
  };
}
