#!/usr/bin/env node
// Draws the open source pull requests as a small isometric machine on a bench:
// an indexing conveyor carries parcels (pull requests) out of an intake hopper,
// under a review station whose stamp presses each one, towards a crate of merged
// parcels; parcels still under review wait in a holding tray. The dial on the
// station reads the share of pull requests merged so far.
//
// Usage: node scripts/pr_machine.mjs profile-contrib/stats.json [out.svg]
// Stats shape: {"merged": 14, "review": 23, "projects": [{"name": "Symfony", "merged": 14, "review": 2}]}
// Node 20+, built-ins only. The isometric kit is vendored in scripts/anatomy/.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as k from "./anatomy/iso-kit.mjs";

const input = process.argv[2];
const output = process.argv[3] || "profile-contrib/pr-machine.svg";
if (!input) {
  console.error("usage: node scripts/pr_machine.mjs <stats.json> [out.svg]");
  process.exit(1);
}

// ---------------------------------------------------------------- data
const raw = JSON.parse(readFileSync(input, "utf8"));
const count = (value) => Math.max(0, Math.floor(Number(value) || 0));
const projects = (Array.isArray(raw.projects) ? raw.projects : [])
  .map((p) => ({ name: String(p.name ?? "").trim() || "?", merged: count(p.merged), review: count(p.review) }))
  .filter((p) => p.merged || p.review);
const MERGED = raw.merged !== undefined ? count(raw.merged) : projects.reduce((s, p) => s + p.merged, 0);
const REVIEW = raw.review !== undefined ? count(raw.review) : projects.reduce((s, p) => s + p.review, 0);
const TOTAL = MERGED + REVIEW;
const SHARE = TOTAL ? MERGED / TOTAL : 0;
const CAP = 12; // parcels drawn in the crate and in the tray; the counters show the true number

// ---------------------------------------------------------------- card layout
const W = 840;
const H = 340;
const LEDGER = 232; // left column for the totals and the per-project ledger
const ART = { x: LEDGER, y: 34, w: W - LEDGER - 14, h: H - 66 };

// ---------------------------------------------------------------- world (units ~ 1 px of the object)
const BENCH = { x: -262, y: -78, w: 524, d: 160, r: 9 };
const BENCH_H = 12;
const FOOT_H = 5;

const BELT_Y = -20; // belt centre line
const BELT = { x0: -192, x1: 150 };
const RAIL_Z = 14;
const RAIL_TOP = 25;
const BELT_TOP = 22;
const STEP = 66; // index of the conveyor, one parcel pitch
const DWELL = [-198, -132, -66, 0, 66, 132]; // p0 inside the hopper, p5 fades at the belt end
const STATION = 0; // x of the review station = DWELL[3]

const PARCEL = { w: 20, d: 24, h: 11 };

const HOPPER = { x: -244, y: -46, w: 52, d: 52, r: 2 };
const HOPPER_H = 34;

const POST_R = 3.6;
const POSTS = [[STATION, BELT_Y - 31], [STATION, BELT_Y + 29]];
const BEAM = { x: STATION - 8, y: BELT_Y - 37, w: 16, d: 74, r: 2 };
const BEAM_Z = 62;
const BEAM_H = 8;
const DIAL = [STATION, BELT_Y - 4];
const DIAL_R = 18;
const DIAL_Z = BEAM_Z + BEAM_H + 2.5;
const DIAL_H = 7;
const DIAL_TOP = DIAL_Z + DIAL_H;
const HEAD_Z = BELT_TOP + PARCEL.h + 3; // stamp head bottom at rest, 3 above a parcel
const PRESS = 3;

const TRAY = { x: -170, y: 16, w: 160, d: 56, r: 3 };
const TRAY_RIM = 6;

const CRATE = { x: 158, y: -52, w: 88, d: 66, r: 2.5 };
const CRATE_WALL = 3;
const CRATE_H = 7;

const PANEL = { x: 104, y: 36, w: 48, d: 30, r: 2.5 };
const PANEL_H = 9;

const extreme = [
  ...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0),
  [STATION, BEAM.y, DIAL_TOP + 2],
  [STATION, BEAM.y + BEAM.d, DIAL_TOP + 2],
  [HOPPER.x, HOPPER.y, HOPPER_H + 22],
];
const P = k.fitProjection(extreme, ART.w, ART.h, { pad: 12, azimuth: 68 });

// ---------------------------------------------------------------- helpers
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const slab = (plan, z, h, steps = 3, bevel = 0) => k.slabOf(plan, z, h, P, steps, bevel);
const depth = ([x, y, z = 0]) => k.depthOf([x, y, z], P);
const byDepth = (points) => [...points].sort((a, b) => depth(a) - depth(b));
const poly = (points, closed = true) => k.pathOf(points.map(at), closed);
const fix = (v) => Math.round(v * 100) / 100;
const shift = (dx, dy, dz) => {
  const [x, y] = k.axisVector(P, [dx, dy, dz]);
  return [fix(x), fix(y)];
};
const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const halo = (plan, z, h, blur = "b9") => `<path class="iso-halo" filter="url(#${blur})" transform="translate(0 3)" d="${k.haloOf(plan, z, h, P)}"/>`;

// A rounded rectangle standing on a vertical face: face "y" lies in the plane y = const (local u = +x),
// face "x" lies in the plane x = const (local u = -y). Returns world points.
function faceRect(face, at0, u0, z0, w, h, r = 1, steps = 3) {
  const ring = k.roundedPlan({ x: u0, y: z0, w, d: h, r }, steps);
  return ring.map(([u, z]) => (face === "y" ? [u, at0, z] : [at0, -u, z]));
}

// ---------------------------------------------------------------- parts
function parcel([cx, cy, z], tag) {
  const { w, d, h } = PARCEL;
  const plan = { x: cx - w / 2, y: cy - d / 2, w, d, r: 0 };
  const top = z + h;
  const inner = [
    // packing tape: across the lid and down the front face, edge to edge
    k.lineSvg(k.lineOnTop([cx - 2.2, plan.y], [cx - 2.2, plan.y + d], top, P) + k.lineOnTop([cx + 2.2, plan.y], [cx + 2.2, plan.y + d], top, P), { tone: "faint" }),
    k.lineSvg(k.segment([cx - 2.2, plan.y + d, top], [cx - 2.2, plan.y + d, z], P) + k.segment([cx + 2.2, plan.y + d, top], [cx + 2.2, plan.y + d, z], P), { tone: "faint" }),
  ].join("");
  const out = [S(slab(plan, z, h, 1), { tone: "hi", crease: "lo", inner })];
  const label = { x: cx + 4, y: plan.y + 3, w: 5.5, d: 8, r: 0.8 };
  if (tag) {
    out.push(`<path class="tag ${tag}" d="${k.planOutline(label, top, P, 2)}"/>`);
  } else {
    out.push(L(k.planOutline(label, top, P, 2), { tone: "lo" }));
  }
  return out.join("");
}

function bench() {
  const out = [halo(BENCH, -BENCH_H - FOOT_H, BENCH_H)];
  for (const [x, y] of byDepth(k.corners(BENCH, 24)).slice(1)) {
    out.push(S(k.cylinder(x, y, 7.5, -BENCH_H - FOOT_H, 1.6, P, 18), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.6, -BENCH_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 18), { tone: "mid" }));
  }
  out.push(S(slab(BENCH, -BENCH_H, BENCH_H, 8, 1.6), { tone: "mid", inner: L(k.sideSeam(BENCH, -BENCH_H + 4, P, 8), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(BENCH, 5), 0, P), { tone: "faint" }));
  const screws = k.corners(BENCH, 11);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.3, 0, P, 14)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.55 }));
  // ruler strip along the front edge, right of the tray
  const strip = { x: 52, y: BENCH.y + BENCH.d - 11, w: 118, d: 6.5, r: 1 };
  out.push(S(slab(strip, 0, 0.6, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.3, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.3, 0.6])], { size: 0.45 }));
  return out.join("");
}

function hopper() {
  const out = [halo(HOPPER, 0, 4, "b4")];
  const base = HOPPER;
  out.push(S(slab(base, 0, 4, 3, 0.6), { tone: "mid" }));
  const body = k.insetPlan(base, 3);
  const seam = L(k.sideSeam(body, 12, P, 3), { tone: "faint" });
  out.push(S(slab(body, 4, HOPPER_H - 4, 3, 0.8), { tone: "mid", inner: seam }));
  // label plate on the front face, three rule lines standing for text
  const plate = faceRect("y", body.y + body.d, body.x + 8, 15, 22, 12, 1);
  out.push(`<path class="iso-line" data-tone="lo" d="${poly(plate)}"/>`);
  const rules = [[body.x + 11, body.x + 26], [body.x + 11, body.x + 22], [body.x + 11, body.x + 24]];
  rules.forEach(([a, b], i) => out.push(L(k.segment([a, body.y + body.d, 24 - i * 3], [b, body.y + body.d, 24 - i * 3], P), { tone: "lo", free: true })));
  out.push(D([at([body.x + 9.6, body.y + body.d, 25.4]), at([body.x + 28.4, body.y + body.d, 25.4])], { size: 0.45 }));
  // funnel: two flared tiers and an open mouth
  const tier1 = k.insetPlan(base, -2);
  out.push(S(slab(tier1, HOPPER_H, 9, 3, 0.6), { tone: "mid" }));
  const tier2 = k.insetPlan(base, -6);
  out.push(S(slab(tier2, HOPPER_H + 9, 9, 3, 0.8), { tone: "mid" }));
  const mouth = k.insetPlan(tier2, 4);
  out.push(`<path class="void" d="${k.planOutline(mouth, HOPPER_H + 18, P, 3)}"/>`);
  out.push(L(k.planOutline(mouth, HOPPER_H + 18, P, 3), { tone: "lo" }));
  // inner wall seen through the mouth (back and left walls drop into the dark)
  const m = mouth;
  const zt = HOPPER_H + 18;
  out.push(`<path class="iso-shade" data-shade="0" d="${poly([[m.x, m.y, zt], [m.x + m.w, m.y, zt], [m.x + m.w, m.y, zt - 6], [m.x + 4, m.y + 4, zt - 6]])}"/>`);
  out.push(`<path class="iso-shade" data-shade="1" d="${poly([[m.x, m.y, zt], [m.x, m.y + m.d, zt], [m.x + 4, m.y + m.d, zt - 6], [m.x + 4, m.y + 4, zt - 6]])}"/>`);
  out.push(L(k.planOutline(mouth, zt, P, 3), { tone: "lo" }));
  out.push(D(k.corners(tier2, 2.2).map(([x, y]) => at([x, y, zt])), { size: 0.45 }));
  // exit slot on the +x face where the belt comes out
  const fx = body.x + body.w;
  const slot = faceRect("x", fx, -(BELT_Y + 17), BELT_TOP - 1, 34, PARCEL.h + 5, 1.5);
  out.push(`<path class="void" d="${poly(slot)}"/>`);
  out.push(`<path class="iso-line" data-tone="lo" d="${poly(slot)}"/>`);
  return out.join("");
}

function motor() {
  const out = [];
  const plan = { x: 92, y: BELT_Y - 46, w: 36, d: 20, r: 2 };
  out.push(halo(plan, 0, 3, "b4"));
  out.push(S(slab({ x: plan.x - 3, y: plan.y - 2, w: plan.w + 6, d: plan.d + 4, r: 1.5 }, 0, 3, 3, 0.5), { tone: "lo" }));
  const ribs = [];
  for (let x = plan.x + 4; x <= plan.x + plan.w - 4; x += 4) ribs.push(k.segment([x, plan.y + plan.d, 6], [x, plan.y + plan.d, 21], P));
  out.push(S(slab(plan, 3, 21, 4, 0.8), { tone: "mid", inner: L(ribs.join(""), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(plan, 3), 24, P, 3), { tone: "faint" }));
  const box = { x: plan.x + 6, y: plan.y + 4, w: 12, d: 10, r: 1 };
  out.push(S(slab(box, 24, 6, 2, 0.4), { tone: "mid" }));
  out.push(D(k.corners(box, 2).map(([x, y]) => at([x, y, 30])), { size: 0.4 }));
  out.push(S(k.cylinder(plan.x + plan.w - 8, plan.y + plan.d / 2, 4, 24, 3, P, 20), { tone: "mid" }));
  // coupling block to the drive roller
  out.push(S(slab({ x: plan.x + plan.w - 16, y: plan.y + plan.d, w: 10, d: BELT_Y - 22 - plan.y - plan.d + 1, r: 1 }, 12, 8, 2, 0.4), { tone: "mid" }));
  return out.join("");
}

function post([x, y]) {
  const out = [];
  out.push(S(k.cylinder(x, y, 6.5, 0, 2, P, 18, 0.4), { tone: "lo" }));
  out.push(D([0, 1, 2, 3].map((i) => at([x + Math.cos(i * Math.PI / 2 + 0.4) * 5, y + Math.sin(i * Math.PI / 2 + 0.4) * 5, 2])), { size: 0.4 }));
  out.push(S(k.cylinder(x, y, 4.6, 2, 4, P, 14), { tone: "mid" }));
  const seams = [24, 44].map((z) => k.sideArc(x, y, POST_R, z, P, 14)).join("");
  out.push(S(k.cylinder(x, y, POST_R, 6, BEAM_Z - 6, P, 14), { tone: "mid", crease: "none", inner: L(seams, { tone: "faint" }) }));
  return out.join("");
}

function legs(y) {
  const out = [];
  for (const x of [-168, -40, 112]) {
    out.push(S(slab({ x: x - 4, y: y - 4, w: 8, d: 8, r: 1.2 }, 0, 1.4, 1), { tone: "lo" }));
    out.push(S(slab({ x: x - 2.2, y: y - 2.2, w: 4.4, d: 4.4, r: 0.6 }, 1.4, RAIL_Z - 1.4, 2), { tone: "mid" }));
  }
  return out.join("");
}

function rail(y0) {
  const plan = { x: BELT.x0, y: y0, w: BELT.x1 - BELT.x0, d: 4, r: 1 };
  const bolts = [];
  for (let x = BELT.x0 + 8; x < BELT.x1 - 4; x += 22) bolts.push(at([x, y0 + 2, RAIL_TOP]));
  return S(slab(plan, RAIL_Z, RAIL_TOP - RAIL_Z, 2, 0.4), { tone: "mid", inner: L(k.sideSeam(plan, RAIL_Z + 4, P, 2), { tone: "faint" }) }) + D(bolts, { size: 0.42 });
}

function belt() {
  const out = [];
  const plan = { x: BELT.x0, y: BELT_Y - 16, w: BELT.x1 - BELT.x0, d: 32, r: 0 };
  out.push(S(slab({ ...plan, r: 4 }, RAIL_Z + 2, BELT_TOP - RAIL_Z - 2, 4), { tone: "lo" }));
  // cleats, clipped to the belt top and indexed with the parcels
  const clip = k.planOutline(plan, BELT_TOP, P, 1);
  const lines = [];
  for (let x = BELT.x0 - STEP; x <= BELT.x1; x += STEP / 10) lines.push(k.lineOnTop([x, plan.y], [x, plan.y + plan.d], BELT_TOP, P));
  out.push(`<clipPath id="beltclip"><path d="${clip}"/></clipPath><g clip-path="url(#beltclip)"><g class="cleats">${L(lines.join(""), { tone: "faint" })}</g></g>`);
  // end drums: axle caps on the +x end of the frame
  out.push(L(k.sideRing([BELT.x1, BELT_Y + 18, RAIL_Z + 5.5], 2.2, "x", P, 14), { tone: "lo" }));
  out.push(D([at([BELT.x1, BELT_Y + 18, RAIL_Z + 5.5])], { size: 0.5 }));
  return out.join("");
}

function railCaps() {
  // end stop blocks on the belt end
  const out = [];
  for (const y of [BELT_Y - 22, BELT_Y + 18]) {
    const plan = { x: BELT.x1 - 2, y, w: 5, d: 4, r: 0.8 };
    out.push(S(slab(plan, RAIL_Z - 2, RAIL_TOP - RAIL_Z + 4, 2, 0.4), { tone: "mid" }));
  }
  return out.join("");
}

function stamp() {
  const out = [];
  const [x, y] = [STATION, BELT_Y];
  // rod rises into the gland under the beam
  out.push(S(k.cylinder(x, y, 2, HEAD_Z + 5, BEAM_Z - 6 - HEAD_Z - 2, P, 18), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(x, y, 4.2, HEAD_Z + 5, 2.5, P, 14), { tone: "mid" }));
  const head = { x: x - 9, y: y - 11, w: 18, d: 22, r: 1.5 };
  out.push(S(slab(head, HEAD_Z + 1, 4, 3, 0.5), { tone: "mid", inner: L(k.sideSeam(head, HEAD_Z + 2.6, P, 3), { tone: "faint" }) }));
  out.push(S(slab(k.insetPlan(head, 1.2), HEAD_Z, 1, 3), { tone: "lo", crease: "none" }));
  out.push(D(k.corners(head, 2.4).map(([px, py]) => at([px, py, HEAD_Z + 5])), { size: 0.42 }));
  return out.join("");
}

function gland() {
  const [x, y] = [STATION, BELT_Y];
  const plan = { x: x - 6, y: y - 6, w: 12, d: 12, r: 1.5 };
  return S(slab(plan, BEAM_Z - 7, 7, 3, 0.4), { tone: "mid" }) + L(k.sideArc(x, y, 2.6, BEAM_Z - 7, P, 12), { tone: "faint" });
}

function beam() {
  const out = [];
  out.push(S(slab(BEAM, BEAM_Z, BEAM_H, 3, 0.8), { tone: "mid", inner: L(k.sideSeam(BEAM, BEAM_Z + 3, P, 3), { tone: "faint" }) }));
  out.push(D(POSTS.map(([x, y]) => at([x, y, BEAM_Z + BEAM_H])), { size: 0.55 }));
  out.push(L(POSTS.map(([x, y]) => k.ring(x, y, 2.4, BEAM_Z + BEAM_H, P, 14)).join(""), { tone: "lo" }));
  // pedestal and dial
  const [dx, dy] = DIAL;
  out.push(S(slab({ x: dx - 7, y: dy - 7, w: 14, d: 14, r: 1.5 }, BEAM_Z + BEAM_H, 2.5, 3, 0.3), { tone: "mid" }));
  out.push(S(k.cylinder(dx, dy, DIAL_R, DIAL_Z, DIAL_H, P, 40, 0.8), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(dx, dy, DIAL_R, DIAL_TOP - 3.2, DIAL_TOP, 60, P, 0.3), { tone: "lo" }));
  out.push(L(k.sideArc(dx, dy, DIAL_R, DIAL_TOP - 3.2, P, 40), { tone: "faint" }));
  out.push(L(k.ring(dx, dy, DIAL_R - 2, DIAL_TOP, P, 40), { tone: "lo" }));
  const FROM = -0.75 * Math.PI;
  const SPAN = 1.5 * Math.PI;
  const ticks = k.radialTicks(dx, dy, DIAL_R - 2, 20, 5, DIAL_TOP, [1.2, 2.6], P, FROM, SPAN);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  // zero mark
  const z0 = [Math.sin(FROM), -Math.cos(FROM)];
  out.push(L(k.lineOnTop([dx + z0[0] * (DIAL_R - 5.2), dy + z0[1] * (DIAL_R - 5.2)], [dx + z0[0] * (DIAL_R - 2), dy + z0[1] * (DIAL_R - 2)], DIAL_TOP, P), { tone: "hi" }));
  // crown on the side
  out.push(S(slab({ x: dx + DIAL_R - 1, y: dy - 2.2, w: 4.4, d: 4.4, r: 1 }, DIAL_Z + 1.5, 4, 2), { tone: "mid" }));
  out.push(S(slab({ x: dx + DIAL_R + 3, y: dy - 3, w: 2.4, d: 6, r: 1 }, DIAL_Z + 0.8, 5.4, 2), { tone: "mid" }));
  // needle: share of pull requests merged
  const angle = FROM + SHARE * SPAN;
  const s = [Math.sin(angle), -Math.cos(angle)];
  out.push(`<path class="iso-line" data-tone="lit" data-free="start" style="stroke-width:1.1" d="${k.lineOnTop([dx - s[0] * 3.2, dy - s[1] * 3.2], [dx + s[0] * (DIAL_R - 4), dy + s[1] * (DIAL_R - 4)], DIAL_TOP + 0.2, P)}"/>`);
  out.push(L(k.ring(dx, dy, 1.5, DIAL_TOP + 0.2, P, 14), { tone: "mid" }));
  return out.join("");
}

// A mechanical counter on a vertical face: a raised bezel with a dark window and the digits in it.
function counter(face, at0, u0, z0, value, cls) {
  const digits = String(Math.min(value, 999)).padStart(3, "0");
  const w = 34;
  const h = 15;
  const out = [];
  const bezel = face === "y" ? { x: u0, y: at0, w, d: 1.4, r: 0.5 } : { x: at0, y: -u0 - w, w: 1.4, d: w, r: 0.5 };
  out.push(S(slab(bezel, z0, h, 2, 0.3), { tone: "mid" }));
  const front = at0 + 1.4;
  const win = faceRect(face, front, u0 + 2, z0 + 1.8, w - 4, h - 3.6, 0.8, 2);
  out.push(`<path class="void" d="${poly(win)}"/>`);
  out.push(`<path class="iso-line" data-tone="lo" d="${poly(win)}"/>`);
  // digit wheel separators
  const third = (w - 4) / 3;
  for (const i of [1, 2]) {
    const u = u0 + 2 + third * i;
    const a = face === "y" ? [u, front, z0 + 1.8] : [front, -u, z0 + 1.8];
    const b = face === "y" ? [u, front, z0 + h - 1.8] : [front, -u, z0 + h - 1.8];
    out.push(L(k.segment(a, b, P), { tone: "faint" }));
  }
  const origin = face === "y" ? [u0 + w / 2, front] : [front, -(u0 + w / 2)];
  const m = k.sideMatrix(origin, z0 + 4.3, P, face === "y" ? "left" : "right");
  const glyphs = [...digits].map((c, i) => `<tspan x="${fix((i - 1) * third)}">${c}</tspan>`).join("");
  out.push(`<text class="digits ${cls}" transform="${m}" font-size="9" text-anchor="middle">${glyphs}</text>`);
  out.push(D([at(face === "y" ? [u0 + 1, front, z0 + h / 2] : [front, -(u0 + 1), z0 + h / 2]), at(face === "y" ? [u0 + w - 1, front, z0 + h / 2] : [front, -(u0 + w - 1), z0 + h / 2])], { size: 0.4 }));
  return out.join("");
}

function tray() {
  const out = [halo(TRAY, 0, 2, "b4")];
  out.push(S(slab(TRAY, 0, 2.5, 4, 0.5), { tone: "lo" }));
  const inner = k.insetPlan(TRAY, 3);
  // floor with guide grooves
  out.push(`<path class="iso-top" d="${k.planOutline(inner, 2.5, P, 3)}"/>`);
  for (let col = 1; col < 6; col++) {
    const x = inner.x + (inner.w / 6) * col;
    out.push(L(k.lineOnTop([x, inner.y], [x, inner.y + inner.d], 2.5, P), { tone: "faint" }));
  }
  out.push(L(k.lineOnTop([inner.x, inner.y + inner.d / 2], [inner.x + inner.w, inner.y + inner.d / 2], 2.5, P), { tone: "faint" }));
  // back and left rims (behind the parcels)
  out.push(S(slab({ x: TRAY.x, y: TRAY.y, w: TRAY.w, d: 3, r: 1 }, 2.5, TRAY_RIM - 2.5, 2, 0.3), { tone: "mid" }));
  out.push(S(slab({ x: TRAY.x, y: TRAY.y, w: 3, d: TRAY.d, r: 1 }, 2.5, TRAY_RIM - 2.5, 2, 0.3), { tone: "mid" }));
  // parcels waiting for review, back to front
  const n = Math.min(REVIEW, CAP);
  const slots = [];
  for (let row = 0; row < 2; row++) for (let col = 0; col < 6; col++) slots.push([inner.x + (inner.w / 6) * (col + 0.5), inner.y + (inner.d / 2) * (row + 0.5)]);
  const filled = slots.slice(0, n).map(([x, y], i) => [x + ((i * 7) % 3) - 1, y + ((i * 5) % 3) - 1]);
  for (const [x, y] of byDepth(filled)) out.push(parcel([x, y, 2.5], "review"));
  // front and right rims
  out.push(S(slab({ x: TRAY.x + TRAY.w - 3, y: TRAY.y, w: 3, d: TRAY.d, r: 1 }, 2.5, TRAY_RIM - 2.5, 2, 0.3), { tone: "mid" }));
  out.push(S(slab({ x: TRAY.x, y: TRAY.y + TRAY.d - 3, w: TRAY.w, d: 3, r: 1 }, 2.5, TRAY_RIM - 2.5, 2, 0.3), { tone: "mid" }));
  out.push(D(k.corners(TRAY, 1.5).map(([x, y]) => at([x, y, TRAY_RIM])), { size: 0.42 }));
  // counter on a small stand at the tray's right front corner
  const stand = { x: TRAY.x + TRAY.w + 8, y: TRAY.y + TRAY.d - 16, w: 40, d: 12, r: 1.5 };
  out.push(halo(stand, 0, 2, "b4"));
  out.push(S(slab(stand, 0, 19, 3, 0.6), { tone: "mid" }));
  out.push(counter("y", stand.y + stand.d, stand.x + 3, 2.2, REVIEW, "review"));
  return out.join("");
}

function crate() {
  const out = [halo(CRATE, 0, 3, "b4")];
  const c = CRATE;
  const t = CRATE_WALL;
  out.push(S(slab(c, 0, 3, 3, 0.5), { tone: "lo" }));
  const inner = k.insetPlan(c, t);
  out.push(`<path class="iso-top" d="${k.planOutline(inner, 3, P, 2)}"/>`);
  // back (-y) and left (-x) walls
  const wall = (plan) => S(slab(plan, 3, CRATE_H - 3, 2, 0.4), { tone: "mid", inner: L(k.sideSeam(plan, 5, P, 2), { tone: "faint" }) });
  out.push(wall({ x: c.x, y: c.y, w: c.w, d: t, r: 0.8 }));
  out.push(wall({ x: c.x, y: c.y, w: t, d: c.d, r: 0.8 }));
  // merged parcels: two layers of 3 x 2, back to front, bottom to top
  const n = Math.min(MERGED, CAP);
  const items = [];
  for (let i = 0; i < n; i++) {
    const layer = Math.floor(i / 6);
    const slot = i % 6;
    const col = slot % 3;
    const row = Math.floor(slot / 3);
    const jx = ((i * 7) % 5) / 2 - 1;
    const jy = ((i * 3) % 5) / 2 - 1;
    items.push([inner.x + 14 + col * 27 + jx + layer, inner.y + 15 + row * 30 + jy - layer, 3 + layer * PARCEL.h]);
  }
  items.sort((a, b) => a[2] - b[2] || depth(a) - depth(b));
  for (const p of items) out.push(parcel(p, "merged"));
  // right (+x) and front (+y) walls
  out.push(wall({ x: c.x + c.w - t, y: c.y, w: t, d: c.d, r: 0.8 }));
  out.push(wall({ x: c.x, y: c.y + c.d - t, w: c.w, d: t, r: 0.8 }));
  out.push(D(k.corners(c, 1.5).map(([x, y]) => at([x, y, CRATE_H])), { size: 0.45 }));
  // handle slot on the right wall and the counter on the front wall
  const hole = faceRect("x", c.x + c.w, -(c.y + c.d / 2 + 8), 3.4, 16, 2.2, 1.1, 3);
  out.push(`<path class="void" d="${poly(hole)}"/>`, `<path class="iso-line" data-tone="lo" d="${poly(hole)}"/>`);
  const stand = { x: c.x + c.w - 44, y: c.y + c.d + 6, w: 40, d: 12, r: 1.5 };
  out.push(halo(stand, 0, 2, "b4"));
  out.push(S(slab(stand, 0, 19, 3, 0.6), { tone: "mid" }));
  out.push(counter("y", stand.y + stand.d, stand.x + 3, 2.2, MERGED, "merged"));
  return out.join("");
}

function panel() {
  const out = [halo(PANEL, 0, 2, "b4")];
  out.push(S(slab(PANEL, 0, PANEL_H, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(PANEL, 3, P, 3), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PANEL, 2.5), PANEL_H, P, 3), { tone: "faint" }));
  out.push(D(k.corners(PANEL, 2.4).map(([x, y]) => at([x, y, PANEL_H])), { size: 0.42 }));
  const b1 = [PANEL.x + 13, PANEL.y + 15];
  out.push(S(k.cylinder(b1[0], b1[1], 6, PANEL_H, 1.5, P, 18), { tone: "lo" }));
  out.push(S(k.cylinder(b1[0], b1[1], 4.4, PANEL_H + 1.5, 3, P, 18, 0.4), { tone: "mid" }));
  out.push(L(k.knurl(b1[0], b1[1], 4.4, PANEL_H + 1.5, PANEL_H + 4.5, 24, P), { tone: "faint" }));
  const b2 = [PANEL.x + 33, PANEL.y + 10];
  out.push(S(k.cylinder(b2[0], b2[1], 3.4, PANEL_H, 2.4, P, 22, 0.3), { tone: "mid" }));
  const b3 = [PANEL.x + 33, PANEL.y + 21];
  out.push(S(k.cylinder(b3[0], b3[1], 3.4, PANEL_H, 2.4, P, 22, 0.3), { tone: "mid" }));
  out.push(`<path class="tag merged" d="${k.ring(b2[0], b2[1], 1.6, PANEL_H + 2.4, P, 14)}"/>`);
  out.push(`<path class="tag review" d="${k.ring(b3[0], b3[1], 1.6, PANEL_H + 2.4, P, 14)}"/>`);
  return out.join("");
}

// ---------------------------------------------------------------- moving parcels
const TAU = 3; // seconds per index
const MOVE = 0.55; // share of an index spent moving
const N = DWELL.length - 1; // parcels in the loop
const beltParcels = [];
for (let i = 0; i < N; i++) {
  beltParcels.push(`<g class="bp bp${i}">${parcel([0, BELT_Y, BELT_TOP], null)}</g>`);
}
const px = (x) => shift(x, 0, 0);
const keys = [];
for (let j = 0; j < N; j++) {
  const t0 = (j / N) * 100;
  const t1 = ((j + MOVE) / N) * 100;
  const [ax, ay] = px(DWELL[j]);
  const [bx, by] = px(DWELL[j + 1]);
  const o0 = j === 0 ? 0 : 1;
  const o1 = j === N - 1 ? 0 : 1;
  keys.push(`${fix(t0)}%{transform:translate(${ax}px,${ay}px);opacity:${o0}}`);
  keys.push(`${fix(t1)}%{transform:translate(${bx}px,${by}px);opacity:${o1}}`);
}
const [ex, ey] = px(DWELL[N]);
keys.push(`100%{transform:translate(${ex}px,${ey}px);opacity:0}`);
const [cx6, cy6] = shift(STEP, 0, 0);
const [sx, sy] = shift(0, 0, -PRESS);
const staticParcels = DWELL.slice(0, N)
  .map((x, i) => {
    const [tx, ty] = px(x);
    return `.bp${i}{transform:translate(${tx}px,${ty}px);opacity:${i === 0 ? 0 : 1}}`;
  })
  .join("");
const delays = Array.from({ length: N }, (_, i) => `.bp${i}{animation-delay:${fix(-i * TAU)}s}`).join("");
const motion = `
@keyframes belt{${keys.join("")}}
@keyframes cleat{0%{transform:translate(0,0)}${fix(MOVE * 100)}%,100%{transform:translate(${cx6}px,${cy6}px)}}
@keyframes press{0%,60%{transform:translate(0,0)}70%,82%{transform:translate(${sx}px,${sy}px)}93%,100%{transform:translate(0,0)}}
@media (prefers-reduced-motion:no-preference){
.bp{animation:belt ${N * TAU}s ease-in-out infinite}${delays}
.cleats{animation:cleat ${TAU}s ease-in-out infinite}
.press{animation:press ${TAU}s ease-in-out infinite}
}`;

// ---------------------------------------------------------------- styles (light by default, dark by media query)
const LIGHT = `--anatomy-paper:#ffffff;--anatomy-face:#ffffff;--anatomy-top:#ffffff;
--anatomy-shade-0:#d8dde2;--anatomy-shade-1:#e2e6ea;--anatomy-shade-2:#ebeef1;--anatomy-shade-3:#f3f5f7;
--anatomy-lit-top:#ffffff;--anatomy-lit-shade:#eef1f4;
--anatomy-hi:#24292f;--anatomy-mid:#848d97;--anatomy-lo:#b3bac1;--anatomy-faint:#d5dae0;--anatomy-lit:#000000;
--anatomy-halo:#8c959f;--anatomy-halo-opacity:.34;--anatomy-dot:#3d444d;--void:#e3e7eb;
--card:#ffffff;--border:#d0d7de;--text:#59636e;--strong:#1f2328;--muted:#818b98;--merged:#8250df;--review:#1a7f37;--digit:#ffffff`;
const DARK = `--anatomy-paper:#0d1117;--anatomy-face:#161b22;--anatomy-top:#161c24;
--anatomy-shade-0:#0b0e13;--anatomy-shade-1:#0e1218;--anatomy-shade-2:#11161d;--anatomy-shade-3:#141a22;
--anatomy-lit-top:#202833;--anatomy-lit-shade:#181e27;
--anatomy-hi:#d1d9e0;--anatomy-mid:#6a737d;--anatomy-lo:#3d444d;--anatomy-faint:#262c35;--anatomy-lit:#ffffff;
--anatomy-halo:#010409;--anatomy-halo-opacity:.9;--anatomy-dot:#e6edf3;--void:#05070a;
--card:#0d1117;--border:#30363d;--text:#9198a1;--strong:#e6edf3;--muted:#656c76;--merged:#a371f7;--review:#3fb950;--digit:#e6edf3`;
const CSS = `
.iso{${LIGHT}}
@media (prefers-color-scheme:dark){.iso{${DARK}}}
.iso path,.iso circle{vector-effect:non-scaling-stroke}
.card{fill:var(--card);stroke:var(--border)}
.iso-fill{fill:var(--anatomy-paper);stroke:none}
.iso-solid[data-lit]>.iso-fill{fill:var(--anatomy-face)}
.iso-shade,.iso-top{stroke:none}
.iso-shade[data-shade="0"]{fill:var(--anatomy-shade-0)}
.iso-shade[data-shade="1"]{fill:var(--anatomy-shade-1)}
.iso-shade[data-shade="2"]{fill:var(--anatomy-shade-2)}
.iso-shade[data-shade="3"]{fill:var(--anatomy-shade-3)}
.iso-top{fill:var(--anatomy-top)}
.iso-solid[data-lit]>.iso-top{fill:var(--anatomy-lit-top)}
.iso-solid[data-lit]>.iso-shade{fill:var(--anatomy-lit-shade)}
.iso-solid[data-lit]>.iso-edge{stroke:var(--anatomy-lit)}
.iso-halo{fill:var(--anatomy-halo);stroke:none;opacity:var(--anatomy-halo-opacity)}
.iso-line{fill:none;stroke:var(--anatomy-lo);stroke-width:.7px;stroke-linecap:round;stroke-linejoin:round}
.iso-line[data-tone="hi"]{stroke:var(--anatomy-hi)}
.iso-line[data-tone="mid"]{stroke:var(--anatomy-mid)}
.iso-line[data-tone="faint"]{stroke:var(--anatomy-faint)}
.iso-line[data-tone="lit"]{stroke:var(--anatomy-lit)}
.iso-dots circle{fill:var(--anatomy-dot);stroke:none;opacity:.32}
.iso-dots[data-tone="hi"] circle{opacity:.85}
.iso-dots[data-tone="mid"] circle{opacity:.45}
.iso-dots[data-tone="lo"] circle{opacity:.22}
.void{fill:var(--void);stroke:none}
.tag{stroke:none}.tag.merged{fill:var(--merged)}.tag.review{fill:var(--review)}
.digits{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-weight:700}
.digits.merged{fill:var(--merged)}.digits.review{fill:var(--review)}
.mono{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10.5px;letter-spacing:.04em;fill:var(--muted)}
.caps{text-transform:uppercase;letter-spacing:.1em}
.ro{fill:var(--text)}
.sans{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif}
.big{font-size:30px;font-weight:600;fill:var(--strong)}
.unit{font-size:13px;fill:var(--text)}
.name{font-size:13px;fill:var(--strong)}
.num{font-size:12.5px;fill:var(--text);font-variant-numeric:tabular-nums}
.m{fill:var(--merged)}.r{fill:var(--review)}
.rule{stroke:var(--border);stroke-width:1}
.dot-m{fill:var(--merged)}.dot-r{fill:var(--review)}
${motion}`;

// ---------------------------------------------------------------- ledger (outside the drawing)
const pct = TOTAL ? Math.round(SHARE * 100) : 0;
const ledger = [];
ledger.push(`<text class="mono" x="24" y="32">Fig 1</text>`);
const totalsY = 80;
ledger.push(`<text class="sans big m" x="24" y="${totalsY}">${MERGED}</text>`);
ledger.push(`<text class="sans unit" x="24" y="${totalsY + 20}">merged</text>`);
ledger.push(`<text class="sans big r" x="118" y="${totalsY}">${REVIEW}</text>`);
ledger.push(`<text class="sans unit" x="118" y="${totalsY + 20}">under review</text>`);
ledger.push(`<line class="rule" x1="24" y1="${totalsY + 38}" x2="${LEDGER - 12}" y2="${totalsY + 38}"/>`);
const rowsTop = totalsY + 62;
const ROW = 21;
const maxRows = Math.floor((H - 46 - rowsTop) / ROW);
const shown = projects.length > maxRows ? projects.slice(0, maxRows - 1) : projects;
const clip = (name) => (name.length > 18 ? name.slice(0, 17) + "…" : name);
shown.forEach((p, i) => {
  const y = rowsTop + i * ROW;
  ledger.push(`<text class="sans name" x="24" y="${y}">${esc(clip(p.name))}</text>`);
  ledger.push(`<text class="sans num" x="${LEDGER - 12}" y="${y}" text-anchor="end"><tspan class="${p.merged ? "m" : ""}">${p.merged}</tspan> · <tspan class="${p.review ? "r" : ""}">${p.review}</tspan></text>`);
});
if (shown.length < projects.length) {
  const rest = projects.slice(shown.length);
  ledger.push(`<text class="sans num" x="24" y="${rowsTop + shown.length * ROW}">+${rest.length} more projects</text>`);
}
if (!projects.length) ledger.push(`<text class="sans num" x="24" y="${rowsTop}">No pull requests yet</text>`);

const corners = [
  `<text class="mono caps" x="${W - 22}" y="32" text-anchor="end">Open source pull requests</text>`,
  `<text class="mono caps" x="24" y="${H - 20}">Updated daily from GitHub</text>`,
  `<text class="mono ro" x="${W - 22}" y="${H - 20}" text-anchor="end">${MERGED} merged · ${REVIEW} under review · ${pct} % merged</text>`,
];

// ---------------------------------------------------------------- assemble, back to front
const art = [
  bench(),
  hopper(),
  motor(),
  post(POSTS[0]),
  legs(BELT_Y - 22),
  rail(BELT_Y - 22),
  belt(),
  ...beltParcels,
  rail(BELT_Y + 18),
  railCaps(),
  legs(BELT_Y + 20),
  `<g class="press">${stamp()}</g>`,
  gland(),
  post(POSTS[1]),
  beam(),
  tray(),
  crate(),
  panel(),
];

const label = `An isometric pull request machine on a bench. Parcels standing for pull requests leave an intake hopper on an indexing conveyor and pass under a review station whose stamp presses each one. ${MERGED} merged pull requests are stacked in the crate at the end of the belt and ${REVIEW} wait under review in the holding tray. The dial on the station reads ${pct} % merged.${projects.length ? " By project: " + projects.map((p) => `${p.name} ${p.merged} merged, ${p.review} under review`).join("; ") + "." : ""}`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
<title>${esc(`${MERGED} merged and ${REVIEW} under review open source pull requests`)}</title>
<style>${CSS}</style>
<defs><filter id="b9" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="8"/></filter><filter id="b4" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="3.5"/></filter></defs>
<style>${staticParcels}</style>
<rect class="card" x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="6"/>
${ledger.join("\n")}
${corners.join("\n")}
<g transform="translate(${ART.x} ${ART.y})">${art.join("")}</g>
</svg>
`;

// Shorter class names and implicit line-to commands keep the file small; the drawing is unchanged.
const SHORT = { "iso-solid": "so", "iso-fill": "fi", "iso-shade": "sh", "iso-top": "tp", "iso-line": "ln", "iso-crease": "cr", "iso-bevel": "bv", "iso-edge": "ed", "iso-dots": "dt", "iso-halo": "ha", "data-shade": "data-s", "data-tone": "data-t", "data-lit": "data-l" };
const compact = (text) =>
  text
    .replace(/\b(iso-(?:solid|fill|shade|top|line|crease|bevel|edge|dots|halo)|data-(?:shade|tone|lit))\b/g, (name) => SHORT[name])
    .replace(/ data-free="[^"]*"/g, "")
    .replace(/(<path class="ln[^"]*") data-t="lo"/g, "$1")
    .replace(/ d="([^"]*)"/g, (_, d) => ` d="${d.replace(/L/g, " ").replace(/ -/g, "-")}"`);
const out = compact(svg);
mkdirSync(dirname(output) || ".", { recursive: true });
writeFileSync(output, out);
console.log(`wrote ${output} (${(Buffer.byteLength(out) / 1024).toFixed(1)} KB)`);
