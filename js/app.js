import { INFO, DEFAULTS, build } from "./closets/rohan.js";
import { renderPlan } from "./views/plan.js";
import { renderElevations } from "./views/elevation.js";
import { renderSchedule } from "./views/schedule.js";
import { frac, ftin } from "./lib/units.js";

const STORE = `closets.${INFO.id}.v1`;

const CONTROLS = [
  ["Shell (field-verify)", [
    { key: "closetW", label: "Closet width", min: 36, max: 60, step: 0.5 },
    { key: "mainD", label: "Left wall length", min: 40, max: 64, step: 0.5 },
    { key: "alcoveW", label: "Alcove width", min: 18, max: 36, step: 0.5 },
    { key: "totalL", label: "Door wall length", min: 66, max: 96, step: 0.5 },
    { key: "ceiling", label: "Ceiling", min: 96, max: 132, step: 1, fmt: ftin },
  ]],
  ["Door", [
    { key: "doorAt", label: "Opening starts from top wall", min: 0, max: 60, step: 0.5 },
    { key: "doorRO", label: "Rough opening", min: 24, max: 36, step: 0.5 },
    { key: "hinge", label: "Handing", type: "select", options: [["near", "LHO · hinge near top wall"], ["far", "RHO · hinge far side"]] },
  ]],
  ["Hanging", [
    { key: "rodZ", label: "Rod height", min: 60, max: 84, step: 0.5 },
    { key: "hangDepth", label: "Hanging depth", min: 20, max: 28, step: 0.5 },
    { key: "hatDepth", label: "Hat shelf depth", min: 10, max: 16, step: 0.5 },
  ]],
  ["Drawer tower", [
    { key: "towerDepth", label: "Tower depth", min: 14, max: 24, step: 0.5 },
    { key: "fronts", label: "Drawer front heights, top → bottom", type: "text" },
    { key: "towerShelves", label: "Shelves above the counter", min: 0, max: 4, step: 1, fmt: v => v },
  ]],
  ["Alcove", [
    { key: "alcoveBottom", label: "Lowest shelf (hamper below)", min: 20, max: 40, step: 0.5 },
    { key: "alcoveShelves", label: "Shelves", min: 2, max: 6, step: 1, fmt: v => v },
    { key: "alcoveDepth", label: "Shelf depth", min: 10, max: 16, step: 0.5 },
  ]],
  ["Upper storage", [
    { key: "bandOn", label: "Shelves above the door, all walls", type: "check" },
    { key: "band1", label: "First upper shelf", min: 84, max: 100, step: 0.5 },
    { key: "band2", label: "Second upper shelf", min: 96, max: 114, step: 0.5 },
  ]],
  ["Look", [
    { key: "finish", label: "Finish", type: "select", options: [["oak", "White oak"], ["white", "Painted white"], ["walnut", "Walnut"]] },
    { key: "lights", label: "LED strips on", type: "check" },
  ]],
];

function load() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } }
function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* private mode */ } }

let state = { ...DEFAULTS, ...load() };
let model = null, three = null;
const $ = id => document.getElementById(id);

function buildControls() {
  const host = $("controls");
  host.innerHTML = "";
  for (const [title, items] of CONTROLS) {
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
      } else if (c.type === "text") {
        row.innerHTML = `<label for="${id}">${c.label}</label><input type="text" id="${id}" spellcheck="false">`;
        const inp = row.querySelector("input"); inp.value = state[c.key];
        inp.oninput = () => set(c.key, inp.value);
      } else {
        const fmt = c.fmt || (v => frac(v, 8));
        row.innerHTML = `<label for="${id}">${c.label}<output></output></label><input type="range" id="${id}" min="${c.min}" max="${c.max}" step="${c.step}">`;
        const inp = row.querySelector("input"), out = row.querySelector("output");
        inp.value = state[c.key]; out.textContent = fmt(+inp.value);
        inp.oninput = () => { out.textContent = fmt(+inp.value); set(c.key, +inp.value); };
      }
      grp.append(row);
    }
    host.append(grp);
  }
  const reset = document.createElement("button");
  reset.className = "resetbtn"; reset.textContent = "Reset to defaults";
  reset.onclick = () => { state = { ...DEFAULTS }; save(); buildControls(); render(); };
  host.append(reset);
}

let pending = 0;
function set(key, value) {
  state[key] = value; save();
  cancelAnimationFrame(pending); pending = requestAnimationFrame(render);
}

function render() {
  model = build(state);
  const m = model.metrics, c = model.closet;
  $("mSize").textContent = `${ftin(c.W)} × ${ftin(c.L)}`;
  $("mCeil").textContent = ftin(c.ceiling);
  $("mRod").textContent = `${frac(m.rodLen, 8)} @ ${frac(m.rodZ, 8)}`;
  $("mDr").textContent = `${model.drawers.length} × ${m.slide}" deep`;
  renderPlan($("plan"), model);
  renderElevations($("elevs"), model);
  renderSchedule($("sched"), model);
  if (three) three.update(model);
}

document.querySelectorAll(".tabbtn").forEach(b => b.onclick = () => {
  document.querySelectorAll(".tabbtn").forEach(x => x.classList.toggle("on", x === b));
  document.querySelectorAll(".tabpanel").forEach(p => p.classList.toggle("on", p.id === b.dataset.tab));
  if (b.dataset.tab === "p3d" && three) three.resize();
});

buildControls();
render();

import("./views/three-view.js").then(mod => {
  three = mod.createThreeView($("three"));
  three.update(model);
  document.querySelectorAll("[data-view]").forEach(b => b.onclick = () => three.view(b.dataset.view));
}).catch(err => {
  console.error(err);
  $("three").insertAdjacentHTML("beforeend", `<p style="color:#ccc;padding:20px">The 3D view needs an internet connection to load Three.js. The drawings in the other tabs still work.</p>`);
});
