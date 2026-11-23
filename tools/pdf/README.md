# Plywood elevations PDF

One landscape sheet per wall that carries site-built plywood, rendered through the app's own
`js/views/elevation.js` (plus `section.js` and `detail.js`) under a small DOM shim, so the sheets
cannot drift from what the app draws.

Build, then print:

```
node tools/pdf/build.mjs
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --no-pdf-header-footer \
  --print-to-pdf="$PWD/plywood-elevations-$(date +%Y-%m-%d-%H%M).pdf" \
  "file://$PWD/plywood-elevations.html"
```

The filename carries date and time, and the same stamp prints in every sheet's footer - so a
regenerated file never lands on top of one somebody is reading, and a printout on a bench can
always be matched back to a version.

Master and Maya and the laundry are drawn with their cabinets greyed, because their plywood
lands on those cabinets. Everywhere else is plywood only. Walls with no plywood are left out.
