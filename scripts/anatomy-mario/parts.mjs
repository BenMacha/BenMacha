// Shared parts for the open source figures: helpers bound to one projection, plus the
// Mario pieces (a "?" block, a hit block, a coin stack, a mechanical counter) built from
// the Anatomy kit's solids. Every function returns an SVG string; nothing touches the DOM,
// so the figures render the same on the server (prerender) and in the browser.

import * as k from './iso-kit.mjs'

export const fix = v => Math.round(v * 100) / 100
export const esc = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Helpers bound to the projection `P`. */
export function toolkit(P) {
  const at = p => k.iso(p, P)
  const S = (paths, style) => k.solidSvg(paths, style)
  const L = (d, style) => k.lineSvg(d, style)
  const D = (points, style) => k.dotsSvg(points, style)
  const slab = (plan, z, h, steps = 3, bevel = 0) => k.slabOf(plan, z, h, P, steps, bevel)
  const depth = ([x, y, z = 0]) => k.depthOf([x, y, z], P)
  const byDepth = points => [...points].sort((a, b) => depth(a) - depth(b))
  const poly = (points, closed = true) => k.pathOf(points.map(at), closed)
  const shift = (dx, dy, dz) => {
    const [x, y] = k.axisVector(P, [dx, dy, dz])
    return [fix(x), fix(y)]
  }
  const halo = (plan, z, h, size = 'l') => `<path class="iso-halo" data-size="${size}" d="${k.haloOf(plan, z, h, P)}"/>`
  const voidPath = d => `<path class="iso-void" d="${d}"/>`

  // A rounded rectangle standing on a vertical face: face "y" lies in the plane y = const
  // (local u = +x), face "x" in the plane x = const (local u = -y). Returns world points.
  function faceRect(face, at0, u0, z0, w, h, r = 1, steps = 3) {
    const ring = k.roundedPlan({ x: u0, y: z0, w, d: h, r }, steps)
    return ring.map(([u, z]) => (face === 'y' ? [u, at0, z] : [at0, -u, z]))
  }

  // Text standing on a vertical face (plane y = const or x = const), baseline at z.
  function faceText(face, at0, u, z, text, { size = 8, cls = 'iso-glyph', anchor = 'middle' } = {}) {
    const origin = face === 'y' ? [u, at0] : [at0, -u]
    const m = k.sideMatrix(origin, z, P, face === 'y' ? 'left' : 'right')
    return `<text class="${cls}" transform="${m}" font-size="${size}" text-anchor="${anchor}">${esc(text)}</text>`
  }

  // A Mario block (cube) with its centre at (cx, cy) standing on z.
  // kind "q": "?" block with rivets; "used": the brown block left after a hit; "brick".
  function block([cx, cy, z], size, kind = 'q', extra = '') {
    const { w, d, h } = size
    const plan = { x: cx - w / 2, y: cy - d / 2, w, d, r: 0.4 }
    const top = z + h
    const out = []
    const front = plan.y + d
    const right = plan.x + w
    const inner = []
    if (kind === 'q' || kind === 'used') {
      // rivets at the corners of both visible faces and of the top
      const inset = 2.2
      const rivets = [
        [plan.x + inset, front, top - inset], [right - inset, front, top - inset],
        [plan.x + inset, front, z + inset], [right - inset, front, z + inset],
        [right, plan.y + inset, top - inset], [right, front - inset, top - inset],
        [right, plan.y + inset, z + inset], [right, front - inset, z + inset],
      ]
      inner.push(D(rivets.map(at), { size: 0.55, tone: 'hi' }))
    }
    if (kind === 'brick') {
      const rows = 3
      const lines = []
      for (let i = 1; i < rows; i++) {
        const zr = z + (h / rows) * i
        lines.push(k.segment([plan.x, front, zr], [right, front, zr], P), k.segment([right, plan.y, zr], [right, front, zr], P))
      }
      inner.push(L(lines.join(''), { tone: 'lo' }))
    }
    out.push(`<g class="mt-${kind}"${extra}>`)
    out.push(S(slab(plan, z, h, 1, 0.5), { tone: 'hi', crease: 'lo', inner: inner.join('') }))
    if (kind === 'q') {
      out.push(faceText('y', front, cx, z + h * 0.24, '?', { size: h * 0.62 }))
      out.push(faceText('x', right, -cy, z + h * 0.24, '?', { size: h * 0.62 }))
    }
    out.push('</g>')
    return out.join('')
  }

  // A stack of `count` coins, each `t` thick, centred on (cx, cy) from z up.
  function coinStack([cx, cy, z], count, r = 7, t = 2.2, extra = '') {
    if (count <= 0) return ''
    const seams = []
    for (let i = 1; i < count; i++) seams.push(k.sideArc(cx, cy, r, z + i * t, P, 24))
    const reeds = k.knurl(cx, cy, r, z, z + count * t, 28, P, 0.5)
    const topZ = z + count * t
    const face = [
      L(k.ring(cx, cy, r - 1.6, topZ, P, 28), { tone: 'mid' }),
      L(k.lineOnTop([cx - 1.1, cy - 2.6], [cx - 1.1, cy + 2.6], topZ, P) + k.lineOnTop([cx + 1.1, cy - 2.6], [cx + 1.1, cy + 2.6], topZ, P), { tone: 'mid', free: true }),
    ].join('')
    return `<g class="mt-coin"${extra}>${S(k.cylinder(cx, cy, r, z, count * t, P, 28, 0.4), { tone: 'hi', crease: 'mid', inner: L(reeds, { tone: 'faint' }) + L(seams.join(''), { tone: 'lo' }) })}${face}</g>`
  }

  // A mechanical counter on the front (+y) face of a stand: bezel, dark window, digits.
  function counter(y0, x0, z0, value, { digits = 3, kind = 'merged', w = 34, h = 15 } = {}) {
    const text = String(Math.min(value, 10 ** digits - 1)).padStart(digits, '0')
    const out = []
    const bezel = { x: x0, y: y0, w, d: 1.4, r: 0.5 }
    out.push(S(slab(bezel, z0, h, 2, 0.3), { tone: 'mid' }))
    const front = y0 + 1.4
    const win = faceRect('y', front, x0 + 2, z0 + 1.8, w - 4, h - 3.6, 0.8, 2)
    out.push(`<path class="iso-screen" d="${poly(win)}"/>`, `<path class="iso-line" data-tone="lo" d="${poly(win)}"/>`)
    const cell = (w - 4) / digits
    const seps = []
    for (let i = 1; i < digits; i++) {
      const u = x0 + 2 + cell * i
      seps.push(k.segment([u, front, z0 + 1.8], [u, front, z0 + h - 1.8], P))
    }
    out.push(L(seps.join(''), { tone: 'faint' }))
    const m = k.sideMatrix([x0 + w / 2, front], z0 + h / 2 - 2.6, P, 'left')
    const glyphs = [...text].map((c, i) => `<tspan x="${fix((i - (digits - 1) / 2) * cell)}">${c}</tspan>`).join('')
    out.push(`<text class="iso-digits" data-kind="${kind}" transform="${m}" font-size="${fix(Math.min(cell * 0.78, h * 0.42))}" text-anchor="middle">${glyphs}</text>`)
    out.push(D([at([x0 + 1, front, z0 + h / 2]), at([x0 + w - 1, front, z0 + h / 2])], { size: 0.4 }))
    return out.join('')
  }

  return { at, S, L, D, slab, depth, byDepth, poly, shift, halo, voidPath, faceRect, faceText, block, coinStack, counter }
}

/**
 * Spread `slots` drawn items over groups in proportion to their counts (largest remainder),
 * every non-empty group getting at least one. Returns one id per slot, grouped.
 */
export function allocate(groups, slots) {
  const total = groups.reduce((s, g) => s + g.count, 0)
  if (!total) return []
  const n = Math.min(slots, total)
  const live = groups.filter(g => g.count > 0)
  const quota = live.map(g => ({ id: g.id, q: (g.count / total) * n }))
  const take = quota.map(g => ({ id: g.id, n: Math.max(1, Math.floor(g.q)), r: g.q - Math.floor(g.q) }))
  let used = take.reduce((s, g) => s + g.n, 0)
  for (const g of [...take].sort((a, b) => b.r - a.r)) {
    if (used >= n) break
    g.n++
    used++
  }
  while (used > n) {
    const biggest = take.reduce((a, b) => (b.n > a.n ? b : a))
    biggest.n--
    used--
  }
  return take.flatMap(g => Array.from({ length: g.n }, () => g.id))
}
