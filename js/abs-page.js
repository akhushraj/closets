// One sheet listing every ABS box across the three closets that use bought cabinets,
// matched to the handwritten quote. Read-only: the design lives on the closet pages.
import { frac } from "./lib/units.js";

const ROOMS = [
  { id: "master", name: "Master Closet", over: {} },
  { id: "maya", name: "Maya's Closet", over: { ends: "es" },
    flag: "Going to East Star instead — ABS have no standard 84\" box and quoted custom as very high. Shown here for comparison." },
  { id: "laundry", name: "Laundry / Mudroom", over: {} },
];

const money = n => "$" + n.toLocaleString();

const section = (name, flag, rows, fillers) => {
  const total = rows.reduce((a, r) => a + (r.q ? r.q.price : 0), 0);
  const miss = rows.filter(r => !r.q).length;
  return `
  <h2>${name} ${flag ? `<span class="sub">&mdash; ${flag}</span>` : ""}</h2>
  <table>
    <thead><tr><th>Where</th><th>Box</th><th>Quote line</th><th>What they quoted</th><th class="num">Price</th></tr></thead>
    <tbody>
      ${rows.map(r => `<tr class="${r.q ? "" : "gap"}">
        <td>${r.where}</td>
        <td class="mono">${r.w}" &times; ${r.d}" deep</td>
        <td>${r.q ? `<span class="tag">${r.q.tag}</span>` : "&mdash;"}</td>
        <td class="what">${r.q ? r.q.what : "needs a price"}</td>
        <td class="mono num">${r.q ? money(r.q.price) : "&mdash;"}</td>
      </tr>`).join("")}
      <tr class="sum"><td colspan="4">${rows.length - miss} of ${rows.length} boxes priced${miss ? ` &middot; ${miss} still to quote` : ""}</td>
        <td class="mono num">${money(total)}</td></tr>
    </tbody>
  </table>
  ${fillers.length ? `<p class="note">Filler we think it needs: ${fillers.map(f => `<span class="pill">${frac(f, 16)}</span>`).join(" ")} &mdash; ${fillers.length} piece${fillers.length > 1 ? "s" : ""}.</p>` : ""}`;
};

const out = [];
let grand = 0, gapTotal = 0;
const summary = [];

for (const r of ROOMS) {
  const mod = await import(`./closets/${r.id}.js`);
  const model = mod.build({ ...mod.DEFAULTS, supplier: "abs", ...r.over });
  const rows = model.quote ? model.quote.rows : [];
  const fillers = model.parts.filter(p => /Filler/.test(p.label || ""))
    .map(p => Math.round((p.u1 - p.u0) * 16) / 16).filter(x => x > 0.4);
  const total = rows.reduce((a, q) => a + (q.q ? q.q.price : 0), 0);
  const miss = rows.filter(q => !q.q).length;
  out.push(section(r.name, r.flag, rows, fillers));
  summary.push({ name: r.name, total, miss, boxes: rows.length, skip: !!r.flag });
  if (!r.flag) { grand += total; gapTotal += miss; }
}

out.push(`
<div class="grand">
  <h2 style="margin-top:0">What it comes to</h2>
  <table>
    ${summary.map(s => `<tr><td>${s.name}${s.skip ? ' <span class="pill">East Star</span>' : ""}</td>
      <td class="mono num">${money(s.total)}</td>
      <td class="mono num" style="color:var(--ink-soft)">${s.miss ? s.miss + " unpriced" : "complete"}</td></tr>`).join("")}
    <tr class="sum"><td>Master + Laundry, boxes only</td><td class="mono num">${money(grand)}</td>
      <td class="mono num">${gapTotal} unpriced</td></tr>
  </table>
  <p class="note">Boxes only &mdash; no filler, no panels, no toe kick, no tax. Maya is excluded from the total: it is going to East Star.</p>
</div>

<h2>What ABS still need to answer</h2>
<ol class="q">
  <li>Page 1 item 1 at $1,625 &mdash; is that <b>one 36" wall cabinet, or the whole run</b>? Three of them is 43% of the laundry.</li>
  <li>Please price a <b>24" base</b> for wall D left. You quoted 21", which leaves 5-1/8" of filler against 2-1/8" for a 24".</li>
  <li>Please price a <b>21" wall cabinet</b> for over the machines.</li>
  <li>What is the <b>ref panel</b> at $95, and where does it go?</li>
  <li>How did you arrive at <b>7 fillers</b> on master and 4 on the others? We make it 2.</li>
  <li>Confirm you make a <b>14" topper</b> to sit on a 94" box, for the 108" runs on wall B.</li>
</ol>`);

document.getElementById("out").innerHTML = out.join("");
