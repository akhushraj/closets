import "./dom.mjs";
import { Node } from "./dom.mjs";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const { renderElevations } = await import(path.join(ROOT, "js/views/elevation.js"));
const { renderSections } = await import(path.join(ROOT, "js/views/section.js"));
const { figureFor } = await import(path.join(ROOT, "js/views/detail.js"));

const STAMP = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit", hour12: false }).replace(",", "");

// every room with plywood work; the laundry is all cabinets
const ROOMS = ["master", "maya", "rohan", "guest", "office", "pantry", "masterbath", "laundry"];

const css = fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/<style>([\s\S]*?)<\/style>/)[1];

const pages = [];
for (const id of ROOMS) {
  const mod = await import(path.join(ROOT, `js/closets/${id}.js`));
  // Maya keeps her cabinets: the deck question over them only reads with the boxes drawn.
  // Master dropped its deck, so it is plywood-only like the rest.
  const withBoxes = id === "maya" || id === "laundry";
  const model = mod.build({ ...mod.DEFAULTS, plyOnly: !withBoxes });
  const root = new Node("div", null);
  renderElevations(root, model);
  for (const fig of root.children) {
    const cap = fig.children.find(c => c.tag === "figcaption");
    const svg = fig.children.find(c => c.tag === "svg");
    if (!svg) continue;
    // keep only walls that actually carry Amir's work
    const n = (svg.outerHTML.match(/class="p-(shelf|carcass|cleat|backboard|counter)"/g) || []).length;
    if (n < 2) continue;
    const wallId = (cap._html.match(/tag2">([^<]+)</) || [])[1];
    const side = (model.details || []).filter(d => d.withWall === wallId)
      .map(d => { const f = figureFor(d); return { cap: f.children.find(c => c.tag === "figcaption")._html, svg: f.children.find(c => c.tag === "svg").outerHTML }; });
    pages.push({ withBoxes, side, room: `${mod.INFO.name} — ${mod.INFO.room}`, wall: cap._html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/· (Aydin \(ABS\)|East Star) /, "").trim(), svg: svg.outerHTML });
  }
  // sections: a cut through something an elevation can only show edge-on
  const sroot = new Node("div", null);
  renderSections(sroot, model);
  for (const fig of sroot.children) {
    const cap = fig.children.find(c => c.tag === "figcaption");
    const svg = fig.children.find(c => c.tag === "svg");
    if (!svg) continue;
    pages.push({ withBoxes, section: true, room: `${mod.INFO.name} — ${mod.INFO.room}`,
      wall: cap._html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(), svg: svg.outerHTML });
  }
}

const body = pages.map(p => `
<section class="sheet">
  <header><h1>${p.room}</h1><h2>${p.wall}</h2></header>
  <div class="draw"><div class="pane main">${p.svg}</div>${(p.side || []).map(d => `<div class="pane side"><div class="sidecap">${d.cap}</div>${d.svg}</div>`).join("")}</div>
  <footer><span>${p.section ? "Section — cut through the closet, looking along the wall. " : ""}${p.withBoxes ? "Cabinets shown for context — Amir builds the plywood only." : "Plywood work only — bought items are not shown."} 5228 Union Ave</span><span>${STAMP}</span></footer>
</section>`).join("");

fs.writeFileSync(path.join(ROOT, "plywood-elevations.html"), `<!doctype html>
<html><head><meta charset="utf-8"><title>Plywood elevations</title>
<style>
${css}
@page { size: letter landscape; margin: 0.45in; }
html,body{background:#fff;margin:0;padding:0}
.sheet{break-after:page;page-break-after:always;display:flex;flex-direction:column;height:7.5in;overflow:hidden}
.sheet:last-child{break-after:auto;page-break-after:auto}
.sheet header{border-bottom:2px solid #1A1A17;padding-bottom:6px;margin-bottom:14px}
.sheet h1{font:700 21px/1.2 ui-sans-serif,system-ui,sans-serif;color:#1A1A17;margin:0}
.sheet h2{font:600 13px/1.3 ui-monospace,monospace;color:#5C5A54;margin:3px 0 0}
.sheet .draw{flex:1;min-height:0;display:flex;gap:0.3in;align-items:stretch}
.sheet .pane{display:flex;flex-direction:column;min-width:0;min-height:0}
.sheet .pane.main{flex:1}
.sheet .pane.side{flex:0 0 2.9in;border-left:1px solid #CFCABE;padding-left:0.28in}
.sheet .sidecap{font:600 11px/1.3 ui-monospace,monospace;color:#5C5A54;margin-bottom:6px}
.sheet .sidecap .tag2{font-weight:700;color:#1A1A17}
.sheet footer{border-top:1px solid #CFCABE;margin-top:10px;padding-top:5px;font:400 10px/1.3 ui-sans-serif,sans-serif;color:#6B6860;display:flex;justify-content:space-between;gap:12px}
/* viewBox + preserveAspectRatio does the fitting, so the whole drawing always lands */
.sheet svg{width:100%!important;max-width:100%!important;height:100%;max-height:none;display:block}
</style></head><body>${body}</body></html>`);
console.log(`${pages.length} sheets:`);
for (const p of pages) console.log("  " + p.room + "  |  " + p.wall);
