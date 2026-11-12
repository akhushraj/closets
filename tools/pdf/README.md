# Plywood elevation PDF

One landscape sheet per elevation that carries Amir's work, headed with the room.
Master and Maya keep their cabinets — the open question about how the deck is
carried only reads with the boxes drawn. Everything else is plywood only.

    node tools/pdf/build.mjs                       # writes plywood-elevations.html
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
      --headless --disable-gpu --no-pdf-header-footer \
      --print-to-pdf="$PWD/plywood-elevations.pdf" \
      "file://$PWD/plywood-elevations.html"

`dom.mjs` is a small shim so `js/views/elevation.js` runs under Node and the PDF
comes off the same renderer as the app, not a second drawing path.
