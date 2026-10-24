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

  // The supplier's quote, box by box, so the drawing can be counted against the paper.
  const q = model.quote;
  const quoteTable = !q ? "" : (() => {
    const total = q.rows.reduce((a, r) => a + (r.q ? r.q.price : 0), 0);
    const miss = q.rows.filter(r => !r.q).length;
    return `
  <h3 class="tblh">${q.supplier} &mdash; quote against the drawing</h3>
  <div class="tblwrap"><table>
    <thead><tr><th>Where</th><th>Box</th><th>Quote line</th><th>What they quoted</th><th>Price</th></tr></thead>
    <tbody>
      ${q.rows.map(r => `<tr${r.q ? "" : ' class="nq"'}>
        <td>${r.where}</td>
        <td class="mono">${r.h ? `${frac(r.h, 8)} h &times; ` : ""}${r.w}" w &times; ${r.d}" d</td>
        <td>${r.q ? `<span class="tag2">${r.q.tag}</span>` : "&mdash;"}</td>
        <td>${r.q ? r.q.what : "<i>not on the quote</i>"}</td>
        <td class="mono">${r.q ? "$" + r.q.price.toLocaleString() : "&mdash;"}</td>
      </tr>`).join("")}
      <tr class="tot"><td colspan="4"><b>${q.rows.length - miss} of ${q.rows.length} boxes priced</b>${miss ? ` &mdash; ${miss} still to quote` : ""}</td><td class="mono"><b>$${total.toLocaleString()}</b></td></tr>
    </tbody>
  </table></div>
  <p class="info"><b>Reading the quote line:</b> ${q.rows.some(r => r.q && /^p\\d/.test(r.q.tag))
    ? `<code>p1 #2</code> means page 1, item 2 of their handwritten quote. <b>p1</b> is the sheet they headed &ldquo;ADU kitchenette&rdquo; by mistake &mdash; it is the sink alcove and the machine wall. <b>p2</b> is the sheet headed &ldquo;laundry&rdquo;, which is wall B.`
    : `<code>#2</code> is item 2 of their handwritten quote for this closet.`}
  Boxes only &mdash; no filler, no panels, no tax.</p>`;
  })();

  root.innerHTML = `
  ${quoteTable}
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
