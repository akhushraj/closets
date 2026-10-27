// A-5 Pricing: the same closet costed by both suppliers, ABS first, East Star under it.
// ABS prices come from their handwritten quote. East Star has not quoted, so their rows
// list the boxes with the price left open rather than guessed at.
const money = n => "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
const money2 = n => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TAX = 0.09375;          // San Jose. Change here if it is wrong.
const LED = 180;              // East Star's adder per unit

// Where a model has no quote, the box list is still worth having - it is what you send out.
function rowsOf(model) {
  if (model.quote && model.quote.rows.length) return model.quote.rows;
  const names = Object.fromEntries((model.closet.walls || []).map(w => [w.id, w.name.split(" · ")[0]]));
  return (model.modules || []).filter(x => x.kind === "cabinets" && x.atag !== "")
    .map(b => ({ where: names[b.wall] || b.wall, w: b.u1 - b.u0, d: b.v1 - b.v0,
      h: b.zb != null && b.za != null ? b.zb - b.za : null, q: null }));
}

const block = (title, model, note) => {
  const rows = rowsOf(model);
  if (!rows.length) return `<h3 class="tblh">${title}</h3><p class="info">Nothing from ${title} in this closet.</p>`;
  const total = rows.reduce((a, r) => a + (r.q ? r.q.price : 0), 0);
  const priced = rows.filter(r => r.q).length;
  return `
  <h3 class="tblh">${title} &mdash; ${rows.length} boxes</h3>
  <div class="tblwrap"><table>
    <thead><tr><th>Where</th><th>Box</th><th>Quote line</th><th>What they quoted</th><th class="num">Price</th></tr></thead>
    <tbody>
      ${rows.map(r => `<tr class="${r.q ? "" : "nq"}">
        <td>${r.where}</td>
        <td class="mono">${r.h ? `${Math.round(r.h)}H ` : ""}${Math.round(r.w)}W ${Math.round(r.d)}D</td>
        <td>${r.q ? `<span class="tag2">${r.q.tag}</span>` : "&mdash;"}</td>
        <td>${r.q ? r.q.what : "<i>needs a price</i>"}</td>
        <td class="mono num">${r.q ? money(r.q.price) : "&mdash;"}</td>
      </tr>`).join("")}
      <tr class="tot"><td colspan="4"><b>${priced} of ${rows.length} boxes priced</b>${priced < rows.length ? ` &mdash; ${rows.length - priced} still to quote` : ""}</td>
        <td class="mono num"><b>${priced ? money(total) : "&mdash;"}</b></td></tr>
    </tbody>
  </table></div>
  ${note ? `<p class="info">${note}</p>` : ""}`;
};

export function renderPricing(root, absModel, esModel, esQuote) {
  const a = rowsOf(absModel), e = rowsOf(esModel);
  const aTot = a.reduce((s, r) => s + (r.q ? r.q.price : 0), 0);
  const aWithTax = aTot * (1 + TAX);
  const esTot = esQuote ? esQuote.total : null;
  const cheaper = esTot == null ? null : (esTot < aWithTax ? "East Star" : "ABS");
  const gap = esTot == null ? 0 : Math.abs(aWithTax - esTot);

  const compare = esTot == null ? "" : `
  <h3 class="tblh">Like for like</h3>
  <div class="tblwrap"><table>
    <thead><tr><th>Supplier</th><th>What it covers</th><th class="num">Boxes</th><th class="num">Ex tax</th><th class="num">With tax</th></tr></thead>
    <tbody>
      <tr><td>Aydin (ABS)</td><td>${a.filter(r => r.q).length} of ${a.length} boxes priced${a.some(r => !r.q) ? " &mdash; not complete" : ""}</td>
        <td class="num mono">${a.length}</td><td class="mono num">${money(aTot)}</td><td class="mono num">${money(aWithTax)}</td></tr>
      <tr><td>East Star</td><td>${esQuote.what}</td>
        <td class="num mono">${e.length}</td><td class="mono num">${money(esTot / (1 + TAX))}</td><td class="mono num">${money2(esTot)}</td></tr>
      <tr class="tot"><td colspan="4"><b>${cheaper} is cheaper by</b></td><td class="mono num"><b>${money(gap)}</b></td></tr>
    </tbody>
  </table></div>
  <p class="info">East Star quoted a room total with tax already in; ABS quoted per box before tax.
  To compare them I have grossed ABS up at <b>${(TAX * 100).toFixed(3)}%</b> and backed the same rate out of East Star &mdash;
  tell me if that rate is wrong and I will change it.
  ${a.some(r => !r.q) ? `<b>ABS is not a complete quote yet</b> &mdash; ${a.filter(r => !r.q).length} box${a.filter(r => !r.q).length > 1 ? "es" : ""} still unpriced, so their real number is higher than shown.` : ""}
  Neither includes LED; East Star put that at <b>${money(LED)} per unit</b>, so ${e.length} units would be about ${money(LED * e.length)} more.</p>`;

  root.innerHTML = `
  ${compare}
  ${block("Aydin Building Supplies", absModel,
    "Boxes only &mdash; no filler, no panels, no toe kick, no tax. Quote lines read <code>p1 #2</code> = page 1, item 2; <b>p1</b> is the sheet headed &ldquo;ADU kitchenette&rdquo; by mistake, <b>p2</b> the one headed &ldquo;laundry&rdquo;.")}

  ${block("East Star", esModel, esTot == null ? "" :
    `East Star priced the room as one line &mdash; <b>${money2(esTot)}</b> for &ldquo;${esQuote.what}&rdquo;, tax included &mdash; not box by box, so there is no per-box column to fill in.`)}

  <div class="warn">The two box lists are not identical, so this is not a straight swap.
  East Star's shallow box is 15-1/2" where ABS use 15" or 18", and 94" is East Star's tallest, so anything over that is two boxes stacked.
  ${a.length !== e.length ? `That is why ABS comes to ${a.length} boxes here and East Star ${e.length}.` : ""}</div>`;
}
