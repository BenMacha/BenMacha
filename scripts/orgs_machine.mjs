#!/usr/bin/env node
// Draws the organizations and the personal site as three small isometric buildings on one
// street block: a restaurant counter with an order ticket printer (Pepprio), an estate agency
// with listing cards in its window and a signing stamp (Pignelle), and a workshop desk with a
// monitor (benmacha.tn, github.com/BenMacha). Each one has a name plate with its domain.
//
// Usage: node scripts/orgs_machine.mjs [out.svg]   (default profile-contrib/orgs.svg)
// Node 20+, built-ins only. The isometric kit is vendored in scripts/anatomy/.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as k from "./anatomy/iso-kit.mjs";
import { logoMark } from "./logos.mjs";
import { BASE_CSS, compact } from "./theme.mjs";

const output = process.argv[2] || "profile-contrib/orgs.svg";

const PLACES = [
  { name: "Pepprio", line: "pepprio.com · restaurant orders", x: 0, color: "orange" },
  { name: "Pignelle", line: "pignelle.com · real estate agency tools", x: 196, color: "red" },
  { name: "Ben Macha Ali", line: "benmacha.tn · github.com/BenMacha", x: 392, color: "blue" },
];

const W = 840;
const H = 330;
const ART = { x: 16, y: 40, w: W - 32, h: H - 84 };
const BLOCK = { x: -18, y: -98, w: 590, d: 132, r: 6 };
const P = k.fitProjection([...k.boxCorners(BLOCK, -14, 0), [200, -52, 92], [470, -52, 92]], ART.w, ART.h, { pad: 4, azimuth: 84 });

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
const side = (x, y0, z0, d, h) => [[x, y0, z0], [x, y0 + d, z0], [x, y0 + d, z0 + h], [x, y0, z0 + h]];
const face = (x, y, z) => k.sideMatrix([x, y], z, P, "left"); // local x along +x, local y down, on the plane y
// a box painted in an accent colour over the kit's shading, so its faces keep their tones
function painted(plan, z, h, color, opts = {}) {
  const paths = slab(plan, z, h, opts.steps ?? 1, opts.bevel ?? 0);
  return S(paths, { tone: opts.tone ?? "mid", inner: `<path class="${opts.tint ? "tc" : "fc"} c-${color}" style="fill-opacity:${opts.tint ? "" : ".82"}" d="${paths.top}${paths.shades.join("")}"/>` });
}

// ---------------------------------------------------------------- the block
function block() {
  const out = [halo(BLOCK, -14, 6, "b9")];
  for (const [x, y] of [[BLOCK.x + 26, BLOCK.y + BLOCK.d - 20], [BLOCK.x + BLOCK.w - 26, BLOCK.y + BLOCK.d - 20]]) {
    out.push(S(slab({ x: x - 9, y: y - 9, w: 18, d: 18, r: 2 }, -14, 6, 2), { tone: "lo" }));
  }
  out.push(S(slab(BLOCK, -8, 8, 6, 1.4), { tone: "mid", inner: L(k.sideSeam(BLOCK, -4, P, 6), { tone: "faint" }) }));
  // pavement strip with joints, and a kerb line
  const walk = { x: BLOCK.x + 5, y: 6, w: BLOCK.w - 10, d: 22, r: 2 };
  out.push(S(slab(walk, 0, 1.2, 2), { tone: "lo", crease: "none" }));
  const joints = [];
  for (let x = walk.x + 24; x < walk.x + walk.w - 4; x += 24) joints.push(k.lineOnTop([x, walk.y], [x, walk.y + walk.d], 1.2, P));
  out.push(L(joints.join(""), { tone: "faint" }));
  out.push(D(k.corners(BLOCK, 9).map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  return out.join("");
}

// a sign board on two short posts in front of each building
function sign(place, x0, w = 150) {
  const out = [];
  const y = 14;
  for (const x of [x0 + 12, x0 + w - 12]) {
    out.push(S(k.cylinder(x, y + 1.5, 2.6, 1.2, 1.4, P, 12), { tone: "lo" }));
    out.push(S(slab({ x: x - 1.4, y: y, w: 2.8, d: 2.8, r: 0.6 }, 2.6, 8, 1), { tone: "mid" }));
  }
  const board = { x: x0, y: y - 0.5, w, d: 3.6, r: 0.8 };
  out.push(S(slab(board, 10.6, 28, 2, 0.5), { tone: "hi", crease: "lo" }));
  out.push(`<path class="fc c-${place.color}" d="${poly(front(y + 3.1, x0 + 4, 14, 3, 21, 0.6))}"/>`);
  out.push(`<g transform="${face(x0 + 11, y + 3.1, 38.6)}"><text class="sname" x="0" y="13.5">${esc(place.name)}</text><text class="sline" x="0" y="22.5">${esc(place.line)}</text></g>`);
  out.push(D([at([x0 + w - 3, y + 3.1, 36]), at([x0 + w - 3, y + 3.1, 13])], { size: 0.45 }));
  return out.join("");
}

// ---------------------------------------------------------------- Pepprio: restaurant counter
function chili(x, y, z, s, cls = "") {
  // the Pepprio pepper, redrawn: a red pod and a green stem, in the plane y
  const pod = "M6 4C9 3 12 5 12 9c0 6-4 11-10 13-1 .3-1.6-.6-1-1.4C4 17 5 12 4 8c-.5-2 .4-3.4 2-4z";
  const stem = "M8 4.4c0-2 1.2-3.4 3-4l.8 1.2C10.6 2 9.8 3 9.8 4.6z";
  return `<g transform="${face(x, y, z)} scale(${s})" class="${cls}"><path class="fc c-red" d="${pod}"/><path class="fc c-green" d="${stem}"/><path class="mark-dot" d="M8.2 10.2h1.4v1.4H8.2zM6.6 12.4h1.4v1.4H6.6z"/></g>`;
}

function pepprio(x0) {
  const out = [];
  const base = { x: x0, y: -84, w: 150, d: 86, r: 2 };
  out.push(S(slab(base, 0, 3, 2, 0.5), { tone: "lo" }));
  // kitchen wall with a menu board and a pass-through
  const wall = { x: x0 + 4, y: -80, w: 142, d: 26, r: 1 };
  out.push(S(slab(wall, 3, 70, 2, 0.6), { tone: "mid", inner: L(k.sideSeam(wall, 12, P, 2), { tone: "faint" }) }));
  const wy = wall.y + wall.d;
  const menu = front(wy, x0 + 16, 44, 58, 22, 1.2);
  out.push(`<path class="void" d="${poly(menu)}"/>`, `<path class="iso-line" d="${poly(menu)}"/>`);
  const rules = [];
  for (let i = 0; i < 4; i++) rules.push(k.segment([x0 + 34, wy, 61 - i * 4.4], [x0 + 34 + [32, 24, 28, 20][i], wy, 61 - i * 4.4], P));
  out.push(L(rules.join(""), { tone: "mid", free: true }));
  out.push(chili(x0 + 19, wy, 63, 0.75));
  const hatch = front(wy, x0 + 88, 38, 46, 26, 1.2);
  out.push(`<path class="void" d="${poly(hatch)}"/>`, `<path class="iso-line" d="${poly(hatch)}"/>`);
  // order tickets clipped on a rail above the pass-through
  out.push(L(k.segment([x0 + 88, wy, 67], [x0 + 134, wy, 67], P), { tone: "mid" }));
  for (const [i, x] of [x0 + 92, x0 + 104, x0 + 116].entries()) {
    out.push(`<path class="paper" d="${poly(front(wy + 0.3, x, 56, 9, 11, 0.3))}"/>`, `<path class="iso-line" d="${poly(front(wy + 0.3, x, 56, 9, 11, 0.3))}"/>`);
    out.push(L(k.segment([x + 2, wy + 0.3, 63 - (i % 2)], [x + 7, wy + 0.3, 63 - (i % 2)], P) + k.segment([x + 2, wy + 0.3, 60], [x + 6, wy + 0.3, 60], P), { tone: "lo", free: true }));
  }
  // striped awning over the counter
  for (let i = 0; i < 10; i++) {
    const stripe = { x: x0 + 2 + i * 14.6, y: wy, w: 14.6, d: 26, r: 0 };
    out.push(painted(stripe, 73, 3, i % 2 ? "orange" : "red", { tone: "mid", tint: i % 2 === 1 }));
  }
  out.push(L(k.segment([x0 + 2, wy + 26, 73], [x0 + 148, wy + 26, 73], P), { tone: "mid" }));
  // counter with a painted front
  const counter = { x: x0 + 8, y: -34, w: 134, d: 18, r: 1.2 };
  out.push(painted(counter, 3, 30, "orange", { tone: "mid", tint: true, bevel: 0.5 }));
  const top = { x: x0 + 6, y: -36, w: 138, d: 22, r: 1.5 };
  out.push(S(slab(top, 33, 3, 2, 0.6), { tone: "mid" }));
  // ticket printer with a ticket coming out
  const pr = { x: x0 + 96, y: -30, w: 26, d: 14, r: 1.5 };
  out.push(S(slab(pr, 36, 11, 2, 0.5), { tone: "hi", crease: "lo" }));
  out.push(`<path class="void" d="${k.planOutline({ x: pr.x + 5, y: pr.y + 9, w: 16, d: 2, r: 0.8 }, 47, P, 2)}"/>`);
  out.push(`<path class="fc c-green lamp" d="${k.ring(pr.x + 22, pr.y + 4, 1.2, 47, P, 10)}"/>`);
  const ticket = { x: pr.x + 6, y: pr.y + 10, w: 14, d: 0.6, r: 0 };
  out.push(S(slab(ticket, 47, 14, 1), { tone: "lo", className: "ticket" }));
  out.push(L([0, 1, 2].map((i) => k.segment([ticket.x + 2, ticket.y + 0.6, 58 - i * 3], [ticket.x + 2 + [9, 6, 8][i], ticket.y + 0.6, 58 - i * 3], P)).join(""), { tone: "lo", free: true }));
  // a bowl and the counter lamp
  out.push(S(k.cylinder(x0 + 40, -26, 7, 36, 4, P, 20, 0.4), { tone: "hi", crease: "lo" }));
  out.push(`<path class="tc c-red" d="${k.ring(x0 + 40, -26, 5.6, 40, P, 20)}"/>`);
  // two stools
  for (const x of [x0 + 36, x0 + 84]) {
    out.push(S(k.cylinder(x, -6, 4, 3, 1.2, P, 14), { tone: "lo" }));
    out.push(S(k.cylinder(x, -6, 1.4, 4.2, 15, P, 10), { tone: "mid", crease: "none" }));
    out.push(S(k.cylinder(x, -6, 6, 19, 2.6, P, 18, 0.4), { tone: "mid", inner: `<path class="fc c-red" style="fill-opacity:.8" d="${k.ring(x, -6, 5.2, 21.6, P, 18)}"/>` }));
  }
  return out.join("");
}

// ---------------------------------------------------------------- Pignelle: estate agency
function houseMark(x, y, z, s) {
  // the Pignelle mark, redrawn: a red house with a white p
  const house = "M12 1 23 9v14H1V9z";
  const p = "M9 7.5h4.4a4 4 0 0 1 0 8H11.6V19H9zM11.6 10v3h1.8a1.5 1.5 0 0 0 0-3z";
  return `<g transform="${face(x, y, z)} scale(${s})"><path class="fc c-red" d="${house}"/><path class="mark-dot" fill-rule="evenodd" d="${p}"/></g>`;
}

function pignelle(x0) {
  const out = [];
  const base = { x: x0, y: -84, w: 150, d: 86, r: 2 };
  out.push(S(slab(base, 0, 3, 2, 0.5), { tone: "lo" }));
  const body = { x: x0 + 8, y: -78, w: 134, d: 52, r: 0.8 };
  out.push(S(slab(body, 3, 54, 1, 0.6), { tone: "mid", inner: L(k.sideSeam(body, 10, P, 1), { tone: "faint" }) }));
  const fy = body.y + body.d;
  // shop window with listing cards
  const win = front(fy, x0 + 16, 12, 78, 34, 1);
  out.push(`<path class="void" d="${poly(win)}"/>`, `<path class="iso-line" data-tone="mid" d="${poly(win)}"/>`);
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const cx = x0 + 20 + c * 18.6;
      const cz = 30 - r * 16;
      const card = front(fy + 0.2, cx, cz, 14, 13, 0.6);
      out.push(`<path class="paper" d="${poly(card)}"/>`, `<path class="iso-line" d="${poly(card)}"/>`);
      out.push(`<path class="tc c-${(r + c) % 2 ? "red" : "blue"}" style="fill-opacity:.55" d="${poly(front(fy + 0.25, cx + 1.6, cz + 6, 10.8, 5.6, 0.3))}"/>`);
      out.push(L(k.segment([cx + 2, fy + 0.25, cz + 3.6], [cx + 9, fy + 0.25, cz + 3.6], P) + k.segment([cx + 2, fy + 0.25, cz + 1.8], [cx + 7, fy + 0.25, cz + 1.8], P), { tone: "lo", free: true }));
    }
  }
  // the window's mullion
  out.push(L(k.segment([x0 + 55, fy, 12], [x0 + 55, fy, 46], P), { tone: "mid" }));
  // door with a handle and a step
  const door = front(fy, x0 + 104, 3, 28, 42, 1);
  out.push(`<path class="tc c-red" d="${poly(door)}"/>`, `<path class="iso-line" data-tone="mid" d="${poly(door)}"/>`);
  out.push(`<path class="void" d="${poly(front(fy + 0.1, x0 + 108, 26, 20, 14, 0.8))}"/>`);
  out.push(D([at([x0 + 128, fy, 22])], { size: 0.9, tone: "hi" }));
  out.push(S(slab({ x: x0 + 100, y: fy, w: 36, d: 6, r: 0.6 }, 3, 2, 1), { tone: "lo" }));
  // gable roof along x, tinted red, with the mark on the visible gable
  const ry = body.y + body.d / 2;
  const eave = 57;
  const ridge = 86;
  const ov = 5;
  const slope = [[x0 + 4, fy + ov, eave], [x0 + 146, fy + ov, eave], [x0 + 146, ry, ridge], [x0 + 4, ry, ridge]];
  const gable = [[x0 + 142, fy, eave], [x0 + 142, body.y, eave], [x0 + 142, ry, ridge - 3]];
  out.push(`<path class="iso-shade" data-shade="1" d="${poly(gable)}"/>`, `<path class="iso-line" d="${poly(gable)}"/>`);
  out.push(`<path class="iso-fill" d="${poly(slope)}"/>`, `<path class="fc c-red" style="fill-opacity:.85" d="${poly(slope)}"/>`);
  const tiles = [];
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    tiles.push(k.segment([x0 + 4, fy + ov + (ry - fy - ov) * t, eave + (ridge - eave) * t], [x0 + 146, fy + ov + (ry - fy - ov) * t, eave + (ridge - eave) * t], P));
  }
  out.push(L(tiles.join(""), { tone: "faint" }));
  out.push(`<path class="iso-line" data-tone="mid" d="${poly(slope)}"/>`);
  // chimney
  out.push(S(slab({ x: x0 + 112, y: ry + 6, w: 10, d: 8, r: 0.5 }, 70, 22, 1, 0.3), { tone: "mid" }));
  // sign over the window
  const board = front(fy + 0.1, x0 + 16, 48.5, 78, 6.5, 0.6);
  out.push(`<path class="paper" d="${poly(board)}"/>`, `<path class="iso-line" d="${poly(board)}"/>`);
  out.push(houseMark(x0 + 18, fy + 0.2, 54.6, 0.24));
  out.push(L(k.segment([x0 + 26, fy + 0.2, 51.8], [x0 + 70, fy + 0.2, 51.8], P), { tone: "mid", free: true }));
  // a small table with a contract and the signing stamp
  const table = { x: x0 + 24, y: -18, w: 46, d: 18, r: 1 };
  for (const [x, y] of k.corners(table, 2.5)) out.push(S(slab({ x: x - 1, y: y - 1, w: 2, d: 2, r: 0 }, 3, 16, 1), { tone: "mid" }));
  out.push(S(slab(table, 19, 2.4, 2, 0.4), { tone: "mid" }));
  const sheet = { x: table.x + 5, y: table.y + 3, w: 18, d: 12, r: 0.4 };
  out.push(S(slab(sheet, 21.4, 0.4, 1), { tone: "lo", crease: "none", className: "ticket" }));
  out.push(L([0, 1, 2].map((i) => k.lineOnTop([sheet.x + 2, sheet.y + 2.5 + i * 2.5], [sheet.x + 2 + [13, 10, 12][i], sheet.y + 2.5 + i * 2.5], 21.8, P)).join(""), { tone: "lo", free: true }));
  out.push(`<path class="fc c-red" d="${k.ring(sheet.x + 13, sheet.y + 9.4, 2.2, 21.85, P, 14)}"/>`);
  const st = [table.x + 34, table.y + 9];
  out.push(S(slab({ x: st[0] - 5, y: st[1] - 4, w: 10, d: 8, r: 1 }, 21.4, 3, 2, 0.3), { tone: "mid", inner: `<path class="fc c-red" d="${k.planOutline({ x: st[0] - 5, y: st[1] - 4, w: 10, d: 8, r: 1 }, 21.4, P, 2)}" style="fill-opacity:0"/>` }));
  out.push(S(k.cylinder(st[0], st[1], 1.6, 24.4, 5, P, 10), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(st[0], st[1], 3.6, 29.4, 4.4, P, 16, 0.4), { tone: "hi", crease: "lo", inner: `<path class="fc c-red" d="${k.ring(st[0], st[1], 2.6, 33.8, P, 14)}"/>` }));
  return out.join("");
}

// ---------------------------------------------------------------- Ben Macha Ali: workshop desk
function desk(x0) {
  const out = [];
  const base = { x: x0, y: -84, w: 150, d: 86, r: 2 };
  out.push(S(slab(base, 0, 3, 2, 0.5), { tone: "lo" }));
  // back panel of the workshop with a pegboard
  const wall = { x: x0 + 4, y: -82, w: 142, d: 6, r: 0.6 };
  out.push(S(slab(wall, 3, 78, 1, 0.5), { tone: "mid" }));
  const peg = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) peg.push(at([x0 + 14 + c * 11, wall.y + wall.d, 50 + r * 7.5]));
  out.push(D(peg, { size: 0.55, tone: "lo" }));
  // tools on the pegboard: a ruler and a wrench drawn as small plates
  out.push(painted({ x: x0 + 20, y: wall.y + wall.d, w: 40, d: 1.2, r: 0.3 }, 66, 5, "yellow", { tint: true }));
  out.push(painted({ x: x0 + 104, y: wall.y + wall.d, w: 4, d: 1.2, r: 0.3 }, 52, 22, "blue", { tint: false }));
  // desk: top on four legs, drawer block
  const top = { x: x0 + 10, y: -66, w: 130, d: 44, r: 1.5 };
  for (const [x, y] of k.corners(top, 3)) out.push(S(slab({ x: x - 1.6, y: y - 1.6, w: 3.2, d: 3.2, r: 0.4 }, 3, 33, 1), { tone: "mid" }));
  const drawers = { x: top.x + 92, y: top.y + 4, w: 34, d: 36, r: 0.8 };
  out.push(S(slab(drawers, 3, 33, 1, 0.4), { tone: "mid" }));
  for (const z of [10, 21]) out.push(L(k.segment([drawers.x, drawers.y + drawers.d, z + 9], [drawers.x + drawers.w, drawers.y + drawers.d, z + 9], P), { tone: "faint" }), `<path class="fc c-blue" d="${poly(front(drawers.y + drawers.d + 0.1, drawers.x + 13, z + 3, 8, 2, 0.8))}"/>`);
  out.push(S(slab(top, 36, 3, 2, 0.6), { tone: "mid" }));
  const zt = 39;
  // monitor: foot, neck, screen with code
  const mx = x0 + 56;
  out.push(S(slab({ x: mx - 12, y: -58, w: 24, d: 12, r: 2 }, zt, 1.6, 2, 0.3), { tone: "mid" }));
  out.push(S(slab({ x: mx - 2.5, y: -56, w: 5, d: 4, r: 0.6 }, zt + 1.6, 12, 1), { tone: "mid" }));
  const screen = { x: mx - 40, y: -54, w: 80, d: 4, r: 1 };
  out.push(S(slab(screen, zt + 12, 46, 2, 0.6), { tone: "hi", crease: "lo" }));
  const sy = screen.y + screen.d;
  const glass = front(sy, mx - 37, zt + 15.5, 74, 39.5, 1);
  out.push(`<path class="screen" d="${poly(glass)}"/>`);
  const code = [[0, 26, "purple"], [4, 30, "blue"], [4, 18, "green"], [8, 24, "orange"], [4, 34, "blue"], [0, 14, "purple"], [0, 30, "green"]];
  code.forEach(([indent, len, color], i) => {
    const z = zt + 50 - i * 4.6;
    out.push(`<path class="code sc c-${color}" d="${k.segment([mx - 32 + indent, sy + 0.1, z], [mx - 32 + indent + len, sy + 0.1, z], P)}"/>`);
  });
  out.push(`<path class="cursor" d="${poly(front(sy + 0.15, mx + 2, zt + 50 - 6 * 4.6 - 1.4, 2.6, 3.4, 0))}"/>`);
  out.push(`<path class="iso-line" data-tone="mid" d="${poly(glass)}"/>`);
  out.push(`<g transform="${face(mx + 24, sy + 0.12, zt + 26)}">${logoMark("github", 0, 0, 8, "screen-logo")}</g>`);
  // keyboard and mouse
  const kb = { x: mx - 26, y: -40, w: 52, d: 14, r: 1.4 };
  out.push(S(slab(kb, zt, 2.4, 2, 0.4), { tone: "hi", crease: "lo" }));
  const keys = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 12; c++) keys.push(at([kb.x + 4 + c * 4.1, kb.y + 3 + r * 4, zt + 2.4]));
  out.push(D(keys, { size: 0.55, tone: "mid" }));
  out.push(S(k.cylinder(mx + 36, -33, 3, zt, 2, P, 14, 0.3), { tone: "hi", crease: "lo" }));
  // mug and a desk lamp
  out.push(S(k.cylinder(x0 + 22, -44, 4.4, zt, 9, P, 18, 0.4), { tone: "mid", inner: `<path class="fc c-blue" style="fill-opacity:.85" d="${k.sideArc(x0 + 22, -44, 4.4, zt + 5, P, 14)}"/>` }));
  out.push(`<path class="void" d="${k.ring(x0 + 22, -44, 3.6, zt + 9, P, 16)}"/>`);
  const lx = x0 + 120;
  out.push(S(k.cylinder(lx, -56, 6, zt, 2, P, 18, 0.3), { tone: "mid" }));
  out.push(S(k.cylinder(lx, -56, 1.2, zt + 2, 30, P, 8), { tone: "mid", crease: "none" }));
  out.push(S(slab({ x: lx - 16, y: -59, w: 18, d: 6, r: 2 }, zt + 30, 5, 2, 0.4), { tone: "mid", inner: `<path class="fc c-yellow lamp" d="${poly(front(-53, lx - 13, zt + 30.5, 12, 1.4, 0.5))}"/>` }));
  return out.join("");
}

// ---------------------------------------------------------------- page
const body = [block(), pepprio(PLACES[0].x), sign(PLACES[0], PLACES[0].x), pignelle(PLACES[1].x), sign(PLACES[1], PLACES[1].x), desk(PLACES[2].x), sign(PLACES[2], PLACES[2].x)];

const CSS = `
${BASE_CSS}
.paper{fill:var(--anatomy-face);stroke:none}
.ticket .iso-top,.ticket .iso-shade{fill:var(--anatomy-face)}
.mark-dot{fill:#ffffff;stroke:none}
.screen{fill:#0d1117;stroke:none}
.code{fill:none;stroke-width:1.1px;stroke-linecap:round}
.cursor{fill:#e6edf3;stroke:none}
.screen-logo{fill:#e6edf3}
.sname{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;font-size:10.5px;font-weight:700;fill:var(--strong)}
.sline{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:5.6px;fill:var(--text)}
@keyframes lamp{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@media (prefers-reduced-motion:no-preference){.lamp{animation:lamp 3s ease-in-out infinite}.cursor{animation:blink 1.1s steps(1,end) infinite}}`;

const label = "Three small buildings on one street block. Pepprio: a restaurant counter with an order ticket printer, pepprio.com, restaurant order management. Pignelle: an estate agency with listing cards in its window and a signing stamp, pignelle.com, tools for real estate agencies. Ben Macha Ali: a workshop desk with a monitor, benmacha.tn and github.com/BenMacha.";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
<title>Organizations and projects</title>
<style>${CSS}</style>
<defs><filter id="b9" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="8"/></filter></defs>
<rect class="card" x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="6"/>
<text class="mono" x="24" y="30">Fig 3</text>
<text class="mono caps" x="${W - 22}" y="30" text-anchor="end">Organizations &amp; projects</text>
<text class="mono caps" x="24" y="${H - 16}">Restaurant orders · real estate · personal</text>
<text class="mono ro" x="${W - 22}" y="${H - 16}" text-anchor="end">pepprio.com · pignelle.com · benmacha.tn</text>
<g transform="translate(${ART.x} ${ART.y})">${body.join("")}</g>
</svg>
`;

const out = compact(svg);
mkdirSync(dirname(output) || ".", { recursive: true });
writeFileSync(output, out);
console.log(`wrote ${output} (${(Buffer.byteLength(out) / 1024).toFixed(1)} KB)`);
