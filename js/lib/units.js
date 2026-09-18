// All geometry is in inches.
export const PLY = 0.75;          // carcass / shelf plywood
export const FRONT = 0.75;        // drawer front thickness
export const SLIDES = [12, 14, 16, 18, 20, 22];   // standard full-extension slide lengths

export function frac(x, den = 16) {
  const neg = x < 0; x = Math.abs(x);
  let whole = Math.floor(x + 1e-9), n = Math.round((x - whole) * den);
  if (n === den) { whole++; n = 0; }
  let d = den; while (n && n % 2 === 0) { n /= 2; d /= 2; }
  const s = n ? (whole ? `${whole} ${n}/${d}` : `${n}/${d}`) : `${whole}`;
  return (neg ? "−" : "") + s + '"';
}

export function ftin(x) {
  const f = Math.floor((x + 1e-9) / 12), i = x - 12 * f;
  return f ? `${f}'-${frac(i)}` : frac(i);
}

// Longest standard slide that fits a given clear depth.
export function slideFor(depth) {
  let best = null;
  for (const L of SLIDES) if (L <= depth) best = L;
  return best;
}
