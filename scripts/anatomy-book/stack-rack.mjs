// The tech stack as an equipment rack: a cabinet on a plinth with four shelves of modules, one per
// technology, each with its logo and name on a front plate and a status lamp. A rail under every
// shelf carries the section tag (number, name, count), a divider separates two sections sharing a
// shelf, and the lamp of the tool used every day is lit green.
//
// stackRack({ shelves, lit, logoMark, width }) → { svg, width, height, litPoint }
//   shelves: [[{ label, items: [[name, logo]] }]] (top shelf first)

import * as k from "./iso-kit.mjs";
import { esc, fitWidth, fix, kit } from "./draw.mjs";

export function stackRack({ shelves, lit = "", logoMark, width = 796 }) {
  const CW = 62;
  const CH = 38;
  const CD = 22;
  const GAP = 4;
  const PITCH = CW + GAP;
  const SPLIT = 16;
  const SLOTS = 10;
  const MARGIN = 8;
  const IW = MARGIN * 2 + SLOTS * PITCH - GAP;
  const DEPTH = 40;
  const SIDE = 10;
  const BOARD = 3;
  const RAIL_H = 13;
  const ROW = CH + 4 + RAIL_H;
  const BASE0 = 22;
  const baseOf = (row) => BASE0 + (shelves.length - 1 - row) * ROW;
  const TOP = baseOf(0) + CH + 6;
  const PLINTH = { x: -SIDE - 6, y: -DEPTH - 6, w: IW + SIDE * 2 + 12, d: DEPTH + 14 };

  const { P, height } = fitWidth([...k.boxCorners(PLINTH, -8, 0), ...k.boxCorners({ x: -SIDE, y: -DEPTH, w: IW + 2 * SIDE, d: DEPTH }, 0, TOP + 6)], width, { pad: 4, azimuth: 82, elevation: 24 });
  const { at, poly, seg, box, line, faceText } = kit(P);
  const out = [];

  // plinth on feet, back panel, left side
  for (const x of [PLINTH.x + 10, PLINTH.x + PLINTH.w - 22]) out.push(box({ x, y: PLINTH.y + PLINTH.d - 12, w: 12, d: 8 }, -12, 4, "m-s"));
  out.push(box(PLINTH, -8, 8, "m-s"));
  out.push(line(seg([PLINTH.x, PLINTH.y + PLINTH.d, -4], [PLINTH.x + PLINTH.w, PLINTH.y + PLINTH.d, -4]), "ru"));
  out.push(box({ x: 0, y: -DEPTH, w: IW, d: 2 }, 0, TOP, "m-s"));
  out.push(box({ x: -SIDE, y: -DEPTH, w: SIDE, d: DEPTH }, 0, TOP));

  const rows = [];
  let tagNo = 0;
  let litPoint = null;
  shelves.forEach((groups, row) => {
    const base = baseOf(row);
    const parts = [];
    // shelf board
    parts.push(box({ x: 0, y: -DEPTH + 2, w: IW, d: DEPTH - 2 }, base - BOARD, BOARD, "m-s"));
    let x = MARGIN;
    const tags = [];
    groups.forEach((g, gi) => {
      if (gi > 0) {
        parts.push(box({ x: x - GAP + SPLIT / 2 - 1.5, y: -DEPTH + 4, w: 3, d: DEPTH - 6 }, base, CH));
        x += SPLIT;
      }
      const x0 = x;
      for (const [name, logo] of g.items) {
        const plan = { x, y: -CD - 1, w: CW, d: CD };
        const front = plan.y + plan.d;
        const plate = poly([[x + 4, front, base + 4], [x + CW - 4, front, base + 4], [x + CW - 4, front, base + CH - 4], [x + 4, front, base + CH - 4]]);
        const screws = [[x + 2, base + 2], [x + CW - 2, base + 2], [x + 2, base + CH - 2], [x + CW - 2, base + CH - 2]]
          .map(([u, z]) => at([u, front, z]))
          .map(([sx, sy]) => `<circle class="dot" cx="${fix(sx)}" cy="${fix(sy)}" r=".8"/>`)
          .join("");
        const m = k.sideMatrix([x + CW / 2, front], base + CH, P, "left");
        const lamp = at([x + CW - 8, front, base + CH - 8]);
        const on = name === lit;
        parts.push(box(plan, base, CH, "", `<path class="ln ru" d="${plate}"/>${screws}`));
        parts.push(`<g transform="${m}">${logoMark(logo, -7, 6.5, 14, "logo")}<text class="tx ink" x="0" y="${CH - 8.5}" text-anchor="middle" font-size="${fix(Math.min(8.2, 92 / name.length))}">${esc(name)}</text></g>`);
        parts.push(`<circle class="${on ? "dot g lamp" : "co"}" cx="${fix(lamp[0])}" cy="${fix(lamp[1])}" r="${on ? 2.2 : 1.6}"/>`);
        if (on) litPoint = lamp;
        x += PITCH;
      }
      tags.push({ label: g.label, n: g.items.length, x0, x1: x - GAP, no: ++tagNo });
    });
    // empty slots: guide lines on the board
    const guides = [];
    for (let gx = x; gx + CW <= IW - MARGIN + 1; gx += PITCH) guides.push(k.lineOnTop([gx + 4, -2], [gx + 4, -DEPTH + 4], base, P), k.lineOnTop([gx + CW - 4, -2], [gx + CW - 4, -DEPTH + 4], base, P));
    parts.push(line(guides.join(""), "ru"));
    // rail with the section tags: a numbered ring, the name and the count, and a section rule
    const strip = { x: 0, y: -1, w: IW, d: 2 };
    parts.push(box(strip, base - RAIL_H, RAIL_H - BOARD));
    for (const t of tags) {
      const [cx, cy] = at([t.x0 + 6, 1, base - RAIL_H / 2 - 1.5]);
      parts.push(`<circle class="co" cx="${fix(cx)}" cy="${fix(cy)}" r="5"/><text class="mono ink2" x="${fix(cx)}" y="${fix(cy + 2.6)}" font-size="7" text-anchor="middle">${t.no}</text>`);
      parts.push(faceText("y", 1, t.x0 + 15, base - RAIL_H / 2 - 4.2, `${t.label.toUpperCase()} · ${t.n}`, { size: 6.6, cls: "mono ink2", anchor: "start" }));
      parts.push(line(seg([t.x0 + 15 + (t.label.length + 4) * 4.2, 1, base - RAIL_H / 2 - 1.6], [t.x1 - 2, 1, base - RAIL_H / 2 - 1.6]), t.no % 2 ? "r" : "g"));
    }
    rows.push(parts.join(""));
  });
  // bottom rows first: they sit behind the rails of the rows above on screen
  out.push(...rows.reverse());

  // top panel and right side
  out.push(box({ x: -SIDE, y: -DEPTH, w: IW + SIDE * 2, d: DEPTH + 1 }, TOP - 4, 6));
  const holes = [];
  for (let z = 8; z < TOP - 8; z += 6) holes.push(at([IW + SIDE, -6, z]));
  out.push(box({ x: IW, y: -DEPTH, w: SIDE, d: DEPTH }, 0, TOP - 4, "", holes.map(([sx, sy]) => `<circle class="dot" cx="${fix(sx)}" cy="${fix(sy)}" r=".7"/>`).join("")));

  const css = `@keyframes lamp{0%,100%{opacity:1}50%{opacity:.35}}@media (prefers-reduced-motion:no-preference){.lamp{animation:lamp 2.4s ease-in-out infinite}}`;
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><style>${css}</style>${out.join("")}</svg>`, width, height, litPoint };
}
