import { CLOSETS, byId } from "./closets/index.js";
import { renderPlan } from "./views/plan.js";
import { renderElevations } from "./views/elevation.js";
import { renderSchedule } from "./views/schedule.js";
import { renderWiring } from "./views/wiring.js";
import { frac, ftin } from "./lib/units.js";

const UPCOMING = [];
const FMT = { ftin, int: v => v };

function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } }

const $ = id => document.getElementById(id);
let mod = byId(location.hash.slice(1) || lsGet("closets.last"));
let state = {}, model = null, three = null;
const storeKey = () => `closets.${mod.INFO.id}.v3`;

function loadState() { state = { ...mod.DEFAULTS, ...(lsGet(storeKey()) || {}) }; }

function buildPicker() {
  const sel = $("closetPick");
  sel.innerHTML = CLOSETS.map(c => `<option value="${c.INFO.id}">${c.INFO.name} · ${c.INFO.room}</option>`).join("") +
    UPCOMING.map(n => `<option disabled>${n} (next)</option>`).join("");
  sel.value = mod.INFO.id;
  sel.onchange = () => {
    mod = byId(sel.value);
    lsSet("closets.last", mod.INFO.id);
    history.replaceState(null, "", "#" + mod.INFO.id);
    loadState(); buildControls(); render();
  };
}

// shelf prefix -> the rows in that bank, so each row can show the clear space down to the one below
let banks = {};
function showGaps() {
  for (const rows of Object.values(banks)) {
    for (const r of rows) r.gap.textContent = "";
    const on = rows.filter(r => r.on()).map(r => ({ r, z: +r.inp.value })).sort((a, b) => a.z - b.z);
    for (let i = 1; i < on.length; i++) {
      const c = on[i].z - on[i - 1].z - 0.75;
      on[i].r.gap.textContent = c > 0 ? `${frac(c, 8)} clear` : "clashes below";
      on[i].r.gap.classList.toggle("bad", c <= 0);
    }
  }
}

function buildControls() {
  const host = $("controls");
  host.innerHTML = "";
  banks = {};
  for (const [title, items] of mod.CONTROLS) {
    const grp = document.createElement("div"); grp.className = "cgroup";
    grp.innerHTML = `<h4>${title}</h4>`;
    for (const c of items) {
      const row = document.createElement("div"); row.className = "ctrl" + (c.type === "check" ? " check" : "");
      const id = "c_" + c.key;
      if (c.type === "check") {
        row.innerHTML = `<label for="${id}"><input type="checkbox" id="${id}"> ${c.label}</label>`;
        const inp = row.querySelector("input"); inp.checked = !!state[c.key];
        inp.onchange = () => set(c.key, inp.checked);
      } else if (c.type === "select") {
        row.innerHTML = `<label for="${id}">${c.label}</label><select id="${id}">${c.options.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select>`;
        const inp = row.querySelector("select"); inp.value = state[c.key];
        inp.onchange = () => set(c.key, inp.value);
      } else if (c.type === "shelf") {
        // on/off checkbox, the height, and the clear space down to the shelf below
        row.innerHTML = `<label for="${id}"><span><input type="checkbox" id="${id}_on"> ${c.label}</span><span class="vals"><output class="gap"></output><output></output></span></label><input type="range" id="${id}" min="${c.min}" max="${c.max}" step="${c.step}">`;
        const cb = row.querySelector("input[type=checkbox]"), inp = row.querySelector("input[type=range]");
        const gap = row.querySelector("output.gap"), out = row.querySelector("output:not(.gap)");
        const sync = () => { inp.disabled = !cb.checked; row.classList.toggle("off", !cb.checked); };
        cb.checked = !!state[c.onKey]; inp.value = state[c.key]; out.textContent = frac(+inp.value, 8); sync();
        cb.onchange = () => { sync(); set(c.onKey, cb.checked); };
        inp.oninput = () => { out.textContent = frac(+inp.value, 8); set(c.key, +inp.value); };
        (banks[c.key.replace(/\d+$/, "")] ??= []).push({ on: () => cb.checked, inp, gap });
      } else if (c.type === "text") {
        row.innerHTML = `<label for="${id}">${c.label}</label><input type="text" id="${id}" spellcheck="false">`;
        const inp = row.querySelector("input"); inp.value = state[c.key];
        inp.oninput = () => set(c.key, inp.value);
      } else {
        const fmt = FMT[c.fmt] || (v => frac(v, 8));
        const vals = c.gapFrom ? `<span class="vals"><output class="gap"></output><output></output></span>` : `<output></output>`;
        row.innerHTML = `<label for="${id}">${c.label}${vals}</label><input type="range" id="${id}" min="${c.min}" max="${c.max}" step="${c.step}">`;
        const inp = row.querySelector("input"), out = row.querySelector("output:not(.gap)");
        inp.value = state[c.key]; out.textContent = fmt(+inp.value);
        inp.oninput = () => { out.textContent = fmt(+inp.value); set(c.key, +inp.value); };
        if (c.gapFrom) (banks[c.gapFrom] ??= []).push({ on: () => !c.onKey || !!state[c.onKey], inp, gap: row.querySelector("output.gap") });
      }
      grp.append(row);
    }
    host.append(grp);
  }
  showGaps();

  const reset = document.createElement("button");
  reset.className = "resetbtn"; reset.textContent = "Reset to defaults";
  reset.onclick = () => { state = { ...mod.DEFAULTS }; lsSet(storeKey(), state); buildControls(); render(); };
  host.append(reset);
}

let pending = 0;
function set(key, value) {
  state[key] = value; lsSet(storeKey(), state); showGaps();
  cancelAnimationFrame(pending); pending = requestAnimationFrame(render);
}

function render() {
  model = mod.build(state);
  const I = mod.INFO;
  document.title = `${I.name} — Closets`;
  $("title").textContent = `${I.name} — ${I.room}`;
  $("eyebrow").textContent = ["Closets · Shop Drawing Set", I.concept, I.rev].filter(Boolean).join(" · ");
  $("meta").innerHTML = model.titleMeta.map(m => `<div><span class="k">${m.k}</span><span class="v">${m.v}</span></div>`).join("");
  renderPlan($("plan"), model);
  renderElevations($("elevs"), model);
  renderSchedule($("sched"), model);
  const wtab = document.querySelector('[data-tab="pWiring"]');
  if (model.wiring && model.wiring.levels.length) { wtab.hidden = false; renderWiring($("wiring"), model); }
  else { wtab.hidden = true; if (wtab.classList.contains("on")) document.querySelector('[data-tab="pPlan"]').click(); }
  if (three) three.update(model);
}

document.querySelectorAll(".tabbtn").forEach(b => b.onclick = () => {
  document.querySelectorAll(".tabbtn").forEach(x => x.classList.toggle("on", x === b));
  document.querySelectorAll(".tabpanel").forEach(p => p.classList.toggle("on", p.id === b.dataset.tab));
  if (b.dataset.tab === "p3d" && three) three.resize();
});

loadState();
buildPicker();
buildControls();
render();

import("./views/three-view.js").then(m => {
  three = m.createThreeView($("three"));
  three.update(model);
  document.querySelectorAll("[data-view]").forEach(b => b.onclick = () => three.view(b.dataset.view));
  const wb = document.querySelector("[data-toggle=walls]");
  let walls = lsGet("closets.walls") ?? true;
  const applyWalls = () => { three.setWalls(walls); wb.textContent = walls ? "Hide walls" : "Show walls"; };
  wb.onclick = () => { walls = !walls; lsSet("closets.walls", walls); applyWalls(); };
  applyWalls();
}).catch(err => {
  console.error(err);
  $("three").insertAdjacentHTML("beforeend", `<p style="color:#ccc;padding:20px">The 3D view needs an internet connection to load Three.js. The drawings in the other tabs still work.</p>`);
});
