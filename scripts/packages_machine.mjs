#!/usr/bin/env node
// Draws the Packagist packages as four shipping crates on pallets along a loading rack. Each
// crate carries a label plate with the package name and what it does, a counter with its total
// downloads, and on its lid a mark of what is inside: an entity diagram, a heat map, an audit
// clock with its ledger, a CRUD form stencil.
//
// Usage: node scripts/packages_machine.mjs [downloads.json] [out.svg]
//   downloads.json: {"benmacha/diagram-bundle": 64, ...} written by scripts/contributions.py
// Node 20+, built-ins only. The isometric kit is vendored in scripts/anatomy/.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as k from "./anatomy/iso-kit.mjs";
import { BASE_CSS, compact } from "./theme.mjs";

const input = process.argv[2] || "profile-contrib/packages.json";
const output = process.argv[3] || "profile-contrib/packages.svg";
let counts = {};
try {
  counts = JSON.parse(readFileSync(input, "utf8"));
} catch {
  counts = {};
}

const PACKAGES = [
  { name: "benmacha/diagram-bundle", lines: ["Interactive Doctrine ERD, Symfony 5.4–7.x", "JSON API, React studio, SVG/PNG/JDL"], color: "blue", mark: "erd" },
  { name: "benmacha/mousetracker", lines: ["Self-hosted heatmaps and scroll maps", "with session replay, for Symfony"], color: "orange", mark: "heat" },
  { name: "benmacha/audit-bundle", lines: ["Audit trail of Doctrine entities", "rollback, web interface, REST API"], color: "green", mark: "audit" },
  { name: "benmacha/templatebundle", lines: ["CRUD interface generator", "for Symfony"], color: "purple", mark: "crud" },
];
const downloads = (name) => (Number.isFinite(counts[name]) ? Math.max(0, Math.floor(counts[name])) : null);
const TOTAL = PACKAGES.reduce((sum, p) => sum + (downloads(p.name) ?? 0), 0);
const fmt = (n) => (n === null ? "—" : n.toLocaleString("en-US"));

// ---------------------------------------------------------------- world
const CW = 150;
const CD = 72;
const CH = 58;
const PAL = 9; // pallet height
const GAP = 24;
const X0 = 0;
const RACK = { x: -16, y: -CD - 12, w: PACKAGES.length * (CW + GAP) - GAP + 32, d: CD + 30, r: 4 };
const RACK_Z = 10;

const W = 840;
const H = 306;
const ART = { x: 14, y: 38, w: W - 28, h: H - 76 };
const P = k.fitProjection(k.boxCorners(RACK, -6, RACK_Z + PAL + CH + 6), ART.w, ART.h, { pad: 4, azimuth: 82 });

// ---------------------------------------------------------------- helpers
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const slab = (plan, z, h, steps = 2, bevel = 0) => k.slabOf(plan, z, h, P, steps, bevel);
const poly = (points) => k.pathOf(points.map(at), true);
const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const halo = (plan, z, h, blur) => `<path class="iso-halo" filter="url(#${blur})" transform="translate(0 3)" d="${k.haloOf(plan, z, h, P)}"/>`;
const front = (y, x0, z0, w, h, r = 1) => k.roundedPlan({ x: x0, y: z0, w, d: h, r }, 2).map(([x, z]) => [x, y, z]);
const face = (x, y, z) => k.sideMatrix([x, y], z, P, "left");

// ---------------------------------------------------------------- rack
function rack() {
  const out = [halo(RACK, -6, 6, "b9")];
  for (const x of [RACK.x + 10, RACK.x + RACK.w / 2, RACK.x + RACK.w - 10]) {
    for (const y of [RACK.y + 8, RACK.y + RACK.d - 8]) out.push(S(slab({ x: x - 3, y: y - 3, w: 6, d: 6, r: 0.6 }, -6, 6, 1), { tone: "lo" }));
  }
  out.push(S(slab(RACK, 0, RACK_Z, 4, 1.2), { tone: "mid", inner: L(k.sideSeam(RACK, 4, P, 4), { tone: "faint" }) }));
  // roller lanes on the deck
  const lanes = [];
  for (let y = RACK.y + 10; y < RACK.y + RACK.d - 6; y += 12) lanes.push(k.lineOnTop([RACK.x + 4, y], [RACK.x + RACK.w - 4, y], RACK_Z, P));
  out.push(L(lanes.join(""), { tone: "faint" }));
  // safety stripe along the front edge of the deck
  const stripe = { x: RACK.x + 6, y: RACK.y + RACK.d - 7, w: RACK.w - 12, d: 4, r: 1 };
  out.push(`<path class="tc c-yellow" style="fill-opacity:.55" d="${k.planOutline(stripe, RACK_Z, P, 2)}"/>`);
  out.push(L(k.planOutline(stripe, RACK_Z, P, 2), { tone: "lo" }));
  out.push(D(k.corners(RACK, 5).map(([x, y]) => at([x, y, RACK_Z])), { size: 0.5 }));
  return out.join("");
}

function pallet(x) {
  const out = [];
  const y0 = -CD - 2;
  for (const bx of [x + 4, x + CW / 2 - 6, x + CW - 16]) out.push(S(slab({ x: bx, y: y0 + 2, w: 12, d: CD, r: 0.5 }, RACK_Z, PAL - 2.5, 1), { tone: "lo" }));
  const deck = { x: x - 2, y: y0, w: CW + 4, d: CD + 4, r: 0.6 };
  out.push(S(slab(deck, RACK_Z + PAL - 2.5, 2.5, 1, 0.3), { tone: "mid" }));
  return out.join("");
}

// ---------------------------------------------------------------- lid marks (on the top plane z)
function markOf(kind, x, z, color) {
  const out = [];
  const y0 = -CD + 6;
  const y1 = -8;
  if (kind === "erd") {
    const boxes = [[x + 14, y0 + 6, 34, 24], [x + 78, y0 + 2, 34, 18], [x + 92, y0 + 32, 36, 20]];
    out.push(`<path class="iso-line sc c-${color}" d="${k.lineOnTop([x + 48, y0 + 18], [x + 78, y0 + 11], z, P)}${k.lineOnTop([x + 48, y0 + 24], [x + 92, y0 + 42], z, P)}"/>`);
    for (const [bx, by, bw, bd] of boxes) {
      const plan = { x: bx, y: by, w: bw, d: bd, r: 1 };
      out.push(`<path class="paper" d="${k.planOutline(plan, z, P, 2)}"/>`, `<path class="tc c-${color}" d="${k.lineOnTop([bx, by], [bx + bw, by], z, P)}${k.onTop([[bx, by], [bx + bw, by], [bx + bw, by + 6], [bx, by + 6]], z, P, true)}"/>`);
      out.push(`<path class="iso-line sc c-${color}" d="${k.planOutline(plan, z, P, 2)}"/>`);
      for (let i = 1; i <= Math.floor((bd - 7) / 5); i++) out.push(L(k.lineOnTop([bx + 3, by + 6 + i * 5], [bx + bw - 6 - (i % 2) * 6, by + 6 + i * 5], z, P), { tone: "mid", free: true }));
    }
  } else if (kind === "heat") {
    const cols = 12;
    const rows = 6;
    const cw = (CW - 28) / cols;
    const cd = (y1 - y0) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const heat = Math.exp(-(((c - 3.5) / 2.6) ** 2 + ((r - 2) / 1.8) ** 2)) + 0.7 * Math.exp(-(((c - 8.5) / 1.8) ** 2 + ((r - 3.6) / 1.4) ** 2));
        const hue = heat > 0.65 ? "red" : heat > 0.3 ? "orange" : "yellow";
        const op = Math.min(0.95, 0.12 + heat * 0.8).toFixed(2);
        const cell = { x: x + 14 + c * cw + 0.4, y: y0 + r * cd + 0.4, w: cw - 0.8, d: cd - 0.8, r: 0 };
        out.push(`<path class="fc c-${hue}" style="fill-opacity:${op}" d="${k.planOutline(cell, z, P, 1)}"/>`);
      }
    }
    out.push(L(k.planOutline({ x: x + 14, y: y0, w: cols * cw, d: rows * cd, r: 0 }, z, P, 1), { tone: "mid" }));
    // the pointer
    const px = x + 14 + 9 * cw;
    const py = y0 + 3.6 * cd;
    out.push(`<path class="pointer" d="${k.onTop([[px, py], [px + 3, py + 9], [px + 4.6, py + 5.4], [px + 9, py + 6]], z, P, true)}"/>`);
  } else if (kind === "audit") {
    const cx = x + 44;
    const cy = (y0 + y1) / 2;
    out.push(`<path class="paper" d="${k.ring(cx, cy, 22, z, P, 40)}"/>`, `<path class="iso-line sc c-${color}" d="${k.ring(cx, cy, 22, z, P, 40)}"/>`);
    const t = k.radialTicks(cx, cy, 22, 12, 3, z, [2, 4], P);
    out.push(L(t.minor, { tone: "mid" }), L(t.major, { tone: "hi" }));
    out.push(L(k.lineOnTop([cx, cy], [cx, cy - 13], z, P) + k.lineOnTop([cx, cy], [cx + 9, cy + 4], z, P), { tone: "hi", free: true }));
    // rollback arrow running counterclockwise round the dial
    const arc = [];
    for (let a = 0.2; a <= 1.4; a += 0.1) arc.push([cx + Math.sin(-a * Math.PI) * 27, cy - Math.cos(-a * Math.PI) * 27]);
    out.push(`<path class="iso-line sc c-${color}" style="stroke-width:1.1px" d="${k.onTop(arc, z, P)}"/>`);
    const [ax, ay] = arc[arc.length - 1];
    out.push(`<path class="fc c-${color}" d="${k.onTop([[ax - 3, ay - 3], [ax + 4, ay - 1], [ax - 1, ay + 5]], z, P, true)}"/>`);
    // ledger lines of the trail
    for (let i = 0; i < 6; i++) {
      const ly = y0 + 6 + i * 8;
      out.push(`<path class="fc c-${color}" d="${k.ring(x + 86, ly, 1.6, z, P, 10)}"/>`);
      out.push(L(k.lineOnTop([x + 92, ly], [x + 92 + [40, 30, 36, 26, 38, 22][i], ly], z, P), { tone: "mid", free: true }));
    }
  } else {
    // CRUD stencil: four cut-out letters and a form with fields and a button
    const letters = ["C", "R", "U", "D"];
    letters.forEach((ch, i) => {
      const bx = x + 14 + i * 16;
      const plan = { x: bx, y: y0 + 2, w: 13, d: 16, r: 1.5 };
      out.push(`<path class="void" d="${k.planOutline(plan, z, P, 2)}"/>`, L(k.planOutline(plan, z, P, 2), { tone: "lo" }));
      out.push(`<text class="stencil xc c-${color}" transform="${k.topMatrix([bx + 6.5, y0 + 15], z, P, "x")}" text-anchor="middle">${ch}</text>`);
    });
    for (let i = 0; i < 3; i++) {
      const fy = y0 + 26 + i * 9;
      out.push(L(k.lineOnTop([x + 14, fy + 2], [x + 30, fy + 2], z, P), { tone: "mid", free: true }));
      out.push(`<path class="paper" d="${k.planOutline({ x: x + 34, y: fy, w: 60, d: 5, r: 1 }, z, P, 2)}"/>`, L(k.planOutline({ x: x + 34, y: fy, w: 60, d: 5, r: 1 }, z, P, 2), { tone: "mid" }));
    }
    out.push(`<path class="fc c-${color}" d="${k.planOutline({ x: x + 74, y: y0 + 54, w: 20, d: 6, r: 1.5 }, z, P, 2)}"/>`);
  }
  return out.join("");
}

function crate(p, x) {
  const out = [];
  const zb = RACK_Z + PAL;
  const plan = { x, y: -CD, w: CW, d: CD, r: 0.8 };
  const seams = [10, 20, 30, 40].map((dz) => k.sideSeam(plan, zb + dz, P, 1)).join("");
  out.push(S(slab(plan, zb, CH, 1, 0.5), { tone: "mid", inner: L(seams, { tone: "faint" }) }));
  // corner battens
  for (const bx of [x, x + CW - 6]) out.push(S(slab({ x: bx, y: -1.2, w: 6, d: 1.6, r: 0.3 }, zb, CH, 1), { tone: "mid" }));
  // lid in the package colour, with its mark
  const lid = { x: x - 1.5, y: -CD - 1.5, w: CW + 3, d: CD + 3, r: 1 };
  const lidPaths = slab(lid, zb + CH, 3.5, 1, 0.6);
  out.push(S(lidPaths, { tone: "mid", inner: `<path class="fc c-${p.color}" style="fill-opacity:.8" d="${lidPaths.shades.join("")}"/><path class="tc c-${p.color}" d="${lidPaths.top}"/>` }));
  out.push(markOf(p.mark, x, zb + CH + 3.5, p.color));
  out.push(D(k.corners(lid, 3).map(([px, py]) => at([px, py, zb + CH + 3.5])), { size: 0.5 }));
  // label plate with the name, what it does and the downloads counter
  const y = 0.5;
  const plate = front(y, x + 9, zb + 6, CW - 18, CH - 12, 1.2);
  out.push(S(slab({ x: x + 9, y: -0.2, w: CW - 18, d: 0.7, r: 0.4 }, zb + 6, CH - 12, 1), { tone: "lo", crease: "none" }));
  out.push(`<path class="paper" d="${poly(plate)}"/>`, `<path class="iso-line" data-tone="mid" d="${poly(plate)}"/>`);
  out.push(`<path class="fc c-${p.color}" d="${poly(front(y + 0.05, x + 9, zb + CH - 10, CW - 18, 4, 0.6))}"/>`);
  const [vendor, short] = p.name.split("/");
  out.push(`<g transform="${face(x + 14, y + 0.1, zb + CH - 10)}"><text class="pname" x="0" y="9.6"><tspan class="pvendor">${esc(vendor)}/</tspan>${esc(short)}</text><text class="pline" x="0" y="18">${esc(p.lines[0])}</text><text class="pline" x="0" y="24.5">${esc(p.lines[1])}</text></g>`);
  // counter
  const n = downloads(p.name);
  const digits = fmt(n);
  const cwid = Math.max(30, digits.length * 5.4 + 8);
  const win = front(y + 0.1, x + CW - 14 - cwid, zb + 9, cwid, 9, 0.8);
  out.push(`<path class="void" d="${poly(win)}"/>`, `<path class="iso-line" d="${poly(win)}"/>`);
  out.push(`<g transform="${face(x + CW - 14 - cwid / 2, y + 0.15, zb + 18)}"><text class="pcount xc c-${p.color}" x="0" y="7" text-anchor="middle">${esc(digits)}</text></g>`);
  out.push(`<g transform="${face(x + 14, y + 0.15, zb + 18)}"><text class="pline" x="0" y="6.6">downloads</text></g>`);
  out.push(`<path class="fc c-${p.color} lamp" d="${poly(front(y + 0.1, x + CW - 12, zb + 12.5, 2.4, 2.4, 1.2))}"/>`);
  return out.join("");
}

// ---------------------------------------------------------------- page
const body = [rack()];
PACKAGES.forEach((p, i) => {
  const x = X0 + i * (CW + GAP);
  body.push(pallet(x), crate(p, x));
});

const CSS = `
${BASE_CSS}
.paper{fill:var(--anatomy-face);stroke:none}
.pointer{fill:var(--strong);stroke:var(--card);stroke-width:.6px}
.pname{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;font-size:8.6px;font-weight:700;fill:var(--strong)}
.pvendor{font-weight:400;fill:var(--text)}
.pline{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:4.7px;fill:var(--text)}
.pcount{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:7.4px;font-weight:700}
.stencil{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:12px;font-weight:800}
@keyframes lamp{0%,100%{opacity:1}50%{opacity:.3}}
@media (prefers-reduced-motion:no-preference){.lamp{animation:lamp 3.2s ease-in-out infinite}}`;

const label = `Four shipping crates on a loading rack, one per Symfony package on Packagist. ${PACKAGES.map((p) => `${p.name}: ${p.lines.join(", ")}; ${fmt(downloads(p.name))} downloads`).join(". ")}.`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
<title>Packages on Packagist</title>
<style>${CSS}</style>
<defs><filter id="b9" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="8"/></filter></defs>
<rect class="card" x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="6"/>
<text class="mono" x="24" y="30">Fig 4</text>
<text class="mono caps" x="${W - 22}" y="30" text-anchor="end">Packages on Packagist</text>
<text class="mono caps" x="24" y="${H - 16}">${PACKAGES.length} Symfony bundles</text>
<text class="mono ro" x="${W - 22}" y="${H - 16}" text-anchor="end">${fmt(TOTAL)} downloads in total</text>
<g transform="translate(${ART.x} ${ART.y})">${body.join("")}</g>
</svg>
`;

const out = compact(svg);
mkdirSync(dirname(output) || ".", { recursive: true });
writeFileSync(output, out);
console.log(`wrote ${output} (${(Buffer.byteLength(out) / 1024).toFixed(1)} KB)`);
