#!/usr/bin/env node
// Draws the open source contributions as a page of the technical book: a card index with one drawer
// per contributed project and one index card per pull request (green tab merged, red tab under
// review), the latest pull request written on the front card of each drawer.
//
// Usage: node scripts/pr_cabinet_machine.mjs profile-contrib/stats.json [out.svg]
// Input: the stats.json written by scripts/contributions.py (projects with their pull requests).
// Node 20+, built-ins only. The figure kit is in scripts/anatomy-book/.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { cardIndex } from "./anatomy-book/card-index.mjs";
import { callout, compact, page, place } from "./anatomy-book/theme.mjs";
import { logoMark } from "./logos.mjs";

const input = process.argv[2] || "profile-contrib/stats.json";
const output = process.argv[3] || "profile-contrib/pr-cabinet.svg";
const MAX = 6;

const raw = JSON.parse(readFileSync(input, "utf8"));
const count = (value) => Math.max(0, Math.floor(Number(value) || 0));
const all = (Array.isArray(raw.projects) ? raw.projects : [])
  .map((p) => ({
    name: String(p.name ?? "").trim() || "?",
    logo: String(p.logo ?? "repo"),
    merged: count(p.merged),
    review: count(p.review),
    prs: (Array.isArray(p.prs) ? p.prs : []).filter((x) => x.state === "merged" || x.state === "open").map((x) => ({ number: count(x.number), title: String(x.title ?? ""), state: x.state })),
  }))
  .filter((p) => p.prs.length);
const projects = all.slice(0, MAX);
const MERGED = all.reduce((s, p) => s + p.merged, 0);
const OPEN = all.reduce((s, p) => s + p.review, 0);

const W = 840;
const AW = W - 44;
const label = `An isometric card index: one pulled-out drawer per contributed project and one index card per pull request, green tab when merged, red tab while under review; the front card of each drawer shows the latest pull request. ${projects
  .map((p) => {
    const last = [...p.prs].sort((a, b) => b.number - a.number)[0];
    return `${p.name}: ${p.merged} merged, ${p.review} under review, latest #${last.number} ${last.title}`;
  })
  .join(". ")}.`;
const scene = cardIndex({ projects, logoMark, width: AW });
const AY = 84;
const art = place(scene.svg, 22, AY, AW);
const s = AW / scene.width;
const pt = ([x, y]) => [22 + x * s, AY + y * s];
const C = [];
if (scene.points.drawer) C.push(callout(1, pt(scene.points.drawer), [40, 64], "drawer: one project"));
if (scene.points.merged) C.push(callout(2, pt(scene.points.merged), [230, 64], "green tab: merged"));
if (scene.points.review) C.push(callout(3, pt(scene.points.review), [420, 64], "red tab: under review"));
if (scene.points.front) C.push(callout(4, pt(scene.points.front), [W - 200, 64], "front card: latest pull request"));
const H = Math.round(AY + art.h + 54);

const svg = page({
  width: W,
  height: H,
  fig: 5,
  chapter: "04",
  title: "Open source · card index",
  caption: `Card index: ${projects.length} projects, one card per pull request (${MERGED} merged, ${OPEN} under review).`,
  note: all.length > MAX ? `+${all.length - MAX} more projects` : "updated hourly",
  heading: `${MERGED} merged and ${OPEN} under review pull requests, by project`,
  label,
  body: art.svg + C.join(""),
});

const out = compact(svg);
mkdirSync(dirname(output) || ".", { recursive: true });
writeFileSync(output, out);
console.log(`wrote ${output} (${(Buffer.byteLength(out) / 1024).toFixed(1)} KB)`);
