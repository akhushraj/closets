// A-5 Pricing: the same closet costed by both suppliers, ABS first, East Star under it.
// ABS prices come from their handwritten quote. East Star has not quoted, so their rows
// list the boxes with the price left open rather than guessed at.
const money = n => "$" + n.toLocaleString();

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

export function renderPricing(root, absModel, esModel) {
  const a = rowsOf(absModel), e = rowsOf(esModel);
  const aTot = a.reduce((s, r) => s + (r.q ? r.q.price : 0), 0);
  root.innerHTML = `
  ${block("Aydin Building Supplies", absModel,
    "Boxes only &mdash; no filler, no panels, no toe kick, no tax. Quote lines read <code>p1 #2</code> = page 1, item 2; <b>p1</b> is the sheet headed &ldquo;ADU kitchenette&rdquo; by mistake, <b>p2</b> the one headed &ldquo;laundry&rdquo;.")}

  ${block("East Star", esModel, "")}

  <div class="warn">East Star have not quoted this closet. The list above is what to send them.
  Their line-up differs from ABS, so the boxes are not identical: their shallow box is 15-1/2" where ABS use 15" or 18",
  and 94" is their tallest, so anything over that is two boxes stacked.
  ${a.length !== e.length ? `That is why ABS comes to ${a.length} boxes here and East Star ${e.length}.` : ""}</div>

  <p class="info">ABS as quoted: <b>${money(aTot)}</b> for ${a.filter(r => r.q).length} of ${a.length} boxes. Fill East Star's column in when it arrives and the comparison is like for like.</p>`;
}
