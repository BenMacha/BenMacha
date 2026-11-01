// The look of the profile figures: the "technical book" of benmacha.tn. Isometric line drawings
// with flat light fills, neutral greys, Pepprio red and green accents, numbered callouts, a running
// head on top and a "Fig. N — …" caption under a thin rule, in a 14 px rounded frame.
//
// GitHub shows README images through <img>, so the theme follows prefers-color-scheme: the night
// palette by default and the day palette under (prefers-color-scheme: light). Latin subsets of
// Nunito ExtraBold, Mulish Regular and Bold and JetBrains Mono Regular are embedded (SIL Open Font
// License 1.1, see fonts/OFL-*.txt).

import { readFileSync } from "node:fs";

const here = (name) => new URL(name, import.meta.url);
const font = (file) => readFileSync(here(`./fonts/${file}`)).toString("base64");
const FACES = [
  ["Nunito", 800, "Nunito-ExtraBold-latin.woff2"],
  ["Mulish", 400, "Mulish-Regular-latin.woff2"],
  ["Mulish", 700, "Mulish-Bold-latin.woff2"],
  ["JetBrains Mono", 400, "JetBrainsMono-Regular-latin.woff2"],
]
  .map(([family, weight, file]) => `@font-face{font-family:"${family}";font-weight:${weight};src:url(data:font/woff2;base64,${font(file)}) format("woff2");font-display:block}`)
  .join("");

// Night (default) and day tokens of the site, plus the drawing tokens (line, slab, faces, accent tints).
const NIGHT = `--panel:#141922;--ink:#eef1f5;--ink2:#b6bdc8;--muted:#8a93a3;--rule:#252c38;--line:#c9d1dd;--slab:#161c26;
--top:#1c2330;--side:#121822;--side2:#0f141c;--hole:#0b0f15;--red-ink:#ff5d52;--green-ink:#7bc313;
--g-top:#1f2c14;--g-side:#19240f;--g-side2:#141d0c;--r-top:#2c1718;--r-side:#241315;--r-side2:#1d0f11`;
const DAY = `--panel:#fff;--ink:#14171c;--ink2:#3d434d;--muted:#5f6672;--rule:#dcdcd6;--line:#14171c;--slab:#ecece6;
--top:#fff;--side:#f1f1ec;--side2:#e4e4dc;--hole:#d6d6ce;--red-ink:#c4261e;--green-ink:#3d7a00;
--g-top:#eef7df;--g-side:#e1efca;--g-side2:#d3e6b4;--r-top:#fdeceb;--r-side:#f9dcda;--r-side2:#f2c9c6`;
const FIXED = `--red:#ec3b33;--green:#7bc313;--f-head:Nunito,"Segoe UI",system-ui,sans-serif;--f-text:Mulish,"Segoe UI",system-ui,sans-serif;
--f-mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`;

export const CSS = `${FACES}
.bk{${FIXED};${NIGHT}}
@media (prefers-color-scheme:light){.bk{${DAY}}}
.frame{fill:var(--panel);stroke:var(--rule);stroke-width:1}
.rule{stroke:var(--rule);stroke-width:1}
.h{font-family:var(--f-head);font-weight:800}.tx{font-family:var(--f-text)}.b{font-family:var(--f-text);font-weight:700}.mono{font-family:var(--f-mono)}
.ink{fill:var(--ink)}.ink2{fill:var(--ink2)}.muted{fill:var(--muted)}.rd{fill:var(--red-ink)}.gr{fill:var(--green-ink)}
.logo{fill:var(--ink);stroke:none}
.bx{--t:var(--top);--s1:var(--side);--s2:var(--side2);--l:var(--line)}
.bx.m-s{--t:var(--slab);--s1:var(--side);--s2:var(--side2)}
.bx.m-g{--t:var(--g-top);--s1:var(--g-side);--s2:var(--g-side2);--l:var(--green)}
.bx.m-r{--t:var(--r-top);--s1:var(--r-side);--s2:var(--r-side2);--l:var(--red)}
.bx.m-o{--l:var(--red)}
.f1{fill:var(--s2)}.f2{fill:var(--s1)}.tp{fill:var(--t)}.hole{fill:var(--hole)}
.ed{fill:none;stroke:var(--l);stroke-width:1.3;stroke-linejoin:round;stroke-linecap:round}
.ln{fill:none;stroke:var(--line);stroke-width:.8;stroke-linecap:round;stroke-linejoin:round}
.ln.mu{stroke:var(--muted)}.ln.ru{stroke:var(--rule)}.ln.g{stroke:var(--green);stroke-width:1.3}.ln.r{stroke:var(--red);stroke-width:1.3}
.ed,.ln,.frame,.rule,.lead{vector-effect:non-scaling-stroke}
.lead{fill:none;stroke:var(--muted);stroke-width:.9}
.co{fill:var(--panel);stroke:var(--muted);stroke-width:.9}
.dot{fill:var(--line)}.dot.g{fill:var(--green)}.dot.r{fill:var(--red)}
.flow{stroke-dasharray:4 4}
@keyframes flow{to{stroke-dashoffset:-16}}
@media (prefers-reduced-motion:no-preference){.flow{animation:flow 1.6s linear infinite}}`;

export const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Places a drawing built by one of the scene modules (an <svg viewBox> string) at x, y, width w.
export function place(svg, x, y, w) {
  const [, vw, vh] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const h = (w * vh) / vw;
  return {
    h,
    svg: svg.replace(/^<svg [^>]*?viewBox="0 0 ([\d.]+) ([\d.]+)"[^>]*>/, (_m, a, b) => `<svg x="${x}" y="${y}" width="${w}" height="${Math.round(h * 100) / 100}" viewBox="0 0 ${a} ${b}" overflow="visible">`),
  };
}

// The book page: rounded frame, running head (author and volume left, chapter and title right),
// a thin rule, the body, a thin rule and the caption "Fig. N — …" (plus a short note on the right).
export function page({ width, height, fig, chapter, title, caption, note = "", body, label, heading }) {
  const head = `<text x="22" y="29"><tspan class="h ink" font-size="14">Ben Macha </tspan><tspan class="h rd" font-size="14">Ali</tspan><tspan class="mono muted" font-size="11" dx="8">vol. ${new Date().getUTCFullYear()}</tspan></text>`
    + `<text x="${width - 22}" y="29" text-anchor="end"><tspan class="mono muted" font-size="11">${esc(chapter)} · </tspan><tspan class="b ink2" font-size="12.5">${esc(title)}</tspan></text>`
    + `<path class="rule" d="M22 42H${width - 22}"/>`;
  const foot = `<path class="rule" d="M22 ${height - 40}H${width - 22}"/>`
    + `<text class="mono muted" x="22" y="${height - 18}" font-size="11.5"><tspan class="ink2">Fig. ${fig}</tspan> — ${esc(caption)}</text>`
    + (note ? `<text class="mono muted" x="${width - 22}" y="${height - 18}" font-size="11" text-anchor="end">${esc(note)}</text>` : "");
  return `<svg xmlns="http://www.w3.org/2000/svg" class="bk" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}">`
    + `<title>${esc(heading)}</title><style>${CSS}</style><rect class="frame" x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="14"/>${head}${body}${foot}</svg>\n`;
}

// A numbered callout: a leader from the part (px, py) to a small numbered ring with its label.
export function callout(n, [px, py], [lx, ly], text, { anchor = "start" } = {}) {
  const dir = anchor === "end" ? -1 : 1;
  const r = 8;
  return `<path class="lead" d="M${f(px)} ${f(py)}L${f(lx - dir * r)} ${f(ly)}"/><circle class="dot" cx="${f(px)}" cy="${f(py)}" r="1.6"/>`
    + `<circle class="co" cx="${f(lx)}" cy="${f(ly)}" r="${r}"/>`
    + (n === "" ? `<circle class="dot g" cx="${f(lx)}" cy="${f(ly)}" r="3"/>` : `<text class="mono ink2" x="${f(lx)}" y="${f(ly + 3.4)}" font-size="9.5" text-anchor="middle">${n}</text>`)
    + `<text class="tx ink2" x="${f(lx + dir * (r + 5))}" y="${f(ly + 4)}" font-size="11.5" text-anchor="${anchor}">${esc(text)}</text>`;
}
const f = (v) => Math.round(v * 10) / 10;

// Path data in relative moves, in tenths of a unit: "M51.8 177L50.5 177.9" becomes "M51.8 177-1.3.9".
const num = (tenths) => (tenths / 10).toString().replace(/^(-?)0\./, "$1.");
function relative(d) {
  let out = "";
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let last = "";
  const push = (text) => {
    if (/[\d.]$/.test(out) && !(text.startsWith("-") || (text.startsWith(".") && /\.\d*$/.test(out.split(/[ a-zA-Z-]/).pop() ?? "")))) out += " ";
    out += text;
  };
  for (const [, cmd, args] of d.matchAll(/([MLZ])([^MLZ]*)/g)) {
    if (cmd === "Z") {
      out += "z";
      cx = sx;
      cy = sy;
      last = "z";
      continue;
    }
    const n = args.trim().split(/[ ,]+|(?=-)/).filter(Boolean).map((v) => Math.round(Number(v) * 10));
    for (let i = 0; i + 1 < n.length; i += 2) {
      const [x, y] = [n[i], n[i + 1]];
      const first = !out;
      const move = cmd === "M" && i === 0;
      if (first) {
        out += "M";
        push(num(x));
        push(num(y));
        last = "M";
      } else {
        const letter = move ? "m" : "l";
        if (letter !== last && !(letter === "l" && last === "m")) out += letter;
        push(num(x - cx));
        push(num(y - cy));
        last = letter === "m" ? "m" : "l";
      }
      cx = x;
      cy = y;
      if (move) {
        sx = x;
        sy = y;
      }
    }
  }
  return out;
}

// Relative path data keeps the files small; the drawing is unchanged.
export const compact = (text) => text.replace(/ d="(M[MLZ0-9 .-]*)"/g, (_, d) => ` d="${relative(d)}"`);
