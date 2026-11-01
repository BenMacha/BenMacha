// The packages as crates on a shelf: one slatted crate per Packagist package, with its label plate
// on the front and parcels inside in proportion to its installs (the biggest gets 8). A counter
// under each crate, on the shelf edge, gives the true Packagist total.
//
// crateShelf({ packages: [{ name, downloads }], width }) → { svg, width, height, points }
//   points: the top of each crate, for callouts.

import * as k from "./iso-kit.mjs";
import { fitWidth, fix, kit } from "./draw.mjs";

export function crateShelf({ packages, width = 560 }) {
  const n = Math.max(1, packages.length);
  const BAY = 74;
  const CR = { w: 58, d: 42, h: 22 };
  const SPAN = BAY * n;
  const X0 = -SPAN / 2;
  const SHELF = { x: X0 - 14, y: -34, w: SPAN + 28, d: 64 };
  const SHELF_H = 12;
  const BACK_H = 64;
  const most = Math.max(1, ...packages.map((p) => p.downloads));

  const { P, height } = fitWidth([...k.boxCorners(SHELF, -SHELF_H - 6, 0), [SHELF.x, SHELF.y, BACK_H]], width, { pad: 6, azimuth: 66 });
  const { at, poly, seg, box, line, faceText } = kit(P);
  const out = [];

  // shelf: back board with a hanging rail, base board on feet, a ruler along the front edge
  for (const x of [SHELF.x + 6, SHELF.x + SHELF.w - 18]) out.push(box({ x, y: SHELF.y + SHELF.d - 14, w: 12, d: 10 }, -SHELF_H - 6, 6, "m-s"));
  out.push(box({ x: SHELF.x, y: SHELF.y, w: SHELF.w, d: 6 }, 0, BACK_H, "m-s", line(seg([SHELF.x + 6, SHELF.y + 6, BACK_H - 10], [SHELF.x + SHELF.w - 6, SHELF.y + 6, BACK_H - 10]), "ru")));
  const pegs = [];
  for (let i = 0; i < n; i++) {
    const [sx, sy] = at([X0 + BAY * i + BAY / 2, SHELF.y + 6, BACK_H - 10]);
    pegs.push(`<circle class="dot" cx="${fix(sx)}" cy="${fix(sy)}" r="1.4"/>`);
  }
  out.push(pegs.join(""));
  out.push(box(SHELF, -SHELF_H, SHELF_H, "m-s"));
  const ticks = [];
  for (let x = SHELF.x + 6, i = 0; x < SHELF.x + SHELF.w - 4; x += 5, i++) ticks.push(seg([x, SHELF.y + SHELF.d, -1], [x, SHELF.y + SHELF.d, -1 - (i % 5 ? 2 : 4)]));
  out.push(line(ticks.join(""), "mu"));

  const points = [];
  packages.forEach((p, i) => {
    const cx = X0 + BAY * i + BAY / 2;
    const C = { x: cx - CR.w / 2, y: -26, w: CR.w, d: CR.d };
    const fy = C.y + C.d;
    // crate: slats on the visible faces, an open top, then the parcels inside
    const slats = [];
    for (let z = 7; z < CR.h; z += 7.5) slats.push(seg([C.x, fy, z], [C.x + C.w, fy, z]), seg([C.x + C.w, C.y, z], [C.x + C.w, fy, z]));
    slats.push(seg([C.x + 4, fy, 0], [C.x + 4, fy, CR.h]), seg([C.x + C.w - 4, fy, 0], [C.x + C.w - 4, fy, CR.h]));
    const mouth = poly([[C.x + 3, C.y + 3, CR.h], [C.x + C.w - 3, C.y + 3, CR.h], [C.x + C.w - 3, fy - 3, CR.h], [C.x + 3, fy - 3, CR.h]]);
    out.push(box(C, 0, CR.h, "", `<path class="ln ru" d="${slats.join("")}"/><path class="hole" d="${mouth}"/>`));
    // parcels: up to 8, two layers of four, the top layer standing above the rim
    const count = p.downloads > 0 ? Math.max(1, Math.round((8 * p.downloads) / most)) : 0;
    const cells = [[0, 0], [1, 0], [0, 1], [1, 1]];
    for (let j = 0; j < count; j++) {
      const [c, r] = cells[j % 4];
      const layer = Math.floor(j / 4);
      const z = CR.h - 9 + layer * 10;
      const plan = { x: C.x + 6 + c * 24, y: C.y + 5 + r * 16, w: 22, d: 14 };
      out.push(box(plan, z, 10, layer || count <= 4 ? "m-g" : "", line(seg([plan.x + plan.w / 2, plan.y, z + 10], [plan.x + plan.w / 2, plan.y + plan.d, z + 10]), layer || count <= 4 ? "g" : "mu")));
    }
    // label plate on the crate front
    const short = p.name.split("/").pop();
    out.push(box({ x: C.x + 5, y: fy, w: C.w - 10, d: 1.4 }, 4, 10));
    out.push(faceText("y", fy + 1.4, cx, 7.4, short, { size: Math.min(5.4, 74 / short.length), cls: "mono ink" }));
    // counter on the shelf edge: a bezel with one window per digit
    const digits = String(p.downloads).padStart(4, "0").slice(-6);
    const DW = 7;
    const cw = digits.length * DW + 4;
    const c0 = cx - cw / 2;
    const ey = SHELF.y + SHELF.d;
    out.push(box({ x: c0, y: ey, w: cw, d: 2 }, -SHELF_H + 2, SHELF_H - 4));
    const win = [];
    for (let d = 0; d < digits.length; d++) win.push(poly([[c0 + 2 + d * DW + 0.6, ey + 2, -SHELF_H + 3.2], [c0 + 2 + (d + 1) * DW - 0.6, ey + 2, -SHELF_H + 3.2], [c0 + 2 + (d + 1) * DW - 0.6, ey + 2, -4.2], [c0 + 2 + d * DW + 0.6, ey + 2, -4.2]]));
    out.push(`<path class="hole" d="${win.join("")}"/>`);
    [...digits].forEach((ch, d) => out.push(faceText("y", ey + 2, c0 + 2 + d * DW + DW / 2, -SHELF_H + 4.6, ch, { size: 5.6, cls: `mono ${d >= digits.length - String(p.downloads).length ? "gr" : "muted"}` })));
    points.push(at([C.x + C.w, C.y, CR.h]));
  });

  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${out.join("")}</svg>`, width, height, points };
}
