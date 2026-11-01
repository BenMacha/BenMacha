#!/usr/bin/env node
// Draws the organizations as on benmacha.tn/open-source: three small buildings on a grass-topped
// ground block. Pepprio is a restaurant with a striped awning (restaurant order management),
// Pignelle a real-estate agency with a red roof and a for-sale board, and the personal workshop a
// brick garage with a "?" block sign and a warp pipe.
//
// Usage: node scripts/orgs_machine.mjs [out.svg]   (default profile-contrib/orgs.svg)
// Node 20+, built-ins only. The figure kit is in scripts/anatomy-mario/.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { orgStreet } from "./anatomy-mario/org-street.mjs";
import { card, compact, esc, place } from "./anatomy-mario/theme.mjs";

const output = process.argv[2] || "profile-contrib/orgs.svg";

const ORGS = [
  { name: "Pepprio", what: "Restaurant order management", links: ["github.com/pepprio", "pepprio.com"] },
  { name: "Pignelle", what: "Tools for real estate agencies", links: ["github.com/Pignelle", "pignelle.com"] },
  { name: "BenMacha", what: "Personal workshop", links: ["github.com/BenMacha", "benmacha.tn"] },
];

const W = 840;
const SIDE = 236;
const label = "Three small isometric buildings on a grass-topped ground block: the Pepprio restaurant with a striped awning (restaurant order management), the Pignelle real-estate agency with a red roof and a for-sale board (tools for real estate agencies), and Ben Macha's brick workshop with a \"?\" block sign and a green warp pipe (benmacha.tn, github.com/BenMacha).";
const art = place(orgStreet({ label }).svg, SIDE + 14, 44, W - SIDE - 34);
const H = Math.round(44 + art.h + 36);

const L = [];
const top = 84;
const ROW = (H - 60 - top) / ORGS.length + 4;
ORGS.forEach((o, i) => {
  const y = top + i * ROW;
  L.push(`<text class="px" x="22" y="${y}" font-size="10" style="fill:var(--accent)">${esc(o.name)}</text>`);
  L.push(`<text class="mono ink" x="22" y="${y + 18}" font-size="11">${esc(o.what)}</text>`);
  L.push(`<text class="mono muted" x="22" y="${y + 34}" font-size="10.5">${esc(o.links.join(" · "))}</text>`);
});

const svg = card({
  width: W,
  height: H,
  fig: "Fig 3",
  title: "Organizations & projects",
  hint: "Restaurant orders · real estate · personal",
  readout: ORGS.map((o) => o.name).join(" · "),
  heading: "Organizations and projects",
  label,
  body: L.join("") + art.svg,
});

const out = compact(svg);
mkdirSync(dirname(output) || ".", { recursive: true });
writeFileSync(output, out);
console.log(`wrote ${output} (${(Buffer.byteLength(out) / 1024).toFixed(1)} KB)`);
