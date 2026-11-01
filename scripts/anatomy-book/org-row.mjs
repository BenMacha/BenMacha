// The organizations as three small buildings on one base plate, linked by dashed paths:
// Pepprio is a restaurant with a striped awning, a service counter and a till (restaurant order
// management); Pignelle a real-estate agency under a gable roof with a "for sale" board in front;
// the personal workshop a shed with a roller door and a workbench with a screen and a lamp.
// Each building carries its name plate.
//
// orgRow({ kinds: ["restaurant" | "agency" | "workshop"], plates: [name plate text], width }) → { svg, width, height, points }
//   one building per entry, left to right; points: the top of each building, for callouts.

import * as k from "./iso-kit.mjs";
import { fitWidth, fix, kit } from "./draw.mjs";

export function orgRow({ kinds = ["restaurant", "agency", "workshop"], plates = [], width = 560 } = {}) {
  const SLOT = 100;
  const n = Math.max(1, kinds.length);
  const BASE = { x: -(n * SLOT) / 2, y: -56, w: n * SLOT, d: 116 };
  const REST_H = 36;
  const AG_H = 30;
  const RIDGE = 18;
  const SHOP_H = 34;

  const { P, height } = fitWidth([...k.boxCorners(BASE, -7, 0), [BASE.x + 20, -18, AG_H + RIDGE + 4], [BASE.x + 20, -40, REST_H + 10]], width, { pad: 6, azimuth: 52 });
  const { at, poly, seg, box, cyl, line, faceText } = kit(P);
  const dot = ([x, y, z], r = 1, cls = "dot") => {
    const [sx, sy] = at([x, y, z]);
    return `<circle class="${cls}" cx="${fix(sx)}" cy="${fix(sy)}" r="${r}"/>`;
  };
  const rectY = (y, x0, z0, w, h) => poly([[x0, y, z0], [x0 + w, y, z0], [x0 + w, y, z0 + h], [x0, y, z0 + h]]);
  const rectX = (x, y0, z0, d, h) => poly([[x, y0, z0], [x, y0 + d, z0], [x, y0 + d, z0 + h], [x, y0, z0 + h]]);
  const out = [];

  // base plate, kerb line, corner screws, dashed paths between the doors
  out.push(box(BASE, -7, 7, "m-s"));
  out.push(line(poly([[BASE.x + 6, BASE.y + 6, 0], [BASE.x + BASE.w - 6, BASE.y + 6, 0], [BASE.x + BASE.w - 6, BASE.y + BASE.d - 6, 0], [BASE.x + 6, BASE.y + BASE.d - 6, 0]]), "ru"));
  out.push(line(seg([BASE.x + 10, 44, 0], [BASE.x + BASE.w - 10, 44, 0]), "ru"));
  for (const [x, y] of [[BASE.x + 3, BASE.y + 3], [BASE.x + BASE.w - 3, BASE.y + 3], [BASE.x + 3, BASE.y + BASE.d - 3], [BASE.x + BASE.w - 3, BASE.y + BASE.d - 3]]) out.push(dot([x, y, 0], 1.2));
  const GROUND = out.length;
  const path = (pts, cls) => line(k.pathOf(pts.map(at)), `${cls} flow`);

  // ---------------------------------------------------------------- restaurant
  function restaurant(x0, plate) {
    const B = { x: x0, y: -40 + 4, w: 66, d: 46 };
    const fy = B.y + B.d;
    const face = [];
    face.push(`<path class="ln" d="${rectY(fy, B.x + 8, 0, 14, 19)}"/>`); // door
    face.push(dot([B.x + 19, fy, 10], 0.9));
    face.push(`<path class="ln" d="${rectY(fy, B.x + 28, 7, 30, 12)}${seg([B.x + 43, fy, 7], [B.x + 43, fy, 19])}"/>`); // window
    face.push(`<path class="ln ru" d="${rectX(B.x + B.w, B.y + 8, 10, 14, 12)}${rectX(B.x + B.w, B.y + 26, 10, 14, 12)}"/>`);
    out.push(box(B, 0, REST_H, "", face.join("")));
    out.push(box({ x: B.x - 1, y: B.y - 1, w: B.w + 2, d: B.d + 2 }, REST_H, 3));
    // name plate on the parapet
    out.push(box({ x: B.x + 14, y: fy, w: 38, d: 2 }, REST_H - 8.5, 8));
    out.push(faceText("y", fy + 2, B.x + 33, REST_H - 6.6, plate, { size: Math.min(6.6, 44 / plate.length), cls: "h rd" }));
    // striped awning over the door and window, with its valance
    const z0 = 24;
    const z1 = 18;
    const ax0 = B.x + 4;
    const ax1 = B.x + B.w - 4;
    const ay = fy + 13;
    const stripes = [];
    for (let x = ax0 + 6; x < ax1 - 1; x += 6) stripes.push(seg([x, fy, z0], [x, ay, z1]), seg([x, ay, z1], [x, ay, z1 - 3]));
    out.push(`<g class="bx m-r"><path class="tp" d="${poly([[ax0, fy, z0], [ax1, fy, z0], [ax1, ay, z1], [ax0, ay, z1]])}"/><path class="f2" d="${poly([[ax0, ay, z1], [ax1, ay, z1], [ax1, ay, z1 - 3], [ax0, ay, z1 - 3]])}"/><path class="ln r" d="${stripes.join("")}"/><path class="ed" d="${poly([[ax0, fy, z0], [ax1, fy, z0], [ax1, ay, z1], [ax1, ay, z1 - 3], [ax0, ay, z1 - 3], [ax0, ay, z1]])}"/></g>`);
    // service counter with a till, and a bistro table
    out.push(box({ x: B.x + 26, y: fy + 16, w: 34, d: 9 }, 0, 11, "", `<path class="ln ru" d="${seg([B.x + 26, fy + 25, 7], [B.x + 60, fy + 25, 7])}"/>`));
    out.push(box({ x: B.x + 46, y: fy + 17, w: 9, d: 6 }, 11, 5, "m-g"));
    out.push(line(seg([B.x + 47.5, fy + 23, 13.5], [B.x + 53.5, fy + 23, 13.5]), "g"));
    out.push(cyl(B.x + 12, fy + 22, 1, 0, 10));
    out.push(cyl(B.x + 12, fy + 22, 7, 10, 1.6));
    return { door: B.x + 30, front: B.y + B.d, top: at([B.x + 8, B.y + 0, REST_H + 3]) };
  }
  // ---------------------------------------------------------------- agency
  function agency(x0, plate) {
    const B = { x: x0, y: -40 + 0, w: 58, d: 44 };
    const fy = B.y + B.d;
    const face = [];
    face.push(`<path class="ln" d="${rectY(fy, B.x + 22, 0, 14, 21)}"/>`);
    face.push(dot([B.x + 33, fy, 10], 0.9));
    for (const x of [B.x + 6, B.x + 42]) face.push(`<path class="ln" d="${rectY(fy, x, 9, 10, 12)}${seg([x + 5, fy, 9], [x + 5, fy, 21])}${seg([x, fy, 15], [x + 10, fy, 15])}"/>`);
    face.push(`<path class="ln ru" d="${rectX(B.x + B.w, B.y + 12, 9, 10, 12)}${rectX(B.x + B.w, B.y + 26, 9, 10, 12)}"/>`);
    out.push(box(B, 0, AG_H, "", face.join("")));
    // gable roof: front slope and the gable end, red
    const o = 3;
    const mid = B.y + B.d / 2;
    const zt = AG_H + RIDGE;
    const front = [[B.x - o, fy + o, AG_H - 2], [B.x + B.w + o, fy + o, AG_H - 2], [B.x + B.w + o, mid, zt], [B.x - o, mid, zt]];
    const gable = [[B.x + B.w, B.y, AG_H], [B.x + B.w, fy, AG_H], [B.x + B.w, mid, zt - 2]];
    const tiles = [];
    for (let t = 1; t < 4; t++) tiles.push(seg([B.x - o, fy + o - (fy + o - mid) * (t / 4), AG_H - 2 + (zt - AG_H + 2) * (t / 4)], [B.x + B.w + o, fy + o - (fy + o - mid) * (t / 4), AG_H - 2 + (zt - AG_H + 2) * (t / 4)]));
    out.push(`<g class="bx m-r"><path class="f2" d="${poly(gable)}"/><path class="tp" d="${poly(front)}"/><path class="ln r" d="${tiles.join("")}"/><path class="ed" d="${poly(front)}${poly(gable)}"/></g>`);
    const [cx0, cy0] = at([B.x + B.w + o, mid, zt]);
    out.push(`<circle class="dot r" cx="${fix(cx0)}" cy="${fix(cy0)}" r="1.4"/>`);
    // name plate over the door
    out.push(box({ x: B.x + 14, y: fy + 1, w: 30, d: 2 }, 22.5, 6.5));
    out.push(faceText("y", fy + 3, B.x + 29, 24.2, plate, { size: Math.min(5.4, 34 / plate.length), cls: "h ink" }));
    // "for sale" board on a post in front
    const [bx, by] = [B.x + 6, fy + 18];
    out.push(cyl(bx, by, 0.9, 0, 22));
    out.push(line(seg([bx, by, 20], [bx + 18, by, 20])));
    out.push(box({ x: bx + 3, y: by - 1, w: 15, d: 2 }, 9, 10, "m-r"));
    out.push(faceText("y", by + 1, bx + 10.5, 12.4, "SALE", { size: 4.6, cls: "mono rd" }));
    return { door: B.x + 29, front: B.y + B.d, top: at([B.x + 29, B.y + 22, AG_H + RIDGE]) };
  }
  // ---------------------------------------------------------------- workshop
  function workshop(x0, plate) {
    const B = { x: x0, y: -40 + 0, w: 74, d: 48 };
    const fy = B.y + B.d;
    const face = [];
    const slats = [];
    for (let z = 4; z < 26; z += 3) slats.push(seg([B.x + 6, fy, z], [B.x + 40, fy, z]));
    face.push(`<path class="ln" d="${rectY(fy, B.x + 6, 0, 34, 27)}"/><path class="ln ru" d="${slats.join("")}"/>`);
    face.push(`<path class="ln" d="${rectY(fy, B.x + 48, 10, 20, 15)}${seg([B.x + 58, fy, 10], [B.x + 58, fy, 25])}"/>`);
    face.push(`<path class="ln ru" d="${rectX(B.x + B.w, B.y + 10, 0, 14, 24)}"/>`);
    out.push(box(B, 0, SHOP_H, "", face.join("")));
    out.push(box({ x: B.x - 1, y: B.y - 1, w: B.w + 2, d: B.d + 2 }, SHOP_H, 2.5));
    // a vent and a small chimney on the roof
    out.push(box({ x: B.x + 12, y: B.y + 10, w: 12, d: 10 }, SHOP_H + 2.5, 4));
    out.push(cyl(B.x + 58, B.y + 14, 3.4, SHOP_H + 2.5, 10));
    // name plate
    out.push(box({ x: B.x + 8, y: fy + 1, w: 40, d: 2 }, 28, 5.5));
    out.push(faceText("y", fy + 3, B.x + 28, 29.4, plate, { size: Math.min(4.4, 64 / plate.length), cls: "mono ink" }));
    // workbench with a screen, a keyboard and a lamp
    const [wx, wy] = [B.x + 44, fy + 14];
    for (const [x, y] of [[wx + 1, wy + 1], [wx + 25, wy + 1], [wx + 1, wy + 9], [wx + 25, wy + 9]]) out.push(box({ x, y, w: 2, d: 2 }, 0, 12));
    out.push(box({ x: wx, y: wy, w: 28, d: 12 }, 12, 2));
    out.push(box({ x: wx + 8, y: wy + 2, w: 3, d: 3 }, 14, 4));
    out.push(box({ x: wx + 3, y: wy + 3, w: 14, d: 1.5 }, 17, 11, "", `<path class="hole" d="${rectY(wy + 4.5, wx + 4.2, 18.2, 11.6, 8.6)}"/>`));
    out.push(faceText("y", wy + 4.6, wx + 10, 20.6, "</>", { size: 4.6, cls: "mono gr" }));
    out.push(box({ x: wx + 4, y: wy + 7.5, w: 11, d: 3.5 }, 14, 0.8));
    out.push(line(k.pathOf([at([wx + 23, wy + 4, 14]), at([wx + 23, wy + 4, 24]), at([wx + 18, wy + 6, 27])]), ""));
    out.push(cyl(wx + 23, wy + 4, 2.4, 14, 1));
    out.push(dot([wx + 18, wy + 6, 26.5], 2, "dot g"));
    return { door: B.x + 26, front: B.y + B.d, top: at([B.x + 64, B.y + 6, SHOP_H + 2.5]) };
  }
  // the buildings left to right, then dashed paths between their doors along the street
  const draw = { restaurant, agency, workshop };
  const buildings = kinds.map((kind, i) => (draw[kind] || workshop)(BASE.x + 10 + i * SLOT + (kind === "agency" ? 12 : 0), String(plates[i] ?? "")));
  const paths = [];
  buildings.forEach((b, i) => {
    if (!i) return;
    const a = buildings[i - 1];
    paths.push(path([[a.door, a.front + 2, 0], [a.door, 36, 0], [b.door, 36, 0], [b.door, b.front + 2, 0]], i % 2 ? "g" : "r"));
  });
  // the paths lie on the plate: draw them right after it
  out.splice(GROUND, 0, ...paths);

  const points = buildings.map((b) => b.top);
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${out.join("")}</svg>`, width, height, points };
}
