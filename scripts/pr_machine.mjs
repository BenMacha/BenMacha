#!/usr/bin/env node
// Draws the open source pull requests as the Mario pull request machine of benmacha.tn/open-source:
// "?" blocks (pull requests) drop out of a warp pipe onto a conveyor, a review stamp hits each one
// and the block pays a coin. Merged pull requests are the coins in the brick crate, the ones under
// review wait as "?" blocks in the tray, the dial reads the share merged. The ledger on the left
// gives the totals and one row per project.
//
// Usage: node scripts/pr_machine.mjs profile-contrib/stats.json [out.svg]
// Stats shape: {"merged": 14, "review": 23, "projects": [{"name": "Symfony", "merged": 14, "review": 2, "logo": "symfony"}]}
// Node 20+, built-ins only. The figure kit is in scripts/anatomy-mario/.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { prMachine } from "./anatomy-mario/pr-machine.mjs";
import { card, compact, esc, place } from "./anatomy-mario/theme.mjs";
import { logoMark } from "./logos.mjs";

const input = process.argv[2];
const output = process.argv[3] || "profile-contrib/pr-machine.svg";
if (!input) {
  console.error("usage: node scripts/pr_machine.mjs <stats.json> [out.svg]");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(input, "utf8"));
const count = (value) => Math.max(0, Math.floor(Number(value) || 0));
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "p";
const projects = (Array.isArray(raw.projects) ? raw.projects : [])
  .map((p) => ({ name: String(p.name ?? "").trim() || "?", merged: count(p.merged), open: count(p.review), logo: String(p.logo ?? "") }))
  .filter((p) => p.merged || p.open)
  .map((p, i) => ({ ...p, id: `${slug(p.name)}-${i}` }));
const MERGED = projects.reduce((s, p) => s + p.merged, 0);
const OPEN = projects.reduce((s, p) => s + p.open, 0);
const SHARE = MERGED + OPEN ? Math.round((MERGED / (MERGED + OPEN)) * 100) : 0;

const W = 840;
const SIDE = 236;
const label = `An isometric pull request machine on a bench. "?" blocks standing for pull requests drop out of a green warp pipe onto a conveyor and pass under a review stamp that turns each one into a coin. ${MERGED} merged pull requests are coins in the brick crate and ${OPEN} wait under review in the tray. The dial reads ${SHARE} % merged.${projects.length ? " By project: " + projects.map((p) => `${p.name} ${p.merged} merged, ${p.open} under review`).join("; ") + "." : ""}`;
const art = place(prMachine({ projects, idPrefix: "prm", label }).svg, SIDE + 14, 46, W - SIDE - 34);
const H = Math.round(46 + art.h + 40);

// ---------------------------------------------------------------- ledger
const L = [];
const ty = 98;
L.push(`<ellipse cx="29" cy="${ty - 8}" rx="5.5" ry="7.5" fill="#fbd000" stroke="#1a1a2e" stroke-width="1.6"/><path d="M29 ${ty - 12}v8" stroke="#c98a00" stroke-width="2"/>`);
L.push(`<text class="px merged" x="42" y="${ty}" font-size="18">${MERGED}</text><text class="mono muted" x="42" y="${ty + 17}" font-size="11">merged</text>`);
L.push(`<rect x="124" y="${ty - 16}" width="16" height="16" fill="#fbd000" stroke="#1a1a2e" stroke-width="1.6"/><path d="M126 ${ty - 1.5}h13M138.5 ${ty - 14}v13" stroke="#c98a00" stroke-width="2" fill="none"/><text class="px" x="132" y="${ty - 4}" font-size="9" text-anchor="middle" fill="#1a1a2e">?</text>`);
L.push(`<text class="px open" x="148" y="${ty}" font-size="18">${OPEN}</text><text class="mono muted" x="148" y="${ty + 17}" font-size="11">under review</text>`);
L.push(`<line class="rule" x1="22" y1="${ty + 34}" x2="${SIDE}" y2="${ty + 34}"/>`);
const ROW = 24;
const top = ty + 64;
const maxRows = Math.floor((H - 50 - top) / ROW) + 1;
const shown = projects.length > maxRows ? projects.slice(0, maxRows - 1) : projects;
const clip = (name) => (name.length > 17 ? name.slice(0, 16) + "…" : name);
shown.forEach((p, i) => {
  const y = top + i * ROW;
  L.push(logoMark(p.logo || "initials:" + p.name, 22, y - 12.5, 15, "logo"));
  L.push(`<text class="mono ink" x="45" y="${y}" font-size="12">${esc(clip(p.name))}</text>`);
  L.push(`<text class="px muted" x="${SIDE}" y="${y}" font-size="8" text-anchor="end"><tspan class="${p.merged ? "merged" : ""}">${p.merged}</tspan> · <tspan class="${p.open ? "open" : ""}">${p.open}</tspan></text>`);
});
if (shown.length < projects.length) L.push(`<text class="mono muted" x="22" y="${top + shown.length * ROW}" font-size="11">+${projects.length - shown.length} more projects</text>`);
if (!projects.length) L.push(`<text class="mono muted" x="22" y="${top}" font-size="11">No pull requests yet</text>`);

const svg = card({
  width: W,
  height: H,
  fig: "Fig 1",
  title: "Pull request machine",
  hint: "Updated hourly from GitHub",
  readout: `${MERGED} merged · ${OPEN} under review · ${SHARE} % merged`,
  heading: `${MERGED} merged and ${OPEN} under review open source pull requests`,
  label,
  body: L.join("") + art.svg,
});

const out = compact(svg);
mkdirSync(dirname(output) || ".", { recursive: true });
writeFileSync(output, out);
console.log(`wrote ${output} (${(Buffer.byteLength(out) / 1024).toFixed(1)} KB)`);
