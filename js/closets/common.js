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

// Follow `match` links until one sets its own heights; a loop falls back to reading its own.
export function resolveShelves(p, prefix, banks, seen = new Set()) {
  const to = p[`${prefix}match`];
  if (to && to !== "own" && banks[to] && !seen.has(prefix)) {
    seen.add(prefix);
    return resolveShelves(p, to, banks, seen);
  }
  return readShelves(p, prefix, banks[prefix]);
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
  { key: "lights", label: "LED strips on", type: "check" },
]];

export const PLYWOOD_NOTE = "Fixed shelves: 3/4\" Baltic birch or birch cabinet plywood resting on 3/4\" × 1-1/2\" cleats screwed into the studs on three sides, with a 3/4\" × 1-1/2\" front strip nailed on. The shelves lift out.";
