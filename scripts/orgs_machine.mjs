#!/usr/bin/env node
// Draws the organizations as a page of the technical book: three small buildings on one base plate,
// linked by dashed paths. Pepprio is a restaurant with a striped awning and a service counter
// (restaurant order management), Pignelle a real-estate agency under a gable roof with a "for sale"
// board, and the personal workshop a shed with a workbench, a screen and a lamp.
//
// Usage: node scripts/orgs_machine.mjs [out.svg]   (default profile-contrib/orgs.svg)
// Node 20+, built-ins only. The figure kit is in scripts/anatomy-book/.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { orgRow } from "./anatomy-book/org-row.mjs";
import { callout, compact, esc, page, place } from "./anatomy-book/theme.mjs";

const output = process.argv[2] || "profile-contrib/orgs.svg";

// The organizations come from profile-contrib/profile.json ("organizations"): name, what, building
// (restaurant, agency or workshop), plate (the name plate, default the name) and links.
const profile = JSON.parse(readFileSync(process.env.PROFILE_JSON || "profile-contrib/profile.json", "utf8"));
const INKS = ["rd", "ink", "gr"];
const ORGS = profile.organizations.map((o, i) => ({ ...o, links: (o.links || []).map((l) => l.label), ink: INKS[i % 3] }));

const W = 840;
const SIDE = 250;
const LOOK = { restaurant: "a restaurant with a striped awning and a service counter", agency: "an agency under a gable roof with a for-sale board", workshop: "a workshop with a workbench, a screen and a lamp" };
const label = `${ORGS.length} small isometric buildings on one base plate, linked by dashed paths: ${ORGS.map((o) => `${o.name}, ${LOOK[o.building] || LOOK.workshop} (${o.what.toLowerCase()}, ${o.links.join(", ")})`).join("; ")}.`;
const AX = SIDE + 20;
const AW = W - AX - 22;
const scene = orgRow({ kinds: ORGS.map((o) => o.building), plates: ORGS.map((o) => o.plate || o.name), width: AW });
const AY = 84;
const art = place(scene.svg, AX, AY, AW);
const s = AW / scene.width;
const pt = ([x, y]) => [AX + x * s, AY + y * s];
const C = scene.points.map((p, i) => callout(i + 1, pt(p), [AX + 20 + (i * (AW - 120)) / Math.max(1, ORGS.length - 1), 66], ORGS[i].building || "workshop"));
const H = Math.round(AY + art.h + 52);

const L = [];
const top = 74;
const ROW = (H - 70 - top) / ORGS.length;
ORGS.forEach((o, i) => {
  const y = top + i * ROW;
  L.push(`<circle class="co" cx="30" cy="${y + 8}" r="8"/><text class="mono ink2" x="30" y="${y + 11.4}" font-size="9.5" text-anchor="middle">${i + 1}</text>`);
  L.push(`<text class="h ${o.ink}" x="46" y="${y + 14}" font-size="17">${esc(o.name)}</text>`);
  L.push(`<text class="tx ink2" x="46" y="${y + 32}" font-size="12">${esc(o.what)}</text>`);
  L.push(`<text class="mono muted" x="46" y="${y + 48}" font-size="9.6">${esc(o.links.join(" · "))}</text>`);
  if (i < ORGS.length - 1) L.push(`<path class="rule" d="M46 ${y + ROW - 10}H${SIDE}"/>`);
});
L.push(`<path class="rule" d="M${SIDE + 10} 56V${H - 54}"/>`);

const svg = page({
  width: W,
  height: H,
  fig: 1,
  chapter: "01",
  title: "Organizations & projects",
  caption: `${ORGS.length} buildings on one plate, one per organization, linked by paths.`,
  heading: "Organizations and projects",
  label,
  body: L.join("") + art.svg + C.join(""),
});

const out = compact(svg);
mkdirSync(dirname(output) || ".", { recursive: true });
writeFileSync(output, out);
console.log(`wrote ${output} (${(Buffer.byteLength(out) / 1024).toFixed(1)} KB)`);
