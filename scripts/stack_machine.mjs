#!/usr/bin/env node
// Draws the tech stack as a cartridge rack: a small isometric cabinet with four shelves,
// each holding one cartridge per technology, grouped and labelled by category on the shelf
// rail. The Symfony cartridge is the lit one, the stack used every day.
//
// Usage: node scripts/stack_machine.mjs [out.svg]   (default profile-contrib/stack.svg)
// Node 20+, built-ins only. The isometric kit is vendored in scripts/anatomy/.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as k from "./anatomy/iso-kit.mjs";
import { logoMark } from "./logos.mjs";
import { BASE_CSS, compact } from "./theme.mjs";

const output = process.argv[2] || "profile-contrib/stack.svg";

// ---------------------------------------------------------------- the stack, shelf by shelf (top first)
// logo: a key of scripts/logos.mjs, or "initials:XY" when Simple Icons has no mark for it.
const SHELVES = [
  [
    {
      label: "Backend",
      color: "purple",
      items: [
        ["PHP", "php"], ["Symfony", "symfony"], ["Laravel", "laravel"], ["Node.js", "nodedotjs"],
        ["Python", "python"], ["API Platform", "initials:AP"], ["PHPUnit", "initials:PU"], ["Codeception", "initials:CC"],
      ],
    },
  ],
  [
    {
      label: "Frontend",
      color: "blue",
      items: [
        ["React", "react"], ["Next.js", "nextdotjs"], ["Vue.js", "vuedotjs"], ["Nuxt.js", "nuxtdotjs"], ["JavaScript", "javascript"],
        ["Tailwind CSS", "tailwindcss"], ["Ionic", "ionic"], ["Capacitor", "capacitor"], ["Flutter", "flutter"], ["Cypress", "cypress"],
      ],
    },
  ],
  [
    {
      label: "DevOps & Tools",
      color: "orange",
      items: [
        ["Docker", "docker"], ["Traefik", "traefikproxy"], ["Jenkins", "jenkins"], ["Postfix", "initials:PF"],
        ["GitHub Actions", "githubactions"], ["Linux", "linux"], ["Nginx", "nginx"], ["Apache", "apache"],
      ],
    },
  ],
  [
    { label: "Database", color: "green", items: [["MySQL", "mysql"], ["Redis", "redis"], ["MariaDB", "mariadb"]] },
    { label: "IDE & Development", color: "pink", items: [["PhpStorm", "phpstorm"], ["VS Code", "initials:VS"], ["Git", "git"], ["GitHub", "github"]] },
  ],
];
const LIT = "Symfony";
const ALL = SHELVES.flat().flatMap((g) => g.items.map(([name]) => name));
const GROUPS = SHELVES.flat().length;

// ---------------------------------------------------------------- world
const CW = 64; // cartridge width (x)
const CH = 40; // height
const CD = 24; // depth (y)
const GAP = 3;
const PITCH = CW + GAP;
const SPLIT = 14; // extra room for the divider between two groups on one shelf
const SLOTS = 10;
const MARGIN = 7;
const IW = MARGIN * 2 + SLOTS * PITCH - GAP; // inner width
const DEPTH = 46; // cabinet depth, front at y = 0
const FRONT = -3; // cartridge fronts sit behind the rail
const SIDE = 10;
const BOARD = 4;
const RAIL_H = 13;
const ROW = CH + 2 + RAIL_H; // shelf pitch
const BASE0 = 15; // top of the bottom shelf
const baseOf = (row) => BASE0 + (SHELVES.length - 1 - row) * ROW; // row 0 is the top shelf
const TOP = baseOf(0) + CH + 2 + BOARD; // underside of the top + its thickness
const CAB = { x: -SIDE, y: -DEPTH, w: IW + SIDE * 2, d: DEPTH, r: 1.5 };

const W = 840;
const H = 400;
const ART = { x: 12, y: 40, w: W - 24, h: H - 80 };
const P = k.fitProjection([...k.boxCorners(CAB, -9, TOP + 14)], ART.w, ART.h, { pad: 6, azimuth: 84 });

// ---------------------------------------------------------------- helpers
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const slab = (plan, z, h, steps = 2, bevel = 0) => k.slabOf(plan, z, h, P, steps, bevel);
const poly = (points) => k.pathOf(points.map(at), true);
const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const halo = (plan, z, h, blur) => `<path class="iso-halo" filter="url(#${blur})" transform="translate(0 3)" d="${k.haloOf(plan, z, h, P)}"/>`;
// a rounded rectangle on the plane y = const, as world points
const frontRect = (y, x0, z0, w, h, r = 1) => k.roundedPlan({ x: x0, y: z0, w, d: h, r }, 2).map(([x, z]) => [x, y, z]);

// ---------------------------------------------------------------- parts
function cabinetBack() {
  const out = [halo(CAB, -9, 4, "b9")];
  for (const x of [CAB.x + 22, CAB.x + CAB.w - 22]) {
    out.push(S(slab({ x: x - 9, y: -DEPTH + 6, w: 18, d: DEPTH - 10, r: 2 }, -9, 1.5, 2, 0.3), { tone: "lo" }));
    out.push(S(slab({ x: x - 6, y: -DEPTH + 9, w: 12, d: DEPTH - 16, r: 1.5 }, -7.5, 3.5, 2), { tone: "mid" }));
  }
  // plinth with a seam and a recessed kick strip
  const plinth = { x: CAB.x + 3, y: CAB.y + 3, w: CAB.w - 6, d: CAB.d - 4, r: 1 };
  out.push(S(slab(plinth, -4, 4, 2, 0.3), { tone: "lo" }));
  // back panel and the left side (its inner face shows)
  out.push(S(slab({ x: 0, y: -DEPTH, w: IW, d: 3, r: 0 }, 0, TOP, 1), { tone: "lo" }));
  out.push(S(slab({ x: -SIDE, y: -DEPTH, w: SIDE, d: DEPTH, r: 1.5 }, 0, TOP, 2, 0.5), { tone: "mid" }));
  return out.join("");
}

function shelfBoard(row) {
  const base = baseOf(row);
  const out = [];
  const board = { x: 0, y: -DEPTH + 3, w: IW, d: DEPTH - 3, r: 0 };
  out.push(S(slab(board, base - BOARD, BOARD, 1), { tone: "lo" }));
  return out.join("");
}

// slot grooves on a shelf where no cartridge stands, from x0 to the right side
function emptySlots(row, x0) {
  const base = baseOf(row);
  const lines = [];
  for (let x = x0; x + CW - 4 < IW - 4; x += PITCH) {
    lines.push(k.lineOnTop([x + 4, FRONT], [x + 4, -DEPTH + 3], base, P), k.lineOnTop([x + CW - 4, FRONT], [x + CW - 4, -DEPTH + 3], base, P));
  }
  return L(lines.join(""), { tone: "faint" });
}

function cartridge(x, row, name, logo, color) {
  const base = baseOf(row);
  const lit = name === LIT;
  const plan = { x, y: FRONT - CD, w: CW, d: CD, r: 1.6 };
  const out = [];
  out.push(S(slab(plan, base, CH, 2), { tone: lit ? "hi" : "mid", crease: lit ? "lo" : "faint", lit }));
  // label plate on the front face, with the logo and the name printed on it
  const plate = frontRect(FRONT, x + 4, base + 5, CW - 8, CH - 9, 1.2);
  out.push(`<path class="plate${lit ? " lit" : ""}" d="${poly(plate)}"/>`);
  out.push(`<path class="iso-line" data-tone="${lit ? "mid" : "lo"}" d="${poly(plate)}"/>`);
  // colour band of the category along the top of the plate
  out.push(`<path class="fc c-${color}" d="${poly(frontRect(FRONT, x + 4.6, base + CH - 6.4, CW - 9.2, 2.2, 0.6))}"/>`);
  const m = k.sideMatrix([x + CW / 2, FRONT], base + CH, P, "left");
  out.push(`<g transform="${m}">${logoMark(logo, -7.5, 8, 15, "logo")}<text class="nm" x="0" y="${CH - 9.6}" text-anchor="middle">${esc(name)}</text></g>`);
  return out.join("");
}

function divider(x, row) {
  const base = baseOf(row);
  const plan = { x: x - 1.5, y: -DEPTH + 4, w: 3, d: DEPTH - 4 + FRONT, r: 0.6 };
  return S(slab(plan, base, CH - 6, 1, 0.3), { tone: "mid" }) + D([at([x, FRONT - 3, base + CH - 6])], { size: 0.4 });
}

function bookend(x, row) {
  const base = baseOf(row);
  const out = [];
  out.push(S(slab({ x, y: FRONT - CD + 2, w: 14, d: CD - 4, r: 0.8 }, base, 1.6, 1), { tone: "lo" }));
  out.push(S(slab({ x, y: FRONT - CD + 2, w: 3, d: CD - 4, r: 0.6 }, base + 1.6, 24, 1, 0.3), { tone: "mid" }));
  out.push(L(k.knurl(x + 9, FRONT - CD / 2, 2.6, base + 1.6, base + 5, 10, P), { tone: "lo" }));
  out.push(S(k.cylinder(x + 9, FRONT - CD / 2, 2.6, base + 1.6, 3.4, P, 12), { tone: "mid" }));
  return out.join("");
}

// the rail in front of a shelf: a strip with a label for each group and a status lamp
function rail(row, groups) {
  const base = baseOf(row);
  const out = [];
  const plan = { x: 0, y: 0, w: IW, d: 2.6, r: 0 };
  // drawn as a solid strip from base - RAIL_H to base + 1
  out.push(S(slab({ x: 0, y: -0.4, w: IW, d: 3, r: 0 }, base - RAIL_H, RAIL_H + 1, 1, 0.3), { tone: "mid", inner: L(k.sideSeam(plan, base - 1, P, 1), { tone: "faint" }) }));
  for (const g of groups) {
    const text = `${g.label.toUpperCase()} · ${g.items.length}`;
    const holder = frontRect(2.6, g.x0 + 2, base - RAIL_H + 2.2, text.length * 4.5 + 14, RAIL_H - 4.4, 1);
    out.push(`<path class="tc c-${g.color}" d="${poly(holder)}"/>`, `<path class="iso-line" d="${poly(holder)}"/>`);
    out.push(`<path class="fc c-${g.color}" d="${poly(frontRect(2.6, g.x0 + 4.5, base - RAIL_H + 4.4, 2.2, RAIL_H - 8.8, 0.5))}"/>`);
    const m = k.sideMatrix([g.x0 + 10, 2.6], base - 8.3, P, "left");
    out.push(`<text class="cat" transform="${m}" x="0" y="0">${esc(text)}</text>`);
    const lamp = at([g.x0 + g.width - 6, 2.6, base - RAIL_H / 2 + 0.5]);
    out.push(`<circle class="lamp c-${g.color}" cx="${lamp[0].toFixed(1)}" cy="${lamp[1].toFixed(1)}" r="1.5" style="animation-delay:${(g.index * 0.9).toFixed(1)}s"/>`);
    out.push(`<circle class="lamp-ring" cx="${lamp[0].toFixed(1)}" cy="${lamp[1].toFixed(1)}" r="2.4"/>`);
  }
  out.push(D([at([3, 2.6, base - RAIL_H / 2]), at([IW - 3, 2.6, base - RAIL_H / 2])], { size: 0.45 }));
  return out.join("");
}

function cabinetTop() {
  const out = [];
  const top = { x: -SIDE, y: -DEPTH, w: IW + SIDE * 2, d: DEPTH + 2.6, r: 1.5 };
  out.push(S(slab(top, TOP - BOARD, BOARD + 2, 2, 0.8), { tone: "mid", inner: L(k.sideSeam(top, TOP - 1.5, P, 2), { tone: "faint" }) }));
  const zt = TOP + 2;
  out.push(D(k.corners(top, 5).map(([x, y]) => at([x, y, zt])), { size: 0.5 }));
  out.push(L(k.corners(top, 5).map(([x, y]) => k.ring(x, y, 2, zt, P, 12)).join(""), { tone: "lo" }));
  // name plate with rule lines standing for engraved text
  const plate = { x: 24, y: -30, w: 70, d: 18, r: 1.2 };
  out.push(S(slab(plate, zt, 1, 2), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(plate, 2), zt + 1, P, 2), { tone: "faint" }));
  [[30, 80], [30, 66], [30, 72]].forEach(([a, b], i) => out.push(L(k.lineOnTop([a, -25 + i * 4], [b, -25 + i * 4], zt + 1, P), { tone: "lo", free: true })));
  // carry handle: two posts and a bar
  const hx = [IW / 2 - 60, IW / 2 + 60];
  for (const x of hx) {
    out.push(S(k.cylinder(x, -22, 4.5, zt, 1.5, P, 14), { tone: "lo" }));
    out.push(S(slab({ x: x - 2.5, y: -24.5, w: 5, d: 5, r: 1 }, zt + 1.5, 9, 1), { tone: "mid" }));
  }
  out.push(S(slab({ x: hx[0] - 2.5, y: -25, w: hx[1] - hx[0] + 5, d: 6, r: 2.5 }, zt + 10.5, 3.5, 3, 0.5), { tone: "mid" }));
  // a cooling grille at the right end
  const vents = [];
  for (let i = 0; i < 6; i++) vents.push(k.planOutline({ x: IW - 92 + i * 12, y: -34, w: 6, d: 24, r: 2.5 }, zt, P, 2));
  out.push(`<path class="void" d="${vents.join("")}"/>`, L(vents.join(""), { tone: "lo" }));
  return out.join("");
}

function rightSide() {
  const out = [];
  const side = { x: IW, y: -DEPTH, w: SIDE, d: DEPTH, r: 1.5 };
  out.push(S(slab(side, 0, TOP - BOARD, 2, 0.5), { tone: "mid", inner: L(k.sideSeam(side, 6, P, 2), { tone: "faint" }) }));
  // side handle
  out.push(S(slab({ x: IW + SIDE, y: -30, w: 3, d: 16, r: 1 }, TOP * 0.55, 6, 1, 0.3), { tone: "mid" }));
  return out.join("");
}

// ---------------------------------------------------------------- assemble
const body = [cabinetBack()];
let groupIndex = 0;
// paint the bottom shelf first so each higher board covers the tops below it
for (let row = SHELVES.length - 1; row >= 0; row--) {
  const groups = [];
  let x = MARGIN;
  const parts = [shelfBoard(row)];
  SHELVES[row].forEach((g, gi) => {
    if (gi > 0) {
      parts.push(divider(x - GAP + SPLIT / 2, row));
      x += SPLIT - GAP + GAP;
    }
    const x0 = x;
    for (const [name, logo] of g.items) {
      parts.push(cartridge(x, row, name, logo, g.color));
      x += PITCH;
    }
    groups.push({ ...g, x0: x0 - 3, width: x - GAP - x0 + 6, index: groupIndex++ });
  });
  if (x < IW - CW) {
    parts.push(bookend(x, row));
    parts.push(emptySlots(row, x + 20));
  }
  parts.push(rail(row, groups));
  body.push(...parts);
}
body.push(cabinetTop(), rightSide());

// ---------------------------------------------------------------- page
const CSS = `
${BASE_CSS}
.plate{fill:var(--anatomy-shade-3);stroke:none}.plate.lit{fill:var(--anatomy-face)}
.nm{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;font-size:7.6px;font-weight:600;fill:var(--strong)}
.cat{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:6.4px;font-weight:600;letter-spacing:.08em;fill:var(--strong)}
.lamp{fill:var(--c)}.lamp-ring{fill:none;stroke:var(--anatomy-lo);stroke-width:.6px}
@keyframes lamp{0%,100%{opacity:1}50%{opacity:.25}}
@media (prefers-reduced-motion:no-preference){.lamp{animation:lamp 3.6s ease-in-out infinite}}`;

const label = `Tech stack drawn as a cartridge rack with one cartridge per technology. ${SHELVES.flat()
  .map((g) => `${g.label}: ${g.items.map(([n]) => n).join(", ")}`)
  .join(". ")}.`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
<title>Tech stack and skills</title>
<style>${CSS}</style>
<defs><filter id="b9" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="8"/></filter></defs>
<rect class="card" x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="6"/>
<text class="mono" x="24" y="30">Fig 2</text>
<text class="mono caps" x="${W - 22}" y="30" text-anchor="end">Tech stack &amp; skills</text>
<text class="mono caps" x="24" y="${H - 16}">${ALL.length} tools in ${GROUPS} groups</text>
<text class="mono ro" x="${W - 22}" y="${H - 16}" text-anchor="end">lit cartridge · ${LIT}, used every day</text>
<g transform="translate(${ART.x} ${ART.y})">${body.join("")}</g>
</svg>
`;

const out = compact(svg);
mkdirSync(dirname(output) || ".", { recursive: true });
writeFileSync(output, out);
console.log(`wrote ${output} (${(Buffer.byteLength(out) / 1024).toFixed(1)} KB)`);
