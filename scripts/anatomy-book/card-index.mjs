// The open source contributions as a card index: a cabinet on a plinth with one drawer per
// contributed project, pulled out. Each pull request is an index card standing in its drawer,
// oldest at the back, with a tab on top: green when merged, red while under review. The front card
// of each drawer carries the latest pull request (number, scope and title). The drawer front holds
// a label with the project's logo, name and counts, and a pull.
//
// cardIndex({ projects: [{ name, logo, merged, review, prs: [{ number, title, state }] }], logoMark, width })
//   → { svg, width, height, points: { drawer, merged, review, front } }

import * as k from "./iso-kit.mjs";
import { esc, fitWidth, fix, kit } from "./draw.mjs";

// "[Form] Fix x" or "fix(doctrine): fix x" → ["Form", "Fix x"]
export function scopeOf(title) {
  let m = /^\[([^\]]+)\]\s*(.+)$/.exec(title);
  if (m) return [m[1], m[2]];
  m = /^(?:feat|fix|chore|docs|refactor|test|ci|perf|build|style)(?:\(([^)]+)\))?!?:\s*(.+)$/.exec(title);
  if (m) return [m[1] || "", m[2]];
  m = /^([\w/-]+):\s*(.+)$/.exec(title);
  if (m) return [m[1], m[2]];
  return ["", title];
}

// Splits a title into at most `lines` lines of `size` characters, the last one ending with "…" if cut.
function wrap(text, size, lines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const out = [];
  let cur = "";
  while (words.length && out.length < lines) {
    const w = words[0];
    if (!cur) {
      cur = w.length > size ? w.slice(0, size - 1) + "…" : w;
      words.shift();
    } else if ((cur + " " + w).length <= size) {
      cur += " " + words.shift();
    } else {
      out.push(cur);
      cur = "";
    }
  }
  if (cur && out.length < lines) out.push(cur);
  if (words.length && out.length) out[out.length - 1] = out[out.length - 1].replace(/[ .,;:]*$/, "").slice(0, size - 1) + "…";
  return out;
}

export function cardIndex({ projects, logoMark, width = 796 }) {
  const n = Math.max(1, projects.length);
  const rows = n > 3 ? 2 : 1;
  const cols = Math.ceil(n / rows);
  const DW = 150;
  const IW = 136;
  const DEPTH = 64;
  const CAB_H = 50;
  const PULL = 44;
  const TRAY_Z = 8;
  const WALL = 16;
  const CARD_Z0 = TRAY_Z + 2;
  const CARD_Z1 = 58;
  const FRONT_Z = 30;
  const MAXCARDS = 14;
  // two tiers like a card catalogue on a stand: the back tier stands higher, its drawers over the front cabinet
  const TIERS = [
    { Y: -100, Z: 58, list: projects.slice(cols) },
    { Y: 0, Z: 0, list: projects.slice(0, cols) },
  ].filter((t) => t.list.length);
  const W0 = cols * DW + 2;
  const FOOT = { x: -14, y: (rows > 1 ? -100 : 0) - DEPTH - 6, w: W0 + 20, d: (rows > 1 ? 100 : 0) + DEPTH + PULL + 16 };

  const { P, height } = fitWidth([...k.boxCorners(FOOT, -10, 0), [-8, FOOT.y, (rows > 1 ? 58 : 0) + CAB_H + 4], [0, PULL, CARD_Z1 + 6], [W0, -100 + PULL, 58 + CARD_Z1 + 6]], width, { pad: 6, azimuth: 70, elevation: 26 });
  const { at, poly, seg, box, line, faceText } = kit(P);
  const rectY = (y, x0, z0, w, h) => poly([[x0, y, z0], [x0 + w, y, z0], [x0 + w, y, z0 + h], [x0, y, z0 + h]]);
  const out = [];

  // plinth on feet under both tiers
  for (const x of [FOOT.x + 10, FOOT.x + FOOT.w - 22]) out.push(box({ x, y: FOOT.y + FOOT.d - 14, w: 12, d: 8 }, -10, 4, "m-s"));
  out.push(box(FOOT, -6, 6, "m-s"));

  const points = {};
  for (const { Y, Z, list } of TIERS) {
    const CAB = { x: -8, y: Y - DEPTH, w: W0, d: DEPTH };
    const H = Z + CAB_H;
    const openings = list.map((_, i) => `<path class="hole" d="${rectY(Y, i * DW + 5, Z + TRAY_Z - 2, IW + 4, WALL + 6)}"/>`).join("");
    const screws = [];
    for (let i = 0; i <= cols; i++) {
      const [sx, sy] = at([i * DW - 1, Y, H - 6]);
      screws.push(`<circle class="dot" cx="${fix(sx)}" cy="${fix(sy)}" r="1"/>`);
    }
    out.push(box(CAB, 0, H, "", openings + screws.join("") + line(seg([CAB.x, Y, H - 12], [CAB.x + CAB.w, Y, H - 12]), "ru")));
    out.push(box({ x: CAB.x - 3, y: CAB.y - 3, w: CAB.w + 6, d: CAB.d + 5 }, H, 4));

    list.forEach((p, i) => {
      const x0 = i * DW + 7;
      const prs = [...(p.prs || [])].sort((a, b) => a.number - b.number).slice(-MAXCARDS);
      out.push(box({ x: x0, y: Y, w: IW, d: PULL }, Z + TRAY_Z - 2, 2, "m-s"));
      out.push(box({ x: x0, y: Y, w: 2, d: PULL }, Z + TRAY_Z, WALL));
      const c = prs.length;
      const span = PULL - 10;
      prs.forEach((pr, j) => {
        const y = Y + 4 + (c > 1 ? (span * j) / (c - 1) : span);
        const cx0 = x0 + 6;
        const cw = IW - 12;
        const tabX = cx0 + 6 + (j % 4) * 26;
        const merged = pr.state === "merged";
        const tab = rectY(y, tabX, Z + CARD_Z1, 22, 5);
        const card = rectY(y, cx0, Z + CARD_Z0, cw, CARD_Z1 - CARD_Z0);
        out.push(`<path style="fill:var(--top)" d="${card}"/><path class="ln" d="${card}"/>`);
        out.push(`<path d="${tab}" fill="var(${merged ? "--g-top" : "--r-top"})" stroke="var(${merged ? "--green" : "--red"})" stroke-width="1.1" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`);
        if (merged && !points.merged) points.merged = at([tabX + 11, y, Z + CARD_Z1 + 5]);
        if (!merged && !points.review && Z === 0 && i > 0) points.review = at([tabX + 11, y, Z + CARD_Z1 + 5]);
        if (j === c - 1) {
          // the latest pull request, written on the front card
          const [scope, title] = scopeOf(pr.title);
          out.push(faceText("y", y, cx0 + 5, Z + CARD_Z1 - 8, `#${pr.number}${scope ? " · " + scope : ""}`, { size: 6, cls: `mono ${merged ? "gr" : "rd"}`, anchor: "start" }));
          wrap(title, 31, 2).forEach((t, li) => out.push(faceText("y", y, cx0 + 5, Z + CARD_Z1 - 18 - li * 8.6, t, { size: 7, cls: "tx ink", anchor: "start" })));
          out.push(line(seg([cx0 + 5, y, Z + CARD_Z1 - 11.5], [cx0 + cw - 5, y, Z + CARD_Z1 - 11.5]), "ru"));
          if (!points.front && Z === 0) points.front = at([cx0 + cw - 10, y, Z + CARD_Z1 - 22]);
        }
      });
      out.push(box({ x: x0 + IW - 2, y: Y, w: 2, d: PULL }, Z + TRAY_Z, WALL));
      const fy = Y + PULL + 3;
      const holder = rectY(fy, x0 + 6, Z + 13, IW - 12, 14);
      out.push(box({ x: x0 - 2, y: Y + PULL, w: IW + 4, d: 3 }, Z + TRAY_Z - 4, FRONT_Z - TRAY_Z + 4, "", `<path class="ln" d="${holder}"/>`));
      const m = k.sideMatrix([x0 + 10, fy], Z + 26.5, P, "left");
      out.push(`<g transform="${m}">${logoMark(p.logo || "repo", 0, 0.5, 11, "logo")}</g>`);
      const name = p.name.length > 20 ? p.name.slice(0, 19) + "…" : p.name;
      out.push(faceText("y", fy, x0 + 25, Z + 18.8, name, { size: 7.6, cls: "h ink", anchor: "start" }));
      out.push(faceText("y", fy, x0 + 25, Z + 14.6, `${p.merged} merged · ${p.review} in review`, { size: 5.6, cls: "mono muted", anchor: "start" }));
      out.push(box({ x: x0 + IW / 2 - 12, y: fy, w: 24, d: 3 }, Z + TRAY_Z - 1, 3.4));
      if (Z === 0 && !points.drawer) points.drawer = at([x0 + 6, fy, Z + 27]);
    });
  }
  points.review ||= points.front;
  points.merged ||= points.front;
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${out.join("")}</svg>`, width, height, points };
}
