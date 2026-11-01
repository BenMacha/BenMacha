// The pull request line: an intake hopper drops parcels (pull requests) onto an indexing conveyor
// that carries them under a review station (a gantry with a stamp and a dial reading the share
// merged). Merged pull requests end as green parcels in the tray at the end of the line; the ones
// still under review queue in the red-outlined tray in front. Counters on both trays give the true
// totals (each tray draws at most 12 parcels).
//
// prLine({ merged, open, width }) → { svg, width, height, points }
//   points: screen points of the hopper, the station, the merged tray and the review tray, for callouts.

import * as k from "./iso-kit.mjs";
import { fitWidth, fix, kit } from "./draw.mjs";

export function prLine({ merged, open, width = 560 }) {
  const SHARE = merged + open ? merged / (merged + open) : 0;
  const BASE = { x: -176, y: -64, w: 352, d: 150 };
  const BASE_H = 6;
  const BELT = { x: -122, y: -24, w: 196, d: 26 };
  const BELT_H = 14;
  const GAP = 28;
  const CUBE = 12;
  const HOP = { x: -166, y: -32, w: 42, d: 42 };
  const HOP_H = 34;
  const ST = 20; // station x
  const BEAM_Z = 54;
  const MT = { x: 86, y: -40, w: 74, d: 56 };
  const RT = { x: -112, y: 22, w: 104, d: 52 };
  const TRAY_H = 12;
  const CTRL = { x: 30, y: 30, w: 40, d: 14 };
  const CTRL_H = 30;

  const { P, height } = fitWidth([...k.boxCorners(BASE, -BASE_H - 4, 0), [ST, -12, BEAM_Z + 10], [HOP.x, HOP.y, HOP_H]], width, { pad: 8 });
  const { at, poly, seg, box, cyl, line, faceText, ringOn } = kit(P);
  const out = [];

  // base plate on four feet, a groove along its top edge and corner screws
  for (const [x, y] of [[BASE.x + 12, BASE.y + 12], [BASE.x + BASE.w - 12, BASE.y + 12], [BASE.x + 12, BASE.y + BASE.d - 12], [BASE.x + BASE.w - 12, BASE.y + BASE.d - 12]]) out.push(cyl(x, y, 5, -BASE_H - 4, 4, "m-s"));
  out.push(box(BASE, -BASE_H, BASE_H, "m-s"));
  out.push(line(poly([[BASE.x + 5, BASE.y + 5, 0], [BASE.x + BASE.w - 5, BASE.y + 5, 0], [BASE.x + BASE.w - 5, BASE.y + BASE.d - 5, 0], [BASE.x + 5, BASE.y + BASE.d - 5, 0]]), "ru"));
  // a ruler strip along the front edge
  const ticks = [];
  for (let x = BASE.x + 14, i = 0; x < BASE.x + BASE.w - 10; x += 6, i++) ticks.push(seg([x, BASE.y + BASE.d, -1], [x, BASE.y + BASE.d, -1 - (i % 5 ? 2 : 4)]));
  out.push(line(ticks.join(""), "mu"));

  // intake hopper: a box with an open mouth and a chute onto the belt
  const hop = [];
  hop.push(box(HOP, 0, HOP_H, "", `<path class="hole" d="${poly([[HOP.x + 4, HOP.y + 4, HOP_H], [HOP.x + HOP.w - 4, HOP.y + 4, HOP_H], [HOP.x + HOP.w - 4, HOP.y + HOP.d - 4, HOP_H], [HOP.x + 4, HOP.y + HOP.d - 4, HOP_H]])}"/>`));
  hop.push(line(seg([HOP.x, HOP.y + HOP.d, HOP_H - 8], [HOP.x + HOP.w, HOP.y + HOP.d, HOP_H - 8]) + seg([HOP.x + HOP.w, HOP.y, HOP_H - 8], [HOP.x + HOP.w, HOP.y + HOP.d, HOP_H - 8])));
  for (const [u, z] of [[5, 5], [HOP.w - 5, 5], [5, HOP_H - 13], [HOP.w - 5, HOP_H - 13]]) {
    const [sx, sy] = at([HOP.x + u, HOP.y + HOP.d, z]);
    hop.push(`<circle class="dot" cx="${fix(sx)}" cy="${fix(sy)}" r="1"/>`);
  }
  hop.push(faceText("y", HOP.y + HOP.d, HOP.x + HOP.w / 2, 10, "IN", { size: 7, cls: "mono muted" }));
  out.push(...hop);

  // conveyor: frame, rollers across the top, legs
  out.push(box(BELT, 0, BELT_H, "", line([...Array(Math.floor(BELT.w / 10))].map((_, i) => seg([BELT.x + 5 + i * 10, BELT.y + 2, BELT_H], [BELT.x + 5 + i * 10, BELT.y + BELT.d - 2, BELT_H])).join(""), "ru")));
  out.push(line(seg([BELT.x, BELT.y + BELT.d, BELT_H - 4], [BELT.x + BELT.w, BELT.y + BELT.d, BELT_H - 4]), "mu"));
  for (let x = BELT.x + 16; x < BELT.x + BELT.w; x += 40) {
    const [sx, sy] = at([x, BELT.y + BELT.d, BELT_H - 7]);
    out.push(`<circle class="dot" cx="${fix(sx)}" cy="${fix(sy)}" r="1.1"/>`);
  }

  // the back post of the station stands behind the belt
  const post = (y) => box({ x: ST - 3, y, w: 6, d: 6 }, 0, BEAM_Z, "", line(seg([ST + 3, y + 3, 6], [ST + 3, y + 3, BEAM_Z - 6]), "ru"));
  out.push(post(BELT.y - 12));

  // parcels on the belt: they index one gap per cycle (first fades in, last fades out)
  const [vx, vy] = k.axisVector(P, [GAP, 0, 0]);
  const parcel = (x, y, z, mat = "") => box({ x: x - CUBE / 2, y: y - CUBE / 2, w: CUBE, d: CUBE }, z, CUBE * 0.75, mat, line(seg([x, y - CUBE / 2, z + CUBE * 0.75], [x, y + CUBE / 2, z + CUBE * 0.75]) + seg([x, y + CUBE / 2, z + CUBE * 0.75], [x, y + CUBE / 2, z]), mat === "m-g" ? "g" : "mu"));
  const by = BELT.y + BELT.d / 2;
  const slots = [];
  for (let x = BELT.x + 10; x + CUBE / 2 < BELT.x + BELT.w - 4; x += GAP) slots.push(x);
  slots.forEach((x, i) => {
    const cls = i === 0 ? "pl pl-in" : i === slots.length - 1 ? "pl pl-out" : "pl";
    out.push(`<g class="${cls}">${parcel(x, by, BELT_H, x > ST ? "m-g" : "")}</g>`);
  });

  // station: beam, stamp head on a rod, front post, dial housing on the beam
  out.push(box({ x: ST - 6, y: BELT.y - 14, w: 12, d: BELT.d + 28 }, BEAM_Z, 7));
  out.push(line(seg([ST, by, BEAM_Z], [ST, by, BELT_H + CUBE * 0.75 + 12]), ""));
  out.push(`<g class="stamp">${box({ x: ST - 8, y: by - 8, w: 16, d: 16 }, BELT_H + CUBE * 0.75 + 4, 9, "m-r")}</g>`);
  out.push(post(BELT.y + BELT.d + 6));
  // dial: a round gauge on top of the beam, needle at the share merged
  const DZ = BEAM_Z + 7;
  out.push(cyl(ST, by - 2, 9, DZ, 3));
  const tick = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * (1 - i / 10);
    const r0 = i % 5 ? 6.6 : 5.6;
    tick.push(k.lineOnTop([ST + r0 * Math.cos(a), by - 2 - r0 * Math.sin(a)], [ST + 7.8 * Math.cos(a), by - 2 - 7.8 * Math.sin(a)], DZ + 3, P));
  }
  out.push(line(tick.join(""), "mu"));
  const na = Math.PI * (1 - SHARE);
  out.push(line(k.lineOnTop([ST, by - 2], [ST + 6.4 * Math.cos(na), by - 2 - 6.4 * Math.sin(na)], DZ + 3, P), "g"));

  // merged tray at the end of the line, green
  const tray = (T, mat, count, pmat) => {
    const parts = [box(T, 0, TRAY_H, mat, `<path class="hole" d="${poly([[T.x + 4, T.y + 4, TRAY_H], [T.x + T.w - 4, T.y + 4, TRAY_H], [T.x + T.w - 4, T.y + T.d - 4, TRAY_H], [T.x + 4, T.y + T.d - 4, TRAY_H]])}"/>`)];
    const cols = Math.floor((T.w - 8) / 16);
    const rows = Math.floor((T.d - 8) / 16);
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([T.x + 12 + c * 16, T.y + 12 + r * 16]);
    cells.slice(0, Math.min(count, cells.length)).forEach(([x, y]) => parts.push(parcel(x, y, 4, pmat)));
    return parts.join("");
  };
  out.push(tray(MT, "m-g", merged, "m-g"));
  out.push(line(`M${at([BELT.x + BELT.w - 4, by, BELT_H + 1]).map(fix).join(" ")}L${at([MT.x + 10, by, TRAY_H + 2]).map(fix).join(" ")}`, "g flow"));
  out.push(faceText("y", MT.y + MT.d, MT.x + MT.w / 2, 3.4, String(merged), { size: 9, cls: "mono gr" }));

  // review tray in front, red outline, fed from the belt before the station
  out.push(line(`M${at([-30, BELT.y + BELT.d, BELT_H - 2]).map(fix).join(" ")}L${at([-40, RT.y + 6, TRAY_H]).map(fix).join(" ")}`, "r flow"));
  out.push(tray(RT, "m-o", open, ""));
  out.push(faceText("y", RT.y + RT.d, RT.x + RT.w / 2, 3.4, String(open), { size: 9, cls: "mono rd" }));

  // control box in front of the station: a readout of the share merged and two lamps
  out.push(box(CTRL, 0, CTRL_H, "", `<path class="hole" d="${poly(Object.values({ a: [CTRL.x + 5, CTRL.y + CTRL.d, 10], b: [CTRL.x + CTRL.w - 5, CTRL.y + CTRL.d, 10], c: [CTRL.x + CTRL.w - 5, CTRL.y + CTRL.d, 24], d: [CTRL.x + 5, CTRL.y + CTRL.d, 24] }))}"/>`));
  out.push(faceText("y", CTRL.y + CTRL.d, CTRL.x + CTRL.w / 2, 13.5, `${Math.round(SHARE * 100)}%`, { size: 8.5, cls: "mono gr" }));
  for (const [u, c] of [[9, "g"], [17, "r"]]) {
    const [sx, sy] = at([CTRL.x + u, CTRL.y + CTRL.d, 5]);
    out.push(`<circle class="dot ${c}" cx="${fix(sx)}" cy="${fix(sy)}" r="1.8"/>`);
  }

  const css = `.pl{animation:none}.stamp{transform-box:fill-box}
@keyframes pl{to{transform:translate(${fix(vx)}px,${fix(vy)}px)}}
@keyframes pl-in{0%{opacity:0}40%,100%{opacity:1}}
@keyframes pl-out{0%,50%{opacity:1}100%{opacity:0}}
@keyframes stamp{0%,55%,100%{transform:translate(0,0)}70%,80%{transform:translate(0,4px)}}
@media (prefers-reduced-motion:no-preference){.pl{animation:pl 2.4s cubic-bezier(.45,0,.3,1) infinite}.pl-in{animation:pl 2.4s cubic-bezier(.45,0,.3,1) infinite,pl-in 2.4s linear infinite}.pl-out{animation:pl 2.4s cubic-bezier(.45,0,.3,1) infinite,pl-out 2.4s linear infinite}.stamp{animation:stamp 2.4s ease-in-out infinite}}`;
  const points = {
    hopper: at([HOP.x + HOP.w / 2, HOP.y, HOP_H]),
    station: at([ST, BELT.y - 14, BEAM_Z + 7]),
    merged: at([MT.x + MT.w - 10, MT.y + 10, TRAY_H]),
    review: at([RT.x + 8, RT.y + RT.d, TRAY_H - 4]),
    dial: at([ST + 9, by - 2, DZ + 3]),
  };
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><style>${css}</style>${out.join("")}</svg>`, width, height, points };
}
