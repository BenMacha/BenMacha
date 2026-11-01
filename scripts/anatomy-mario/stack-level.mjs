// The tech stack as a Mario item cabinet: a brick cabinet standing on a grass-topped ground
// block, four wooden shelves of item blocks (one per technology, in the colour of its group, with
// its logo and name on a label plate), a coin tag on the rail for each group and a blinking lamp.
// The roof holds a warp pipe and two "?" blocks; a coin bobs above the block used every day.
//
// stackLevel({ shelves, lit, logoMark, label }) → { svg, width, height }
//   shelves: [[{ label, color: "purple" | "blue" | "orange" | "green" | "pink", items: [[name, logo]] }]]

import * as k from "./iso-kit.mjs";
import { esc, fix, toolkit } from "./parts.mjs";

// group colour → material class (assets: mario.css + the .mt-purple rule below)
const MATERIAL = { purple: "purple", blue: "sky", orange: "red", green: "pipe", pink: "q" };
// tag colours on the rail, from the site's palette
const TAG = { purple: "#777bb4", blue: "#5c94fc", orange: "#e52521", green: "#5cb338", pink: "#fbd000" };

export function stackLevel({ shelves, lit = "", logoMark, label = "" }) {
  const CW = 64;
  const CH = 40;
  const CD = 24;
  const GAP = 3;
  const PITCH = CW + GAP;
  const SPLIT = 14;
  const SLOTS = 10;
  const MARGIN = 7;
  const IW = MARGIN * 2 + SLOTS * PITCH - GAP;
  const DEPTH = 46;
  const FRONT = -3;
  const SIDE = 10;
  const BOARD = 4;
  const RAIL_H = 13;
  const ROW = CH + 2 + RAIL_H;
  const BASE0 = 15;
  const baseOf = (row) => BASE0 + (shelves.length - 1 - row) * ROW;
  const TOP = baseOf(0) + CH + 2 + BOARD;
  const CAB = { x: -SIDE, y: -DEPTH, w: IW + SIDE * 2, d: DEPTH, r: 1.5 };
  const GROUND = { x: CAB.x - 30, y: CAB.y - 14, w: CAB.w + 60, d: CAB.d + 40, r: 3 };
  const GROUND_H = 12;

  const W = 840;
  const H = 400;
  const P = k.fitProjection([...k.boxCorners(GROUND, -GROUND_H, 0), ...k.boxCorners(CAB, 0, TOP + 34)], W, H, { pad: 8, azimuth: 84 });
  const { at, S, L, D, slab, poly, halo, block, coinStack } = toolkit(P);
  const frontRect = (y, x0, z0, w, h, r = 1) => k.roundedPlan({ x: x0, y: z0, w, d: h, r }, 2).map(([x, z]) => [x, y, z]);

  const brickLines = (plan, z0, z1, every = 6, face = "y") => {
    const lines = [];
    let row = 0;
    for (let z = z0 + every; z < z1 - 1; z += every, row++) lines.push(k.sideSeam(plan, z, P, 1));
    row = 0;
    for (let z = z0; z < z1 - 1; z += every, row++) {
      const top = Math.min(z + every, z1);
      if (face === "y") for (let x = plan.x + (row % 2 ? 6 : 12); x < plan.x + plan.w - 2; x += 12) lines.push(k.segment([x, plan.y + plan.d, z], [x, plan.y + plan.d, top], P));
      else for (let y = plan.y + (row % 2 ? 6 : 12); y < plan.y + plan.d - 2; y += 12) lines.push(k.segment([plan.x + plan.w, y, z], [plan.x + plan.w, y, top], P));
    }
    return L(lines.join(""), { tone: "lo" });
  };

  function ground() {
    const out = [halo(GROUND, -GROUND_H, GROUND_H)];
    const lines = [k.sideSeam(GROUND, -GROUND_H / 2, P, 3)];
    for (let x = GROUND.x + 10; x < GROUND.x + GROUND.w - 4; x += 16) lines.push(k.segment([x, GROUND.y + GROUND.d, -GROUND_H], [x, GROUND.y + GROUND.d, -GROUND_H / 2], P));
    out.push(`<g class="mt-grass">${S(slab(GROUND, -GROUND_H, GROUND_H, 3, 1), { tone: "hi", crease: "mid", inner: L(lines.join(""), { tone: "lo" }) })}</g>`);
    return out.join("");
  }

  function cabinetBack() {
    const out = [halo(CAB, 0, 4, "s")];
    out.push(S(slab({ x: CAB.x + 3, y: CAB.y + 3, w: CAB.w - 6, d: CAB.d - 4, r: 1 }, 0, 3, 2, 0.3), { tone: "lo" }));
    out.push(S(slab({ x: 0, y: -DEPTH, w: IW, d: 3, r: 0 }, 3, TOP - 3, 1), { tone: "lo" }));
    const left = { x: -SIDE, y: -DEPTH, w: SIDE, d: DEPTH, r: 0.6 };
    out.push(`<g class="mt-brick">${S(slab(left, 3, TOP - 3, 1, 0.4), { tone: "hi", crease: "lo" })}</g>`);
    return out.join("");
  }

  function shelfBoard(row) {
    const base = baseOf(row);
    return `<g class="mt-wood">${S(slab({ x: 0, y: -DEPTH + 3, w: IW, d: DEPTH - 3, r: 0 }, base - BOARD, BOARD, 1), { tone: "hi", crease: "lo" })}</g>`;
  }

  function emptySlots(row, x0) {
    const base = baseOf(row);
    const lines = [];
    for (let x = x0; x + CW - 4 < IW - 4; x += PITCH) lines.push(k.lineOnTop([x + 4, FRONT], [x + 4, -DEPTH + 3], base, P), k.lineOnTop([x + CW - 4, FRONT], [x + CW - 4, -DEPTH + 3], base, P));
    return L(lines.join(""), { tone: "lo" });
  }

  function item(x, row, name, logo, color) {
    const base = baseOf(row);
    const plan = { x, y: FRONT - CD, w: CW, d: CD, r: 0.6 };
    const out = [`<g class="mt-${MATERIAL[color]}">`];
    const rivets = [[x + 2.4, FRONT, base + CH - 2.4], [x + CW - 2.4, FRONT, base + CH - 2.4], [x + 2.4, FRONT, base + 2.4], [x + CW - 2.4, FRONT, base + 2.4]];
    out.push(S(slab(plan, base, CH, 1, 0.5), { tone: "hi", crease: "lo", inner: D(rivets.map(at), { size: 0.6, tone: "hi" }) }));
    out.push("</g>");
    const plate = frontRect(FRONT, x + 5, base + 5, CW - 10, CH - 10, 1.2);
    out.push(`<path class="item-plate" d="${poly(plate)}"/>`);
    const m = k.sideMatrix([x + CW / 2, FRONT], base + CH, P, "left");
    out.push(`<g transform="${m}">${logoMark(logo, -7, 8.2, 14, "item-logo")}<text class="item-name" x="0" y="${CH - 9.4}" text-anchor="middle" font-size="${fix(Math.min(7.2, 82 / name.length))}">${esc(name)}</text></g>`);
    if (name === lit) {
      // the block used every day carries a coin in the corner of its plate
      const c = at([x + CW - 9, FRONT, base + CH - 9]);
      out.push(`<g class="bob"><ellipse cx="${fix(c[0])}" cy="${fix(c[1])}" rx="3.6" ry="5" fill="#fbd000" stroke="#1a1a2e" stroke-width=".9"/><path d="M${fix(c[0])} ${fix(c[1] - 2.6)}v5.2" stroke="#c98a00" stroke-width="1.3"/></g>`);
    }
    return out.join("");
  }

  function divider(x, row) {
    const base = baseOf(row);
    return `<g class="mt-brick">${S(slab({ x: x - 2, y: -DEPTH + 4, w: 4, d: DEPTH - 4 + FRONT, r: 0.3 }, base, CH - 4, 1, 0.3), { tone: "hi", crease: "lo" })}</g>`;
  }

  function rail(row, groups) {
    const base = baseOf(row);
    const out = [];
    const strip = { x: 0, y: -0.4, w: IW, d: 3, r: 0 };
    out.push(`<g class="mt-wood">${S(slab(strip, base - RAIL_H, RAIL_H + 1, 1, 0.3), { tone: "hi", crease: "lo", inner: L(k.sideSeam(strip, base - RAIL_H / 2, P, 1), { tone: "lo" }) })}</g>`);
    for (const g of groups) {
      const text = `${g.label.toUpperCase()} · ${g.items.length}`;
      const w = text.length * 6.2 + 14;
      const tag = frontRect(2.6, g.x0 + 2, base - RAIL_H + 2, w, RAIL_H - 4, 0.6);
      out.push(`<path d="${poly(tag)}" fill="${TAG[g.color]}" stroke="#1a1a2e" stroke-width=".8"/>`);
      const m = k.sideMatrix([g.x0 + 9, 2.6], base - 9.6, P, "left");
      out.push(`<text class="tag-text${g.color === "pink" ? " dark" : ""}" transform="${m}">${esc(text)}</text>`);
      const lamp = at([g.x0 + g.width - 6, 2.6, base - RAIL_H / 2 + 0.5]);
      out.push(`<circle class="lamp" cx="${fix(lamp[0])}" cy="${fix(lamp[1])}" r="1.9" style="animation-delay:${(g.index * 0.9).toFixed(1)}s"/>`);
    }
    return out.join("");
  }

  function roof() {
    const out = [];
    const top = { x: -SIDE, y: -DEPTH, w: IW + SIDE * 2, d: DEPTH + 2.6, r: 0.6 };
    out.push(`<g class="mt-brick">${S(slab(top, TOP - BOARD, BOARD + 4, 1, 0.6), { tone: "hi", crease: "lo", inner: brickLines(top, TOP - BOARD, TOP + 4, 4) })}</g>`);
    const zt = TOP + 4;
    // warp pipe on the left, a pair of "?" blocks and a used block on the right
    const [px, py] = [60, -22];
    out.push(halo({ x: px - 13, y: py - 13, w: 26, d: 26, r: 13 }, zt, 2, "s"));
    out.push(`<g class="mt-pipe">${S(k.cylinder(px, py, 10, zt, 20, P, 32), { tone: "hi", crease: "none", inner: L(k.knurl(px, py, 10, zt, zt + 20, 6, P, 0.6), { tone: "faint" }) })}${S(k.cylinder(px, py, 13, zt + 20, 8, P, 32, 0.5), { tone: "hi", crease: "lo" })}<path class="iso-hole" d="${k.ring(px, py, 9.5, zt + 28, P, 32)}"/></g>`);
    out.push(block([IW - 150, -22, zt], { w: 20, d: 20, h: 18 }, "q"));
    out.push(block([IW - 128, -22, zt], { w: 20, d: 20, h: 18 }, "brick"));
    out.push(block([IW - 106, -22, zt], { w: 20, d: 20, h: 18 }, "q"));
    out.push(coinStack([IW - 60, -22, zt], 3, 7, 2.4));
    return out.join("");
  }

  function rightSide() {
    const side = { x: IW, y: -DEPTH, w: SIDE, d: DEPTH, r: 0.6 };
    return `<g class="mt-brick">${S(slab(side, 3, TOP - BOARD - 3, 1, 0.4), { tone: "hi", crease: "lo", inner: brickLines(side, 3, TOP - BOARD, 6, "x") })}</g>`;
  }

  const body = [ground(), cabinetBack()];
  let groupIndex = 0;
  for (let row = shelves.length - 1; row >= 0; row--) {
    const groups = [];
    let x = MARGIN;
    const parts = [shelfBoard(row)];
    shelves[row].forEach((g, gi) => {
      if (gi > 0) {
        parts.push(divider(x - GAP + SPLIT / 2, row));
        x += SPLIT;
      }
      const x0 = x;
      for (const [name, logo] of g.items) {
        parts.push(item(x, row, name, logo, g.color));
        x += PITCH;
      }
      groups.push({ ...g, x0: x0 - 3, width: x - GAP - x0 + 6, index: groupIndex++ });
    });
    if (x < IW - CW) parts.push(emptySlots(row, x));
    parts.push(rail(row, groups));
    body.push(...parts);
  }
  body.push(roof(), rightSide());

  const css = `.item-plate{fill:#fffaf0;stroke:#1a1a2e;stroke-width:.6px}
.item-logo{fill:#1a1a2e;stroke:none}
.item-name{font-family:var(--font-mono);font-weight:700;fill:#1a1a2e}
.tag-text{font-family:var(--font-pixel);font-size:6.2px;fill:#fff}.tag-text.dark{fill:#1a1a2e}
.mt-purple{--anatomy-paper:#777bb4;--anatomy-face:#777bb4;--anatomy-top:#8d91c8;--anatomy-shade-0:#474a78;--anatomy-shade-1:#53568a;--anatomy-shade-2:#60649c;--anatomy-shade-3:#6c70ab;--anatomy-hi:#1a1a2e;--anatomy-mid:#cfd1f0;--anatomy-lo:#3b3e66;--anatomy-faint:#a9acdc}
.lamp{fill:#fbd000;stroke:#1a1a2e;stroke-width:.6}
@keyframes lamp{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes bob{0%,100%{opacity:1}50%{opacity:.55}}
@media (prefers-reduced-motion:no-preference){.lamp{animation:lamp 3.6s ease-in-out infinite}.bob{animation:bob 1.6s ease-in-out infinite}}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}"><style>${css}</style>${body.join("")}</svg>`;
  return { svg, width: W, height: H };
}
