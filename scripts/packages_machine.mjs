#!/usr/bin/env node
// Draws the Packagist packages as a page of the technical book: one slatted crate per package on a
// shelf, holding parcels in proportion to its installs, with a counter under it giving the
// Packagist total. The ledger on the left numbers the crates.
//
// Usage: node scripts/packages_machine.mjs [downloads.json] [out.svg]
//   downloads.json: {"benmacha/diagram-bundle": 64, ...} written by scripts/contributions.py
// Node 20+, built-ins only. The figure kit is in scripts/anatomy-book/.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { crateShelf } from "./anatomy-book/crate-shelf.mjs";
import { callout, compact, esc, page, place } from "./anatomy-book/theme.mjs";

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
const SIDE = 250;
const label = `An isometric shelf holding ${PACKAGES.length} slatted crates, one per Packagist package, each with parcels in proportion to its installs and a counter on the shelf edge: ${PACKAGES.map((p) => `${p.name} ${fmt(downloads(p.name))} installs`).join(", ")}.`;
const AX = SIDE + 20;
const AW = W - AX - 22;
const scene = crateShelf({ packages: PACKAGES.map((p) => ({ name: p.name, downloads: downloads(p.name) })), width: AW });
const AY = 92;
const art = place(scene.svg, AX, AY, AW);
const s = AW / scene.width;
const C = scene.points.map(([x, y], i) => callout(i + 1, [AX + x * s, AY + y * s], [AX + 10 + i * 140, 66], i ? "" : "crate, label, counter").replace(/<text class="tx[^>]*><\/text>/, ""));
const H = Math.round(Math.max(AY + art.h, 74 + PACKAGES.length * 56) + 52);

const L = [];
const top = 80;
const ROW = 56;
PACKAGES.forEach((p, i) => {
  const y = top + i * ROW;
  L.push(`<circle class="co" cx="30" cy="${y - 4}" r="8"/><text class="mono ink2" x="30" y="${y - 0.6}" font-size="9.5" text-anchor="middle">${i + 1}</text>`);
  L.push(`<text class="b ink" x="46" y="${y}" font-size="13">${esc(p.name.split("/")[1])}</text>`);
  L.push(`<text class="tx ink2" x="46" y="${y + 17}" font-size="11.5">${esc(p.what)}</text>`);
  L.push(`<text class="h gr" x="${SIDE}" y="${y}" font-size="15" text-anchor="end">${fmt(downloads(p.name))}</text>`);
  if (i < PACKAGES.length - 1) L.push(`<path class="rule" d="M46 ${y + 32}H${SIDE}"/>`);
});
L.push(`<path class="rule" d="M${SIDE + 10} 56V${H - 54}"/>`);

const svg = page({
  width: W,
  height: H,
  fig: 3,
  chapter: "03",
  title: "Packages on Packagist",
  caption: `Package shelf: ${PACKAGES.length} Symfony bundles, ${fmt(TOTAL)} installs in all.`,
  note: "installs from Packagist",
  heading: "Packages on Packagist",
  label,
  body: L.join("") + art.svg + C.join(""),
});

const out = compact(svg);
mkdirSync(dirname(output) || ".", { recursive: true });
writeFileSync(output, out);
console.log(`wrote ${output} (${(Buffer.byteLength(out) / 1024).toFixed(1)} KB)`);
