#!/usr/bin/env node
// Draws the tech stack as a page of the technical book: an equipment rack with four shelves of
// modules, one per technology, each with its logo and name on a front plate. A numbered tag on the
// rail names each section; the lamp of Symfony, used every day, is lit green.
//
// Usage: node scripts/stack_machine.mjs [out.svg]   (default profile-contrib/stack.svg)
// Node 20+, built-ins only. The figure kit is in scripts/anatomy-book/.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { stackRack } from "./anatomy-book/stack-rack.mjs";
import { callout, compact, page, place } from "./anatomy-book/theme.mjs";
import { logoMark } from "./logos.mjs";

const output = process.argv[2] || "profile-contrib/stack.svg";

// ---------------------------------------------------------------- the stack, shelf by shelf (top first)
// logo: a key of scripts/logos.mjs, or "initials:XY" when Simple Icons has no mark for it.
const SHELVES = [
  [
    {
      label: "Backend",
      items: [
        ["PHP", "php"], ["Symfony", "symfony"], ["Laravel", "laravel"], ["Node.js", "nodedotjs"],
        ["Python", "python"], ["API Platform", "apiplatform"], ["PHPUnit", "initials:PU"], ["Codeception", "initials:CC"],
      ],
    },
  ],
  [
    {
      label: "Frontend",
      items: [
        ["React", "react"], ["Next.js", "nextdotjs"], ["Vue.js", "vuedotjs"], ["Nuxt.js", "nuxtdotjs"], ["JavaScript", "javascript"],
        ["Tailwind CSS", "tailwindcss"], ["Ionic", "ionic"], ["Capacitor", "capacitor"], ["Flutter", "flutter"], ["Cypress", "cypress"],
      ],
    },
  ],
  [
    {
      label: "DevOps & Tools",
      items: [
        ["Docker", "docker"], ["Traefik", "traefikproxy"], ["Jenkins", "jenkins"], ["Postfix", "initials:PF"],
        ["GitHub Actions", "githubactions"], ["Linux", "linux"], ["Nginx", "nginx"], ["Apache", "apache"],
      ],
    },
  ],
  [
    { label: "Database", items: [["MySQL", "mysql"], ["Redis", "redis"], ["MariaDB", "mariadb"]] },
    { label: "IDE & Development", items: [["PhpStorm", "phpstorm"], ["VS Code", "initials:VS"], ["Git", "git"], ["GitHub", "github"]] },
  ],
];
const LIT = "Symfony";
const ALL = SHELVES.flat().flatMap((g) => g.items.map(([name]) => name));
const GROUPS = SHELVES.flat().length;

const W = 840;
const label = `Tech stack drawn as an isometric equipment rack with one module per technology, in ${GROUPS} numbered sections. ${SHELVES.flat()
  .map((g) => `${g.label}: ${g.items.map(([n]) => n).join(", ")}`)
  .join(". ")}. The lamp of ${LIT}, used every day, is lit.`;
const AW = W - 44;
const rack = stackRack({ shelves: SHELVES, lit: LIT, logoMark, width: AW });
const AY = 74;
const art = place(rack.svg, 22, AY, AW);
const s = AW / rack.width;
const C = rack.litPoint ? callout("", [22 + rack.litPoint[0] * s, AY + rack.litPoint[1] * s], [W - 160, 62], `${LIT}, used every day`) : "";
const H = Math.round(AY + art.h + 56);

const svg = page({
  width: W,
  height: H,
  fig: 2,
  chapter: "02",
  title: "Tech stack & skills",
  caption: `Equipment rack: ${ALL.length} modules in ${GROUPS} numbered sections.`,
  note: "",
  heading: "Tech stack and skills",
  label,
  body: art.svg + C,
});

const out = compact(svg);
mkdirSync(dirname(output) || ".", { recursive: true });
writeFileSync(output, out);
console.log(`wrote ${output} (${(Buffer.byteLength(out) / 1024).toFixed(1)} KB)`);
