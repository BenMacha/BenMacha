#!/usr/bin/env node
// Draws the Packagist packages as the package shelf of benmacha.tn/open-source: one wooden crate
// per package, holding coins in proportion to its installs, with a counter under it giving the
// Packagist total. The ledger on the left numbers the crates.
//
// Usage: node scripts/packages_machine.mjs [downloads.json] [out.svg]
//   downloads.json: {"benmacha/diagram-bundle": 64, ...} written by scripts/contributions.py
// Node 20+, built-ins only. The figure kit is in scripts/anatomy-mario/.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { packageShelf } from "./anatomy-mario/package-shelf.mjs";
import { card, compact, esc, place } from "./anatomy-mario/theme.mjs";

const input = process.argv[2] || "profile-contrib/packages.json";
const output = process.argv[3] || "profile-contrib/packages.svg";
let counts = {};
try {
  counts = JSON.parse(readFileSync(input, "utf8"));
} catch {
  counts = {};
}

const PACKAGES = [
  { name: "benmacha/diagram-bundle", what: "Doctrine ERD studio" },
  { name: "benmacha/mousetracker", what: "Heatmaps, session replay" },
  { name: "benmacha/audit-bundle", what: "Entity audit, rollback" },
  { name: "benmacha/templatebundle", what: "CRUD generator" },
];
const downloads = (name) => (Number.isFinite(counts[name]) ? Math.max(0, Math.floor(counts[name])) : 0);
const TOTAL = PACKAGES.reduce((sum, p) => sum + downloads(p.name), 0);
const fmt = (n) => n.toLocaleString("en-US");

const W = 840;
const SIDE = 236;
const label = `An isometric workshop shelf holding ${PACKAGES.length} wooden crates, one per Packagist package, each with a stack of coins and a counter of installs: ${PACKAGES.map((p) => `${p.name} ${fmt(downloads(p.name))} installs`).join(", ")}.`;
const art = place(packageShelf({ packages: PACKAGES.map((p) => ({ name: p.name, downloads: downloads(p.name) })), label }).svg, SIDE + 14, 44, W - SIDE - 34);
const H = Math.round(44 + art.h + 36);

const L = [];
const top = 84;
const ROW = Math.min(52, (H - 60 - top) / PACKAGES.length + 6);
PACKAGES.forEach((p, i) => {
  const y = top + i * ROW;
  L.push(`<rect x="22" y="${y - 14}" width="20" height="20" fill="#fbd000" stroke="#1a1a2e" stroke-width="2"/><path d="M24 ${y + 4}h17M40 ${y - 12}v17" stroke="#c98a00" stroke-width="2.4" fill="none"/>`);
  L.push(`<text class="px" x="31.5" y="${y}" font-size="8" text-anchor="middle" fill="#1a1a2e">${i + 1}</text>`);
  L.push(`<text class="mono ink" x="52" y="${y - 2}" font-size="11.5" font-weight="700">${esc(p.name.split("/")[1])}</text>`);
  L.push(`<text class="mono muted" x="52" y="${y + 13}" font-size="10.5">${esc(p.what)}</text>`);
  L.push(`<text class="px merged" x="${SIDE}" y="${y - 2}" font-size="8" text-anchor="end">${fmt(downloads(p.name))}</text>`);
});

const svg = card({
  width: W,
  height: H,
  fig: "Fig 4",
  title: "Package shelf",
  hint: `${PACKAGES.length} Symfony bundles`,
  readout: `${PACKAGES.length} packages · ${fmt(TOTAL)} installs`,
  heading: "Packages on Packagist",
  label,
  body: L.join("") + art.svg,
});

const out = compact(svg);
mkdirSync(dirname(output) || ".", { recursive: true });
writeFileSync(output, out);
console.log(`wrote ${output} (${(Buffer.byteLength(out) / 1024).toFixed(1)} KB)`);
