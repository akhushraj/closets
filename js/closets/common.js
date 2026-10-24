// Shared pieces for closet modules: per-shelf controls (Shelf 1 = lowest, each with on/off),
// the Look group, and small checks.
import { frac } from "../lib/units.js";

// DEFAULTS entries for a bank of shelves: `on` heights start checked, `off` heights start unchecked.
export function shelfSlots(prefix, on, off = []) {
  const all = [...on.map(z => [z, true]), ...off.map(z => [z, false])].sort((a, b) => a[0] - b[0]);
  const o = {};
  all.forEach(([z, en], i) => { o[`${prefix}${i + 1}`] = z; o[`${prefix}${i + 1}on`] = en; });
  return o;
}

export function shelfControls(prefix, n, title, extra = [], from = 1) {
  return [title, [
    ...Array.from({ length: n }, (_, k) => ({ key: `${prefix}${k + 1}`, onKey: `${prefix}${k + 1}on`, type: "shelf", bank: prefix,
      label: k + from === 1 ? "Shelf 1 (lowest)" : `Shelf ${k + from}`, min: 4, max: 116, step: 0.5 })),
    ...extra,
  ]];
}

/* ---------- A shelf bank per cabinet, where a cabinet can copy a neighbour instead of
   being set by hand. `banks` maps prefix -> how many slots that bank has. ---------- */
export function matchControl(prefix, neighbours) {
  return { key: `${prefix}match`, label: "Shelf heights", type: "select",
    options: [["own", "Set below"], ...neighbours.map(([k, lbl]) => [k, `Same heights as ${lbl}`])] };
}

// Follow `match` links until one sets its own heights. If they point at each other, that is
// still a request for them to be the same, so the whole loop reads from one bank rather than
// each quietly falling back to its own - which looked like the match doing nothing at all.
export function resolveShelves(p, prefix, banks, seen = new Set()) {
  const to = p[`${prefix}match`];
  if (to && to !== "own" && banks[to]) {
    if (seen.has(to) || to === prefix) return readShelves(p, loopSource(seen, prefix), banks[loopSource(seen, prefix)]);
    seen.add(prefix);
    return resolveShelves(p, to, banks, seen);
  }
  return readShelves(p, prefix, banks[prefix]);
}

const loopSource = (seen, prefix) => [...seen, prefix].sort()[0];

// Which banks are in a match loop, so the drawing can say so.
export function matchLoops(p, banks) {
  const bad = new Set();
  for (const k of Object.keys(banks)) {
    const seen = new Set();
    let at = k;
    while (true) {
      const to = p[`${at}match`];
      if (!to || to === "own" || !banks[to]) break;
      if (seen.has(to) || to === at) { bad.add(k); break; }
      seen.add(at); at = to;
    }
  }
  return [...bad];
}

export function readShelves(p, prefix, n) {
  const v = [];
  for (let i = 1; i <= n; i++) if (p[`${prefix}${i}on`]) v.push(+p[`${prefix}${i}`]);
  return v.sort((a, b) => a - b);
}

export function spacingWarnings(levels, where) {
  const w = [];
  for (let i = 1; i < levels.length; i++)
    if (levels[i] - levels[i - 1] < 6)
      w.push(`${where}: two shelves are only ${frac(levels[i] - levels[i - 1], 8)} apart (tops at ${levels[i - 1]}" and ${levels[i]}").`);
  return w;
}

export const LOOK = ["Look", [
  { key: "finish", label: "Finish", type: "select", options: [["oak", "White oak"], ["white", "Painted white"], ["walnut", "Walnut"]] },
  { key: "oneFinish", label: "Everything in the finish colour (otherwise bought boxes read as wood, Amir's plywood as the finish)", type: "check" },
  { key: "lights", label: "LED strips on", type: "check" },
]];

export const PLYWOOD_NOTE = "Fixed shelves: 3/4\" Baltic birch or birch cabinet plywood resting on 3/4\" × 1-1/2\" cleats screwed into the studs on three sides, with a 3/4\" × 1-1/2\" front strip nailed on. The shelves lift out.";

/* ---------- Suppliers. East Star and Aydin (ABS) make nearly the same catalogue; the
   differences that show up on a drawing are the shallow depth, whether doors are quoted,
   and how anything over the standard box height gets built. ---------- */
export const ABS = {
  name: "Aydin (ABS)",
  widths: [15, 18, 21, 24, 30, 36],
  depths: [15, 18, 24],
  shallow: 15,            // East Star's shallow box is 15-1/2"
  stdTop: 94,             // taller than this is a second box stacked on the first
};

export const SUPPLIER_CTRL = {
  key: "supplier", label: "Priced by", type: "select",
  options: [["es", "East Star"], ["abs", "Aydin Building Supplies"]],
};

// In ABS mode a 15-1/2" box becomes 15". Everything else they both make.
export const absDepth = (d, on) => (on && Math.abs(d - 15.5) < 0.3 ? 15 : d);

// ABS builds anything over 94" as a 94" box with a second box on top. Returns the
// segments to draw, so the seam shows on the elevation and the count matches the quote.
export function stackTops(top, on, std = ABS.stdTop) {
  if (!on || top <= std + 0.01) return [{ z0: 0, top }];
  return [{ z0: 0, top: std }, { z0: std, top, topper: true }];
}

/* ---------- Tie a drawn box back to a line on the supplier's quote, so the drawing can be
   counted against the paper. Unmatched boxes are worth seeing too - they are the ones
   nobody has priced yet. ---------- */
// For a box nobody has quoted, the useful label is its size: height x width x depth.
export const dimTag = (h, w, d) => `${Math.round(h)}H ${Math.round(w)}W ${Math.round(d)}D`;

export function quoteTagger(items) {
  const FLAGS = ["kind", "rod", "drawers", "wer", "sink"];
  return (w, d, extra = {}) => {
    const hit = items.find(q =>
      Math.abs(q.w - w) < 0.6 && Math.abs(q.d - d) < 0.6 &&
      FLAGS.every(k => q[k] === undefined ||
        (typeof q[k] === "string" ? q[k] === extra[k] : !!q[k] === !!extra[k])));
    if (!hit) return null;
    const n = String(hit.n);
    return { ...hit, tag: n.includes("#") ? n : `#${n}`, money: `$${hit.price.toLocaleString()}` };
  };
}
