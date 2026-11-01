#!/usr/bin/env node
// Draws the GitHub numbers as a page of the technical book: the contribution calendar of the last
// 52 weeks is a machined plate of cells, one per day, each day with contributions carrying a block
// as tall as its level (the two tallest in green) and a red pin on today. The ledger under it gives
// the year's counters, and the top languages stand as columns in their colours.
//
// Usage: node scripts/github_stats_machine.mjs profile-contrib/github-stats.json [out.svg]
// Input: the JSON written by scripts/github_stats.py. Node 20+, built-ins only.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { contribGrid, languageColumns, HEIGHTS } from "./anatomy-book/contrib-grid.mjs";
import { callout, compact, esc, page, place } from "./anatomy-book/theme.mjs";

const input = process.argv[2] || "profile-contrib/github-stats.json";
const output = process.argv[3] || "profile-contrib/github-stats.svg";

const raw = JSON.parse(readFileSync(input, "utf8"));
const count = (value) => Math.max(0, Math.floor(Number(value) || 0));
const days = (Array.isArray(raw.days) ? raw.days : [])
  .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d.date)))
  .map((d) => ({ date: d.date, count: count(d.count) }));
if (!days.length) {
  console.error(`${input}: no calendar days`);
  process.exit(1);
}
const languages = (Array.isArray(raw.languages) ? raw.languages : [])
  .map((l) => ({ name: String(l.name ?? "?"), color: /^#[0-9a-f]{3,6}$/i.test(String(l.color)) ? l.color : "#8b8b8b", share: Number(l.share) || 0 }))
  .slice(0, 6);
const YEAR = count(raw.year) || new Date().getUTCFullYear();
const n = (v) => count(v).toLocaleString("en-US");

// ---------------------------------------------------------------- levels: quartiles of the active days, as on GitHub
const active = days.map((d) => d.count).filter(Boolean).sort((a, b) => a - b);
const q = (p) => (active.length ? active[Math.min(active.length - 1, Math.floor(p * active.length))] : 1);
const cuts = [Math.max(2, q(0.25)), Math.max(3, q(0.5)), Math.max(4, q(0.75))];
for (let i = 1; i < 3; i++) cuts[i] = Math.max(cuts[i], cuts[i - 1] + 1);
const top = [...days].sort((a, b) => b.count - a.count)[0];
const TOTAL = days.reduce((s, d) => s + d.count, 0);
const fmtDay = (iso) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const W = 840;
const label = `The GitHub contribution calendar of the last 52 weeks drawn as an isometric plate of cells, one per day: a flat cell when there was no contribution, `
  + `otherwise a block on four height levels, the two tallest in green, and a red pin on today. ${n(TOTAL)} contributions on ${active.length} days in 52 weeks`
  + (top && top.count ? `, best day ${fmtDay(top.date)} with ${n(top.count)}` : "")
  + `. In ${YEAR}: ${n(raw.contributions_year)} contributions, ${n(raw.commits)} commits, ${n(raw.pull_requests)} pull requests, ${n(raw.issues)} issues, ${n(raw.reviews)} reviews. `
  + `${n(raw.public_repos)} public repositories, ${n(raw.stars)} stars, ${n(raw.followers)} followers.`
  + (languages.length ? ` Top languages by code size: ${languages.map((l) => `${l.name} ${l.share}%`).join(", ")}.` : "");

// ---------------------------------------------------------------- the plate, with three callouts
const GW = W - 44;
const grid = contribGrid({ days, cuts, best: top && top.count ? top.date : "", width: GW });
const GY = 74;
const plate = place(grid.svg, 22, GY, GW);
const s = GW / grid.width;
const P = ([x, y]) => [22 + x * s, GY + y * s];
const C = [];
if (grid.empty) C.push(callout(1, P(grid.empty), [Math.max(40, P(grid.empty)[0] - 40), 62], "flat cell: no contribution that day"));
if (grid.tall) C.push(callout(2, P(grid.tall), [430, 62], `taller block, more contributions (best day ${n(top.count)})`));
C.push(callout(3, P(grid.today), [W - 96, 62], "today"));

// ---------------------------------------------------------------- ledger: the year's counters (left), languages (right)
const L = [];
const y0 = Math.round(GY + plate.h + 18);
L.push(`<path class="rule" d="M22 ${y0}H${W - 22}"/>`);
L.push(`<text class="mono muted" x="22" y="${y0 + 22}" font-size="11">contributions in ${YEAR}</text>`);
L.push(`<text class="h gr" x="22" y="${y0 + 56}" font-size="34">${n(raw.contributions_year)}</text>`);
L.push(`<text class="tx ink2" x="22" y="${y0 + 76}" font-size="12">${n(TOTAL)} in the last 52 weeks, on ${active.length} days</text>`);

const COUNTERS = [
  ["commits", raw.commits],
  ["pull requests", raw.pull_requests],
  ["issues", raw.issues],
  ["reviews", raw.reviews],
  ["stars", raw.stars],
  ["followers", raw.followers],
  ["public repos", raw.public_repos],
];
const COLW = 100;
const cx0 = 22;
const cy0 = y0 + 100;
COUNTERS.forEach(([name, value], i) => {
  const x = cx0 + (i % 4) * COLW;
  const y = cy0 + Math.floor(i / 4) * 50;
  L.push(`<path class="rule" d="M${x} ${y}H${x + COLW - 12}"/>`);
  L.push(`<text class="mono muted" x="${x}" y="${y + 16}" font-size="10.5">${esc(name)}</text><text class="h ink" x="${x}" y="${y + 38}" font-size="20">${n(value)}</text>`);
});

// legend: a block per level with its real range of daily counts
const ly = cy0 + 116;
const ranges = ["0", `1–${cuts[0] - 1}`, `${cuts[0]}–${cuts[1] - 1}`, `${cuts[1]}–${cuts[2] - 1}`, `${cuts[2]}+`];
L.push(`<text class="mono muted" x="22" y="${ly}" font-size="10.5">per day</text>`);
HEIGHTS.forEach((h, i) => {
  const x = 84 + i * 66;
  const bh = 2 + h * 0.62;
  const cls = i >= 3 ? ' fill="var(--g-top)" stroke="var(--green)"' : ' fill="var(--top)" stroke="var(--line)"';
  L.push(`<rect x="${x}" y="${ly - bh}" width="10" height="${bh}" stroke-width="1.1"${cls}/>`);
  L.push(`<text class="mono muted" x="${x + 15}" y="${ly}" font-size="10">${ranges[i]}</text>`);
});

const LX = 470;
const LW = W - LX - 22;
L.push(`<path class="rule" d="M${LX - 18} ${y0 + 12}V${ly + 4}"/>`);
L.push(`<text class="mono muted" x="${LX}" y="${y0 + 22}" font-size="11">top languages, by code size</text>`);
let langBottom = y0 + 60;
let langs = `<text class="tx muted" x="${LX}" y="${y0 + 60}" font-size="12">No language data yet</text>`;
if (languages.length) {
  const art = place(languageColumns({ languages, width: LW }).svg, LX, y0 + 32, LW);
  langs = art.svg;
  langBottom = y0 + 32 + art.h;
}

const H = Math.round(Math.max(ly + 14, langBottom) + 52);
const svg = page({
  width: W,
  height: H,
  fig: 6,
  chapter: "05",
  title: "GitHub activity",
  caption: "Contribution plate: one cell per day, block height = contributions.",
  note: "updated hourly",
  heading: `${n(TOTAL)} GitHub contributions in the last 52 weeks`,
  label,
  body: plate.svg + C.join("") + L.join("") + langs,
});

const out = compact(svg);
mkdirSync(dirname(output) || ".", { recursive: true });
writeFileSync(output, out);
console.log(`wrote ${output} (${(Buffer.byteLength(out) / 1024).toFixed(1)} KB)`);
