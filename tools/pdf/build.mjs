import "./dom.mjs";
import { Node } from "./dom.mjs";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const { renderElevations } = await import(path.join(ROOT, "js/views/elevation.js"));

// every room with plywood work; the laundry is all cabinets
const ROOMS = ["master", "maya", "rohan", "guest", "office", "pantry", "masterbath"];

const css = fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/<style>([\s\S]*?)<\/style>/)[1];

const pages = [];
for (const id of ROOMS) {
  const mod = await import(path.join(ROOT, `js/closets/${id}.js`));
  // master and Maya keep their cabinets: the deck question only reads with the boxes there
  const withBoxes = id === "master" || id === "maya";
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
    pages.push({ withBoxes, room: `${mod.INFO.name} — ${mod.INFO.room}`, wall: cap._html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/· (Aydin \(ABS\)|East Star) /, "").trim(), svg: svg.outerHTML });
  }
}

const body = pages.map(p => `
<section class="sheet">
  <header><h1>${p.room}</h1><h2>${p.wall}</h2></header>
  <div class="draw">${p.svg}</div>
  <footer>${p.withBoxes ? "Cabinets shown for context — Amir builds the plywood only." : "Plywood work only — bought items are not shown."} 5228 Union Ave</footer>
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
.sheet .draw{flex:1;min-height:0;display:flex}
.sheet footer{border-top:1px solid #CFCABE;margin-top:10px;padding-top:5px;font:400 10px/1.3 ui-sans-serif,sans-serif;color:#6B6860}
/* viewBox + preserveAspectRatio does the fitting, so the whole drawing always lands */
.sheet svg{width:100%!important;max-width:100%!important;height:100%;max-height:none;display:block}
</style></head><body>${body}</body></html>`);
console.log(`${pages.length} sheets:`);
for (const p of pages) console.log("  " + p.room + "  |  " + p.wall);
