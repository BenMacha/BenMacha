// The look of the profile figures: the portfolio's (benmacha.tn) night and day palettes, resolved
// into one inline <style> per SVG. GitHub shows README images through <img>, so the theme follows
// prefers-color-scheme: the day palette by default, the night palette under (prefers-color-scheme: dark).
// It also frames a figure in the site's pixel card (Fig n, title, hint and readout corners) and embeds
// the latin subset of Press Start 2P (SIL Open Font License 1.1, see fonts/OFL.txt).

import { readFileSync } from "node:fs";

const here = (name) => new URL(name, import.meta.url);
const RULES = readFileSync(here("./mario.css"), "utf8");
const FONT = readFileSync(here("./fonts/PressStart2P-latin.woff2")).toString("base64");

// Site tokens (assets/css/main.css) and figure tokens (assets/css/anatomy.css), day then night.
const DAY = `--card:#fffaf0;--line:#1a1a2e;--shadow:#1a1a2e;--ink:#1a1a2e;--muted:#4a4f6a;--eyebrow:#10132a;--accent:#0a7d24;
--border:#d8ccb0;--chip:#f3ead3;--hi:rgba(255,255,255,.9);--lo:rgba(0,0,0,.08);--merged-ink:#b07a00;--open-ink:#0a7d24;
--anatomy-paper:#fffaf0;--anatomy-face:#fff;--anatomy-top:#fffdf7;--anatomy-shade-0:#e4d9bf;--anatomy-shade-1:#ebe2cb;
--anatomy-shade-2:#f2ead8;--anatomy-shade-3:#f8f2e4;--anatomy-lit-top:#fff;--anatomy-lit-shade:#f4eedf;--anatomy-hi:#1a1a2e;
--anatomy-mid:#877c66;--anatomy-lo:#b9ad93;--anatomy-faint:#dcd1b8;--anatomy-lit:#000;--anatomy-halo:#6b5a36;
--anatomy-halo-opacity:.3;--anatomy-dot:#1a1a2e;--anatomy-void:#e7dcc3`;
const NIGHT = `--card:#161a33;--line:#000;--shadow:#000;--ink:#e8ecff;--muted:#a3abd1;--eyebrow:#fbd000;--accent:#00ff41;
--border:#2b3160;--chip:#1e2344;--hi:rgba(255,255,255,.07);--lo:rgba(0,0,0,.35);--merged-ink:#fbd000;--open-ink:#00ff41;
--anatomy-paper:#161a33;--anatomy-face:#1b2040;--anatomy-top:#1c2143;--anatomy-shade-0:#0e1124;--anatomy-shade-1:#11152c;
--anatomy-shade-2:#141933;--anatomy-shade-3:#171c3a;--anatomy-lit-top:#262c58;--anatomy-lit-shade:#1e2349;--anatomy-hi:#e8ecff;
--anatomy-mid:#6e77a8;--anatomy-lo:#3d4374;--anatomy-faint:#272c52;--anatomy-lit:#fff;--anatomy-halo:#000;
--anatomy-halo-opacity:.85;--anatomy-dot:#e8ecff;--anatomy-void:#070914`;
const FIXED = `--coin:#fbd000;--coin-dark:#c98a00;--coin-light:#ffe98a;--mario:#e52521;--grass:#5cb338;--navy:#1a1a2e;
--anatomy-weight:.7px;--anatomy-ease:cubic-bezier(.32,.72,0,1);
--font-pixel:"Press Start 2P",ui-monospace,monospace;--font-mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace`;

export const CSS = `@font-face{font-family:"Press Start 2P";src:url(data:font/woff2;base64,${FONT}) format("woff2");font-display:block}
.iso{${FIXED};${DAY}}
@media (prefers-color-scheme:dark){.iso{${NIGHT}}}
${RULES}
.iso-halo{filter:url(#hb);transform:translate(0,3px)}.iso-halo[data-size="s"]{filter:url(#hbs)}
.cd-shadow{fill:var(--shadow)}.cd{fill:var(--card);stroke:var(--line);stroke-width:3}
.cd-hi{fill:none;stroke:var(--hi);stroke-width:3}.cd-lo{fill:none;stroke:var(--lo);stroke-width:3}
.px{font-family:var(--font-pixel)}.mono{font-family:var(--font-mono)}
.corner{font-size:8px;fill:var(--muted);letter-spacing:.04em}.corner.fig{fill:var(--eyebrow)}.corner.ro{fill:var(--ink)}
.ink{fill:var(--ink)}.muted{fill:var(--muted)}.merged{fill:var(--merged-ink)}.open{fill:var(--open-ink)}
.rule{stroke:var(--border);stroke-width:3;stroke-dasharray:3 4}
.logo{fill:var(--ink);stroke:none}`;

export const DEFS = `<defs><filter id="hb" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="7"/></filter><filter id="hbs" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="3.5"/></filter></defs>`;

export const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Places a figure built by one of the generators (an <svg viewBox> string) at x, y, w × h.
export function place(svg, x, y, w) {
  const [, vw, vh] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const h = (w * vh) / vw;
  return {
    h,
    svg: svg.replace(/^<svg [^>]*?viewBox="0 0 ([\d.]+) ([\d.]+)"[^>]*>/, (_m, a, b) => `<svg x="${x}" y="${y}" width="${w}" height="${Math.round(h * 100) / 100}" viewBox="0 0 ${a} ${b}" class="iso-svg" overflow="visible">`),
  };
}

// The site's pixel card: 3 px outline, inset bevel, hard 6 px shadow, corner labels in Press Start 2P.
export function card({ width, height, fig, title, hint, readout, body, label, heading }) {
  const W = width + 6;
  const H = height + 6;
  const corners = [
    `<text class="px corner fig" x="22" y="30">${esc(fig)}</text>`,
    `<text class="px corner" x="${width - 20}" y="30" text-anchor="end">${esc(title)}</text>`,
    hint ? `<text class="px corner" x="22" y="${height - 20}">${esc(hint)}</text>` : "",
    `<text class="px corner ro" x="${width - 20}" y="${height - 20}" text-anchor="end">${esc(readout)}</text>`,
  ].join("");
  const frame = `<rect class="cd-shadow" x="6" y="6" width="${width}" height="${height}"/>`
    + `<rect class="cd" x="1.5" y="1.5" width="${width - 3}" height="${height - 3}"/>`
    + `<path class="cd-hi" d="M4.5 ${height - 4.5}V4.5H${width - 4.5}"/><path class="cd-lo" d="M${width - 4.5} 4.5V${height - 4.5}H4.5"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="iso" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">`
    + `<title>${esc(heading)}</title><style>${CSS}</style>${DEFS}${frame}${corners}${body}</svg>\n`;
}

// Path data in relative moves, in tenths of a unit: "M51.8 177L50.5 177.9" becomes "M51.8 177-1.3.9".
const num = (tenths) => {
  const text = (tenths / 10).toString().replace(/^(-?)0\./, "$1.");
  return text;
};
function relative(d) {
  let out = "";
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let last = "";
  const push = (text) => {
    // a separator is needed unless the next number starts with "-", or with "." after a number holding a dot
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

// Shorter class names and relative path data keep the files small; the drawing is unchanged.
const SHORT = { "iso-solid": "so", "iso-fill": "fi", "iso-shade": "sh", "iso-top": "tp", "iso-line": "ln", "iso-crease": "cr", "iso-bevel": "bv", "iso-edge": "ed", "iso-dots": "dt", "iso-halo": "ha", "data-shade": "data-s", "data-tone": "data-t", "data-lit": "data-l" };
export const compact = (text) =>
  text
    .replace(/\b(iso-(?:solid|fill|shade|top|line|crease|bevel|edge|dots|halo)|data-(?:shade|tone|lit))\b(?!-)/g, (name) => SHORT[name])
    .replace(/ data-free="[^"]*"/g, "")
    .replace(/ data-p="[^"]*"/g, "")
    .replace(/ d="(M[MLZ0-9 .-]*)"/g, (_, d) => ` d="${relative(d)}"`);
