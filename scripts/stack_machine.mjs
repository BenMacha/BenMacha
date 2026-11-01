#!/usr/bin/env node
// Draws the tech stack as a Mario item cabinet: a brick cabinet on a grass-topped ground block with
// four wooden shelves of item blocks, one per technology in the colour of its group, each with its
// logo and name. A coin tag on the rail names each group; a coin bobs above Symfony, used every day.
//
// Usage: node scripts/stack_machine.mjs [out.svg]   (default profile-contrib/stack.svg)
// Node 20+, built-ins only. The figure kit is in scripts/anatomy-mario/.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { stackLevel } from "./anatomy-mario/stack-level.mjs";
import { card, compact, place } from "./anatomy-mario/theme.mjs";
import { logoMark } from "./logos.mjs";

const output = process.argv[2] || "profile-contrib/stack.svg";

// ---------------------------------------------------------------- the stack, shelf by shelf (top first)
// logo: a key of scripts/logos.mjs, or "initials:XY" when Simple Icons has no mark for it.
const SHELVES = [
  [
    {
      label: "Backend",
      color: "purple",
      items: [
        ["PHP", "php"], ["Symfony", "symfony"], ["Laravel", "laravel"], ["Node.js", "nodedotjs"],
        ["Python", "python"], ["API Platform", "apiplatform"], ["PHPUnit", "initials:PU"], ["Codeception", "initials:CC"],
      ],
    },
  ],
  [
    {
      label: "Frontend",
      color: "blue",
      items: [
        ["React", "react"], ["Next.js", "nextdotjs"], ["Vue.js", "vuedotjs"], ["Nuxt.js", "nuxtdotjs"], ["JavaScript", "javascript"],
        ["Tailwind CSS", "tailwindcss"], ["Ionic", "ionic"], ["Capacitor", "capacitor"], ["Flutter", "flutter"], ["Cypress", "cypress"],
      ],
    },
  ],
  [
    {
      label: "DevOps & Tools",
      color: "orange",
      items: [
        ["Docker", "docker"], ["Traefik", "traefikproxy"], ["Jenkins", "jenkins"], ["Postfix", "initials:PF"],
        ["GitHub Actions", "githubactions"], ["Linux", "linux"], ["Nginx", "nginx"], ["Apache", "apache"],
      ],
    },
  ],
  [
    { label: "Database", color: "green", items: [["MySQL", "mysql"], ["Redis", "redis"], ["MariaDB", "mariadb"]] },
    { label: "IDE & Development", color: "pink", items: [["PhpStorm", "phpstorm"], ["VS Code", "initials:VS"], ["Git", "git"], ["GitHub", "github"]] },
  ],
];
const LIT = "Symfony";
const ALL = SHELVES.flat().flatMap((g) => g.items.map(([name]) => name));
const GROUPS = SHELVES.flat().length;

const W = 840;
const label = `Tech stack drawn as a Mario item cabinet with one item block per technology. ${SHELVES.flat()
  .map((g) => `${g.label}: ${g.items.map(([n]) => n).join(", ")}`)
  .join(". ")}.`;
const art = place(stackLevel({ shelves: SHELVES, lit: LIT, logoMark, label }).svg, 14, 40, W - 28);
const H = Math.round(40 + art.h + 34);

const svg = card({
  width: W,
  height: H,
  fig: "Fig 2",
  title: "Tech stack & skills",
  hint: `${ALL.length} tools in ${GROUPS} groups`,
  readout: `coin · ${LIT}, used every day`,
  heading: "Tech stack and skills",
  label,
  body: art.svg,
});

const out = compact(svg);
mkdirSync(dirname(output) || ".", { recursive: true });
writeFileSync(output, out);
console.log(`wrote ${output} (${(Buffer.byteLength(out) / 1024).toFixed(1)} KB)`);
