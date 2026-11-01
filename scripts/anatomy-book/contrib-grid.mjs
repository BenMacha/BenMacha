// The contribution calendar as a machined plate: 53 weeks × 7 days of cells, one per day. A day
// without contributions is a flat cell; the others carry a block whose height grows with the
// count (four levels, the two tallest in green). A ruler strip on the front edge carries a tick per
// week and the month names; a red pin marks today.
//
// contribGrid({ days: [{ date, count }], cuts: [c1, c2, c3], width }) → { svg, width, height, today, tall }
//   cuts: the counts at which a day moves up a level (1..4 as on GitHub).
//   today / tall: screen points of today's pin and of the best day, for callouts.
//
// languageColumns({ languages: [{ name, color, share }], width }) → { svg, width, height }
//   The top languages as square columns on a plate, in their colours, as tall as their share.

import * as k from "./iso-kit.mjs";
import { esc, fitWidth, fix, kit } from "./draw.mjs";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const HEIGHTS = [0, 4, 8, 13, 19];
export const levelOf = (count, cuts) => (count <= 0 ? 0 : count < cuts[0] ? 1 : count < cuts[1] ? 2 : count < cuts[2] ? 3 : 4);

export function contribGrid({ days, cuts, best = "", width = 812 }) {
  const T = 12;
  const B = 9;
  const first = new Date(days[0].date + "T00:00:00Z").getUTCDay();
  const cell = (i) => [Math.floor((i + first) / 7), (i + first) % 7];
  const today = days.length - 1;
  const [tw, tr] = cell(today);
  const COLS = tw + 1;
  const GRID = { x: 0, y: 0, w: COLS * T, d: 7 * T };
  const PLATE = { x: -8, y: -8, w: GRID.w + 16, d: GRID.d + 8 + 16 };
  const PLATE_H = 6;
  const RULER = { x: PLATE.x, y: GRID.d + 2, w: PLATE.w, d: 14 };
  const PIN = HEIGHTS[4] + 22;

  const { P, height } = fitWidth([...k.boxCorners(PLATE, -PLATE_H, 0), [tw * T + T / 2, tr * T + T / 2, PIN + 6], [0, 0, HEIGHTS[4]]], width, { pad: 4, azimuth: 72, elevation: 36 });
  const { at, poly, seg, depth, box, line, faceText, topText } = kit(P);
  const o = at([0, 0, 0]);
  const off = (x, y) => {
    const [sx, sy] = at([x, y, 0]);
    return [fix(sx - o[0]), fix(sy - o[1])];
  };

  // the four block heights, drawn once at the origin and reused
  const defs = HEIGHTS.map((h, n) => (n ? `<g id="cg${n}">${box({ x: -B / 2, y: -B / 2, w: B, d: B }, 0, h, n >= 3 ? "m-g" : "")}</g>` : "")).join("");

  const out = [];
  // base plate with a groove around the grid, and the ruler strip in front
  out.push(box(PLATE, -PLATE_H, PLATE_H, "m-s"));
  out.push(line(poly([[GRID.x - 3, GRID.y - 3, 0], [GRID.x + GRID.w + 3, GRID.y - 3, 0], [GRID.x + GRID.w + 3, GRID.y + GRID.d + 1, 0], [GRID.x - 3, GRID.y + GRID.d + 1, 0]]), "mu"));
  const cells = [];
  for (let w = 0; w <= COLS; w++) cells.push(seg([w * T, 0, 0], [w * T, GRID.d, 0]));
  for (let r = 0; r <= 7; r++) cells.push(seg([0, r * T, 0], [GRID.w, r * T, 0]));
  out.push(line(cells.join(""), "ru"));
  const ticks = [];
  for (let w = 0; w <= COLS; w++) ticks.push(seg([w * T, RULER.y, 0], [w * T, RULER.y + (w % 4 ? 2.5 : 4.5), 0]));
  out.push(line(ticks.join(""), "mu"));
  // corner screws of the plate
  for (const [x, y] of [[PLATE.x + 3.5, PLATE.y + 3.5], [PLATE.x + PLATE.w - 3.5, PLATE.y + 3.5], [PLATE.x + 3.5, PLATE.y + PLATE.d - 3.5], [PLATE.x + PLATE.w - 3.5, PLATE.y + PLATE.d - 3.5]]) {
    const [sx, sy] = at([x, y, 0]);
    out.push(`<circle class="dot" cx="${fix(sx)}" cy="${fix(sy)}" r="1.3"/>`);
  }
  // month names on the ruler, under the week each month starts in
  let last = -9;
  days.forEach((d, i) => {
    if (d.date.slice(8) !== "01") return;
    const [w] = cell(i);
    if (w - last < 3) return;
    last = w;
    out.push(topText(w * T + 1.2, RULER.y + 12.4, 0, MONTHS[Number(d.date.slice(5, 7)) - 1], { size: 7.6, cls: "mono muted", anchor: "start" }));
  });
  // weekday initials on the left of the grid
  ["S", "M", "T", "W", "T", "F", "S"].forEach((c, r) => {
    if (r % 2) out.push(topText(-4.6, r * T + T / 2 + 2, 0, c, { size: 5.6, cls: "mono muted" }));
  });

  // the days, back to front
  const items = [];
  let tall = null;
  let empty = null;
  days.forEach((d, i) => {
    const n = levelOf(d.count, cuts);
    const [w, r] = cell(i);
    if (!n) {
      return;
    }
    const [cx, cy] = [w * T + T / 2, r * T + T / 2];
    const [dx, dy] = off(cx, cy);
    items.push({ key: depth([cx, cy, 0]), svg: `<use href="#cg${n}" x="${dx}" y="${dy}"/>` });
    if (d.date === best) tall = at([cx, cy, HEIGHTS[n]]);
  });
  items.sort((a, b) => a.key - b.key);
  // the callout's empty cell: the one inside the grid (away from the plate edge) with the most
  // empty cells around it, so nothing stands in front of it and it reads as flat
  const level = new Map(days.map((d, i) => [cell(i).join(","), levelOf(d.count, cuts)]));
  const isFree = (w, r) => level.get(`${w},${r}`) === 0;
  let bestScore = -1;
  days.forEach((d, i) => {
    const [w, r] = cell(i);
    if (levelOf(d.count, cuts) || w < 4 || w > COLS - 5 || r < 1 || r > 5) return;
    let score = 0;
    for (let dw = -2; dw <= 2; dw++) for (let dr = -1; dr <= 1; dr++) score += isFree(w + dw, r + dr) ? 1 : 0;
    score += isFree(w, r + 1) && isFree(w + 1, r + 1) ? 3 : 0;
    if (score > bestScore) {
      bestScore = score;
      empty = at([w * T + T / 2, r * T + T / 2, 0]);
    }
  });
  out.push(...items.map((it) => it.svg));

  // the red pin on today's cell
  const [px, py] = [tw * T + T / 2, tr * T + T / 2];
  const base = HEIGHTS[levelOf(days[today].count, cuts)];
  out.push(line(seg([px, py, base], [px, py, PIN]), "r"));
  const flag = [[px, py, PIN], [px + 9, py, PIN - 3], [px, py, PIN - 6]];
  out.push(`<path d="${poly(flag)}" fill="var(--red)" stroke="var(--red)" stroke-width="1" stroke-linejoin="round"/>`);
  const [hx, hy] = at([px, py, PIN]);
  out.push(`<circle cx="${fix(hx)}" cy="${fix(hy)}" r="2" fill="var(--red)"/>`);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><defs>${defs}</defs>${out.join("")}</svg>`;
  return { svg, width, height, today: at([px, py, PIN - 3]), tall, empty, plate: at([PLATE.x + PLATE.w, PLATE.y + PLATE.d, -PLATE_H]) };
}

// ---------------------------------------------------------------- languages as columns
const hex = (c) => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(c || "").trim());
  if (!m) return [139, 139, 139];
  const s = m[1].length === 3 ? [...m[1]].map((ch) => ch + ch).join("") : m[1];
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const mix = (rgb, to, t) => "#" + rgb.map((v, i) => Math.round(v + (to[i] - v) * t).toString(16).padStart(2, "0")).join("");

export function languageColumns({ languages, width = 360 }) {
  const N = Math.max(1, languages.length);
  const PITCH = 34;
  const S = 14;
  const PLATE = { x: -12, y: -12, w: (N - 1) * PITCH + S + 24, d: S + 24 };
  const MAX = 50;
  const MIN = 6;
  const topShare = Math.max(...languages.map((l) => l.share), 1);
  const { P, height } = fitWidth([...k.boxCorners(PLATE, -5, 0), [0, 0, MAX]], width, { pad: 4, azimuth: 76, elevation: 30, below: 32 });
  const { at, box, seg, line } = kit(P);
  const out = [box(PLATE, -5, 5, "m-s")];
  const ticks = [];
  for (let x = PLATE.x + 6; x < PLATE.x + PLATE.w - 2; x += 6) ticks.push(seg([x, PLATE.y + PLATE.d, 0], [x, PLATE.y + PLATE.d - ((x - PLATE.x) % 30 < 1 ? 4 : 2), 0]));
  out.push(line(ticks.join(""), "mu"));
  const text = [];
  languages.forEach((lang, i) => {
    const x = i * PITCH;
    const h = MIN + (MAX - MIN) * (lang.share / topShare);
    const c = hex(lang.color);
    const style = ` style="--t:${mix(c, [255, 255, 255], 0.25)};--s1:${lang.color};--s2:${mix(c, [0, 0, 0], 0.25)};--l:var(--line)"`;
    out.push(box({ x, y: 0, w: S, d: S }, 0, h, "", "", style));
    const [lx, ly] = at([x + S / 2, PLATE.y + PLATE.d, -5]);
    text.push(`<text class="tx ink" x="${fix(lx)}" y="${fix(ly + 15)}" font-size="10.5" text-anchor="middle">${esc(lang.name)}</text><text class="mono muted" x="${fix(lx)}" y="${fix(ly + 27)}" font-size="9.5" text-anchor="middle">${lang.share.toFixed(1)}%</text>`);
  });
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${out.join("")}${text.join("")}</svg>`, width, height };
}
