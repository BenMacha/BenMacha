#!/usr/bin/env node
// Draws the open source pull requests as a page of the technical book: a pull request line where
// parcels (pull requests) leave an intake hopper, pass under a review station with a stamp and a
// dial, and end in the green "merged" tray or wait in the red-outlined "under review" tray. The
// ledger on the left gives the totals and one row per project.
//
// Usage: node scripts/pr_machine.mjs profile-contrib/stats.json [out.svg]
// Stats shape: {"merged": 14, "review": 23, "projects": [{"name": "Symfony", "merged": 14, "review": 2, "logo": "symfony"}]}
// Node 20+, built-ins only. The figure kit is in scripts/anatomy-book/.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { prLine } from "./anatomy-book/pr-line.mjs";
import { callout, compact, esc, page, place } from "./anatomy-book/theme.mjs";
import { logoMark } from "./logos.mjs";

const input = process.argv[2];
const output = process.argv[3] || "profile-contrib/pr-machine.svg";
if (!input) {
  console.error("usage: node scripts/pr_machine.mjs <stats.json> [out.svg]");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(input, "utf8"));
const count = (value) => Math.max(0, Math.floor(Number(value) || 0));
const projects = (Array.isArray(raw.projects) ? raw.projects : [])
  .map((p) => ({ name: String(p.name ?? "").trim() || "?", merged: count(p.merged), open: count(p.review), logo: String(p.logo ?? "") }))
  .filter((p) => p.merged || p.open);
const MERGED = projects.reduce((s, p) => s + p.merged, 0);
const OPEN = projects.reduce((s, p) => s + p.open, 0);
const SHARE = MERGED + OPEN ? Math.round((MERGED / (MERGED + OPEN)) * 100) : 0;

const W = 840;
const SIDE = 250;
const label = `An isometric pull request line on a base plate. Parcels standing for pull requests leave an intake hopper, ride a conveyor under a review station with a stamp and a dial, and end in a green tray when merged or wait in a red-outlined tray while under review. ${MERGED} merged, ${OPEN} under review, ${SHARE} % merged.${projects.length ? " By project: " + projects.map((p) => `${p.name} ${p.merged} merged, ${p.open} under review`).join("; ") + "." : ""}`;

const AX = SIDE + 20;
const AW = W - AX - 22;
const scene = prLine({ merged: MERGED, open: OPEN, width: AW });
const AY = 92;
const art = place(scene.svg, AX, AY, AW);
const s = AW / scene.width;
const pt = ([x, y]) => [AX + x * s, AY + y * s];
const C = [
  callout(1, pt(scene.points.hopper), [AX + 10, 66], "intake"),
  callout(2, pt(scene.points.station), [AX + 150, 66], "review station"),
  callout(3, pt(scene.points.merged), [W - 120, 66], "merged"),
];
const reviewAt = pt(scene.points.review);
const bottom = AY + art.h;
C.push(callout(4, reviewAt, [AX + 10, bottom + 4], "under review"));

// ---------------------------------------------------------------- ledger
const L = [];
const ty = 74;
L.push(`<text class="mono muted" x="22" y="${ty}" font-size="11">merged</text><text class="h gr" x="22" y="${ty + 34}" font-size="34">${MERGED}</text>`);
L.push(`<text class="mono muted" x="122" y="${ty}" font-size="11">under review</text><text class="h rd" x="122" y="${ty + 34}" font-size="34">${OPEN}</text>`);
L.push(`<text class="tx ink2" x="22" y="${ty + 56}" font-size="12">${SHARE} % merged, across ${projects.length} projects</text>`);
L.push(`<path class="rule" d="M22 ${ty + 72}H${SIDE}"/>`);
const ROW = 27;
const top = ty + 98;
const H = Math.round(Math.max(bottom + 26, top + projects.length * ROW) + 50);
const shown = projects.slice(0, Math.max(1, Math.floor((H - 70 - top) / ROW) + 1));
const clip = (name) => (name.length > 22 ? name.slice(0, 21) + "…" : name);
shown.forEach((p, i) => {
  const y = top + i * ROW;
  L.push(logoMark(p.logo || "initials:" + p.name, 22, y - 12.5, 15, "logo"));
  L.push(`<text class="tx ink" x="46" y="${y}" font-size="12.5">${esc(clip(p.name))}</text>`);
  L.push(`<text class="mono" x="${SIDE}" y="${y}" font-size="11" text-anchor="end"><tspan class="${p.merged ? "gr" : "muted"}">${p.merged}</tspan><tspan class="muted"> · </tspan><tspan class="${p.open ? "rd" : "muted"}">${p.open}</tspan></text>`);
  L.push(`<path class="rule" d="M46 ${y + 9}H${SIDE}"/>`);
});
if (!projects.length) L.push(`<text class="tx muted" x="22" y="${top}" font-size="12">No pull requests yet</text>`);
L.push(`<path class="rule" d="M${SIDE + 10} 56V${H - 54}"/>`);

const svg = page({
  width: W,
  height: H,
  fig: 4,
  chapter: "04",
  title: "Open source · pull requests",
  caption: "Pull request line: every parcel is reviewed (2), merged ones land in the tray (3).",
  note: "updated hourly",
  heading: `${MERGED} merged and ${OPEN} under review open source pull requests`,
  label,
  body: L.join("") + art.svg + C.join(""),
});

const out = compact(svg);
mkdirSync(dirname(output) || ".", { recursive: true });
writeFileSync(output, out);
console.log(`wrote ${output} (${(Buffer.byteLength(out) / 1024).toFixed(1)} KB)`);
