// Shared look of the profile drawings: Anatomy's tones remapped to GitHub's light and dark
// palettes (switched by prefers-color-scheme inside the SVG), the base rules for the kit's
// solids and lines, and a compaction pass for the written file.

export const LIGHT = `--anatomy-paper:#ffffff;--anatomy-face:#ffffff;--anatomy-top:#ffffff;
--anatomy-shade-0:#d8dde2;--anatomy-shade-1:#e2e6ea;--anatomy-shade-2:#ebeef1;--anatomy-shade-3:#f3f5f7;
--anatomy-lit-top:#ffffff;--anatomy-lit-shade:#eef1f4;
--anatomy-hi:#24292f;--anatomy-mid:#848d97;--anatomy-lo:#b3bac1;--anatomy-faint:#d5dae0;--anatomy-lit:#000000;
--anatomy-halo:#8c959f;--anatomy-halo-opacity:.34;--anatomy-dot:#3d444d;--void:#e3e7eb;
--card:#ffffff;--border:#d0d7de;--text:#59636e;--strong:#1f2328;--muted:#818b98;--merged:#8250df;--review:#1a7f37;
--blue:#0969da;--purple:#8250df;--green:#1a7f37;--orange:#bc4c00;--red:#cf222e;--pink:#bf3989;--cyan:#1b7c83;--yellow:#9a6700;--tint:.13;--digit:#ffffff`;
export const DARK = `--anatomy-paper:#0d1117;--anatomy-face:#161b22;--anatomy-top:#161c24;
--anatomy-shade-0:#0b0e13;--anatomy-shade-1:#0e1218;--anatomy-shade-2:#11161d;--anatomy-shade-3:#141a22;
--anatomy-lit-top:#202833;--anatomy-lit-shade:#181e27;
--anatomy-hi:#d1d9e0;--anatomy-mid:#6a737d;--anatomy-lo:#3d444d;--anatomy-faint:#262c35;--anatomy-lit:#ffffff;
--anatomy-halo:#010409;--anatomy-halo-opacity:.9;--anatomy-dot:#e6edf3;--void:#05070a;
--card:#0d1117;--border:#30363d;--text:#9198a1;--strong:#e6edf3;--muted:#656c76;--merged:#a371f7;--review:#3fb950;
--blue:#4493f8;--purple:#ab7df8;--green:#3fb950;--orange:#f0883e;--red:#f85149;--pink:#db61a2;--cyan:#39c5cf;--yellow:#d29922;--tint:.2;--digit:#e6edf3`;
export const BASE_CSS = `
.iso{${LIGHT}}
@media (prefers-color-scheme:dark){.iso{${DARK}}}
.iso path,.iso circle{vector-effect:non-scaling-stroke}
.card{fill:var(--card);stroke:var(--border)}
.iso-fill{fill:var(--anatomy-paper);stroke:none}
.iso-solid[data-lit]>.iso-fill{fill:var(--anatomy-face)}
.iso-shade,.iso-top{stroke:none}
.iso-shade[data-shade="0"]{fill:var(--anatomy-shade-0)}
.iso-shade[data-shade="1"]{fill:var(--anatomy-shade-1)}
.iso-shade[data-shade="2"]{fill:var(--anatomy-shade-2)}
.iso-shade[data-shade="3"]{fill:var(--anatomy-shade-3)}
.iso-top{fill:var(--anatomy-top)}
.iso-solid[data-lit]>.iso-top{fill:var(--anatomy-lit-top)}
.iso-solid[data-lit]>.iso-shade{fill:var(--anatomy-lit-shade)}
.iso-solid[data-lit]>.iso-edge{stroke:var(--anatomy-lit)}
.iso-halo{fill:var(--anatomy-halo);stroke:none;opacity:var(--anatomy-halo-opacity)}
.iso-line{fill:none;stroke:var(--anatomy-lo);stroke-width:.7px;stroke-linecap:round;stroke-linejoin:round}
.iso-line[data-tone="hi"]{stroke:var(--anatomy-hi)}
.iso-line[data-tone="mid"]{stroke:var(--anatomy-mid)}
.iso-line[data-tone="faint"]{stroke:var(--anatomy-faint)}
.iso-line[data-tone="lit"]{stroke:var(--anatomy-lit)}
.iso-dots circle{fill:var(--anatomy-dot);stroke:none;opacity:.32}
.iso-dots[data-tone="hi"] circle{opacity:.85}
.iso-dots[data-tone="mid"] circle{opacity:.45}
.iso-dots[data-tone="lo"] circle{opacity:.22}
.void{fill:var(--void);stroke:none}
.mono{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10.5px;letter-spacing:.04em;fill:var(--muted)}
.caps{text-transform:uppercase;letter-spacing:.1em}
.ro{fill:var(--text)}
.sans{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif}
.iso .logo{fill:var(--strong);stroke:none;vector-effect:none}
.c-blue{--c:var(--blue)}.c-purple{--c:var(--purple)}.c-green{--c:var(--green)}.c-orange{--c:var(--orange)}.c-red{--c:var(--red)}.c-pink{--c:var(--pink)}.c-cyan{--c:var(--cyan)}.c-yellow{--c:var(--yellow)}
.fc{fill:var(--c);stroke:none}.tc{fill:var(--c);fill-opacity:var(--tint);stroke:none}.sc{stroke:var(--c)}.xc{fill:var(--c)}
`;

// Shorter class names and implicit line-to commands keep the file small; the drawing is unchanged.
export const SHORT = { "iso-solid": "so", "iso-fill": "fi", "iso-shade": "sh", "iso-top": "tp", "iso-line": "ln", "iso-crease": "cr", "iso-bevel": "bv", "iso-edge": "ed", "iso-dots": "dt", "iso-halo": "ha", "data-shade": "data-s", "data-tone": "data-t", "data-lit": "data-l" };
export const compact = (text) =>
  text
    .replace(/\b(iso-(?:solid|fill|shade|top|line|crease|bevel|edge|dots|halo)|data-(?:shade|tone|lit))\b/g, (name) => SHORT[name])
    .replace(/ data-free="[^"]*"/g, "")
    .replace(/(<path class="ln[^"]*") data-t="lo"/g, "$1")
    .replace(/ d="([MLZ0-9 .-]*)"/g, (_, d) => ` d="${d.replace(/L/g, " ").replace(/ -/g, "-")}"`);
