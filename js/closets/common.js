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

export function shelfControls(prefix, n, title, extra = []) {
  return [title, [
    ...Array.from({ length: n }, (_, k) => ({ key: `${prefix}${k + 1}`, onKey: `${prefix}${k + 1}on`, type: "shelf",
      label: k === 0 ? "Shelf 1 (lowest)" : `Shelf ${k + 1}`, min: 4, max: 116, step: 0.5 })),
    ...extra,
  ]];
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
