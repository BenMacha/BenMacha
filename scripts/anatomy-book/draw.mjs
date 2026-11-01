// Line-drawing parts bound to one isometric projection: boxes and cylinders with flat light fills
// (a top, two side tones) and one outline, thin lines, text standing on a face or lying on a top,
// and a projected point for callouts. Every function returns an SVG string.
//
// Materials (class on the solid): "" neutral, "m-s" slab, "m-g" green, "m-r" red, "m-o" red outline.

import * as k from "./iso-kit.mjs";

export const fix = (v) => Math.round(v * 100) / 100;
export const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function kit(P) {
  const at = (p) => k.iso(p, P);
  const poly = (points, closed = true) => k.pathOf(points.map(at), closed);
  const seg = (a, b) => k.segment(a, b, P);
  const depth = (p) => k.depthOf(p, P);

  // A solid from the kit's extrusion: the darker side tones, the lighter ones, the top, then one outline.
  function solid(paths, mat = "", inner = "", extra = "") {
    const dark = paths.shades.slice(0, 2).join("");
    const light = paths.shades.slice(2).join("");
    return `<g class="bx${mat ? " " + mat : ""}"${extra}>${dark ? `<path class="f1" d="${dark}"/>` : ""}${light ? `<path class="f2" d="${light}"/>` : ""}<path class="tp" d="${paths.top}"/>${inner}<path class="ed" d="${paths.outline}${paths.crease}"/></g>`;
  }
  const box = (plan, z, h, mat = "", inner = "", extra = "") => solid(k.slabOf({ r: 0, ...plan }, z, h, P, 1, 0), mat, inner, extra);
  // a round body shades in one side tone; its back rim is part of the outline
  function cyl(cx, cy, r, z, h, mat = "", inner = "", steps = 28) {
    const p = k.cylinder(cx, cy, r, z, h, P, steps);
    return `<g class="bx${mat ? " " + mat : ""}"><path class="f2" d="${p.fill}"/><path class="tp" d="${p.top}"/>${inner}<path class="ed" d="${p.outline}${p.crease}"/></g>`;
  }
  const line = (d, cls = "") => (d ? `<path class="ln${cls ? " " + cls : ""}" d="${d}"/>` : "");

  // Points of a rectangle standing on a face: face "y" is the plane y = at0 (u runs along +x),
  // face "x" the plane x = at0 (u runs along -y), u0/z0 its lower left corner.
  function faceRect(face, at0, u0, z0, w, h) {
    const pts = [[u0, z0], [u0 + w, z0], [u0 + w, z0 + h], [u0, z0 + h]];
    return pts.map(([u, z]) => (face === "y" ? [u, at0, z] : [at0, -u, z]));
  }
  // Text standing on a face, baseline at z.
  function faceText(face, at0, u, z, text, { size = 8, cls = "tx ink", anchor = "middle", weight } = {}) {
    const origin = face === "y" ? [u, at0] : [at0, -u];
    const m = k.sideMatrix(origin, z, P, face === "y" ? "left" : "right");
    return `<text class="${cls}" transform="${m}" font-size="${size}" text-anchor="${anchor}"${weight ? ` font-weight="${weight}"` : ""}>${esc(text)}</text>`;
  }
  // Text lying on a top at height z, running along +x (or +y).
  function topText(x, y, z, text, { size = 8, cls = "tx ink", anchor = "middle", along = "x" } = {}) {
    const m = k.topMatrix([x, y], z, P, along);
    return `<text class="${cls}" transform="${m}" font-size="${size}" text-anchor="${anchor}">${esc(text)}</text>`;
  }
  // An ellipse lying on a face or top (a dial face, a lamp, a port), as a closed path.
  const ringOn = (face, at0, u, z, r, steps = 24) =>
    k.pathOf(k.circleRing(u, z, r, steps).map(([a, b]) => at(face === "y" ? [a, at0, b] : face === "x" ? [at0, -a, b] : [a, b, at0])), true);

  return { at, poly, seg, depth, solid, box, cyl, line, faceRect, faceText, topText, ringOn };
}

// Fits the points to a width and returns the projection with the height they need.
export function fitWidth(points, width, { pad = 6, azimuth = 45, elevation = 30, above = 0, below = 0 } = {}) {
  const probe = k.fitProjection(points, width, 100000, { pad, azimuth, elevation });
  const ys = points.map((p) => k.iso(p, probe)[1]);
  const height = Math.ceil(Math.max(...ys) - Math.min(...ys) + pad * 2 + above + below);
  return { P: { ...probe, origin: [probe.origin[0], probe.origin[1] - Math.min(...ys) + pad + above] }, height };
}

// Fits the points inside width × height (whichever is tighter), centred.
export const fitBox = (points, width, height, { pad = 6, azimuth = 45, elevation = 30 } = {}) => k.fitProjection(points, width, height, { pad, azimuth, elevation });
