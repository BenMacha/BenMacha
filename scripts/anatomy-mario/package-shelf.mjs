// The package shelf: one wooden crate per Packagist package on a workshop shelf. Each crate
// holds a stack of coins in proportion to the package's installs (the biggest gets 8 coins),
// and a mechanical counter on the shelf edge under it gives the true Packagist total.
//
// packageShelf({ packages: [{ name, downloads }] }) → { svg, width, height }

import * as k from './iso-kit.mjs'
import { fix, toolkit } from './parts.mjs'

export function packageShelf({ packages, label = '' }) {
  const W = 640
  const H = 300
  const n = Math.max(1, packages.length)

  const BAY = 70
  const SPAN = BAY * n
  const X0 = -SPAN / 2
  const BENCH = { x: X0 - 40, y: -48, w: SPAN + 80, d: 104, r: 8 }
  const BENCH_H = 10
  const FOOT_H = 5

  const UP_W = 8
  const SHELF = { x: X0 - UP_W, y: -34, w: SPAN + UP_W * 2, d: 46, r: 1 }
  const BOARD_Z = 36
  const BOARD_H = 5
  const TOP_Z = 104
  const LOW_Z = 6

  const CRATE = { w: 52, d: 36, h: 13 }
  const COIN_R = 9
  const COIN_T = 3.4
  const most = Math.max(1, ...packages.map(p => p.downloads))
  const coinsOf = d => (d > 0 ? Math.max(1, Math.round((d / most) * 8)) : 0)

  const extreme = [...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), ...k.boxCorners(SHELF, 0, TOP_Z)]
  const P = k.fitProjection(extreme, W, H, { pad: 12, azimuth: 62 })
  const { at, S, L, D, slab, byDepth, halo, block, coinStack, counter, faceRect, poly } = toolkit(P)

  function bench() {
    const out = [halo(BENCH, -BENCH_H - FOOT_H, BENCH_H)]
    for (const [x, y] of byDepth(k.corners(BENCH, 18)).slice(1)) {
      out.push(S(k.cylinder(x, y, 6.5, -BENCH_H - FOOT_H, 1.4, P, 18), { tone: 'lo' }))
      out.push(S(k.cylinder(x, y, 4.8, -BENCH_H - FOOT_H + 1.4, FOOT_H - 1.4, P, 18), { tone: 'mid' }))
    }
    out.push(S(slab(BENCH, -BENCH_H, BENCH_H, 8, 1.4), { tone: 'mid', inner: L(k.sideSeam(BENCH, -BENCH_H + 3.5, P, 8), { tone: 'faint' }) }))
    out.push(L(k.planOutline(k.insetPlan(BENCH, 5), 0, P), { tone: 'faint' }))
    const screws = k.corners(BENCH, 10)
    out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.1, 0, P, 14)).join(''), { tone: 'lo' }))
    out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }))
    // ruler strip along the front edge
    const strip = { x: X0, y: BENCH.y + BENCH.d - 10, w: SPAN, d: 6, r: 1 }
    out.push(S(slab(strip, 0, 0.6, 3), { tone: 'lo', crease: 'none' }))
    const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y, 0.6, [2, 3.4], P)
    out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }))
    return out.join('')
  }

  // An upright: a post with a row of shelf-pin holes on its front face.
  function upright(x) {
    const plan = { x, y: SHELF.y, w: UP_W, d: SHELF.d, r: 1 }
    const out = [S(slab({ x: x - 1, y: SHELF.y - 1, w: UP_W + 2, d: SHELF.d + 2, r: 1 }, 0, 3, 3, 0.4), { tone: 'lo' })]
    const holes = []
    for (let z = 12; z < TOP_Z - 6; z += 7) holes.push(at([x + UP_W / 2, SHELF.y + SHELF.d, z]))
    out.push(S(slab(plan, 3, TOP_Z - 3, 3, 0.5), { tone: 'mid', inner: D(holes, { size: 0.55, tone: 'lo' }) }))
    out.push(D([at([x + UP_W / 2, SHELF.y + 4, TOP_Z]), at([x + UP_W / 2, SHELF.y + SHELF.d - 4, TOP_Z])], { size: 0.45 }))
    return out.join('')
  }

  function board(z, h, inner = '') {
    const plan = { x: X0, y: SHELF.y, w: SPAN, d: SHELF.d, r: 0.6 }
    return S(slab(plan, z, h, 2, 0.5), { tone: 'mid', inner: L(k.sideSeam(plan, z + h / 2, P, 2), { tone: 'faint' }) + inner })
  }

  // Back panel: a pegboard behind the crates.
  function backPanel() {
    const plan = { x: X0, y: SHELF.y - 1, w: SPAN, d: 3, r: 0 }
    const pegs = []
    for (let x = X0 + 6; x < X0 + SPAN - 3; x += 8) for (let z = BOARD_Z + BOARD_H + 6; z < TOP_Z - 3; z += 8) pegs.push(at([x, SHELF.y + 2, z]))
    const out = [S(slab(plan, 3, TOP_Z - 3, 1), { tone: 'lo', crease: 'none', inner: D(pegs, { size: 0.5, tone: 'lo' }) })]
    // top rail tying the uprights
    out.push(S(slab({ x: X0, y: SHELF.y - 2, w: SPAN, d: 6, r: 0.5 }, TOP_Z - 6, 6, 1, 0.3), { tone: 'mid' }))
    return out.join('')
  }

  function crate(cx, i, pkg) {
    const plan = { x: cx - CRATE.w / 2, y: SHELF.y + 4, w: CRATE.w, d: CRATE.d, r: 0.6 }
    const z = BOARD_Z + BOARD_H
    const wall = 3
    const out = []
    const plank = (p, face) => {
      const lines = []
      for (const zz of [z + CRATE.h / 2]) lines.push(k.sideSeam(p, zz, P, 1))
      if (face === 'y') for (const u of [6, p.w - 6]) lines.push(k.segment([p.x + u, p.y + p.d, z + 1], [p.x + u, p.y + p.d, z + CRATE.h - 1], P))
      return L(lines.join(''), { tone: 'lo' })
    }
    out.push(halo(plan, z, 2, 's'))
    out.push(`<g class="mt-wood">`)
    out.push(S(slab(plan, z, 2.4, 1, 0.3), { tone: 'hi', crease: 'lo' }))
    const backW = { x: plan.x, y: plan.y, w: plan.w, d: wall, r: 0.4 }
    const leftW = { x: plan.x, y: plan.y, w: wall, d: plan.d, r: 0.4 }
    out.push(S(slab(backW, z, CRATE.h, 1, 0.3), { tone: 'hi', crease: 'lo' }))
    out.push(S(slab(leftW, z, CRATE.h, 1, 0.3), { tone: 'hi', crease: 'lo' }))
    out.push('</g>')
    out.push(coinStack([cx, plan.y + plan.d / 2, z + 2.4], coinsOf(pkg.downloads), COIN_R, COIN_T))
    const rightW = { x: plan.x + plan.w - wall, y: plan.y, w: wall, d: plan.d, r: 0.4 }
    const frontW = { x: plan.x, y: plan.y + plan.d - wall, w: plan.w, d: wall, r: 0.4 }
    out.push(`<g class="mt-wood">`)
    out.push(S(slab(rightW, z, CRATE.h, 1, 0.3), { tone: 'hi', crease: 'lo', inner: plank(rightW, 'x') }))
    out.push(S(slab(frontW, z, CRATE.h, 1, 0.3), { tone: 'hi', crease: 'lo', inner: plank(frontW, 'y') }))
    // stencilled package number on the front slat
    const fy = plan.y + plan.d
    const lbl = faceRect('y', fy, cx - 7, z + 2.5, 14, 8, 0.8, 2)
    out.push(`<path class="iso-label" d="${poly(lbl)}"/>`)
    out.push('</g>')
    const m = k.sideMatrix([cx, fy], z + 4, P, 'left')
    out.push(`<text class="iso-glyph" transform="${m}" font-size="5" text-anchor="middle">${i + 1}</text>`)
    out.push(D(k.corners(plan, 1.5).map(([x, y]) => at([x, y, z + CRATE.h])), { size: 0.45, tone: 'hi' }))
    return out.join('')
  }

  const bays = packages.map((p, i) => ({ p, i, cx: X0 + BAY * (i + 0.5) }))
  const counters = bays.map(({ p, i, cx }) => `<g data-p="pkg${i}">${counter(SHELF.y + SHELF.d, cx - 20, BOARD_Z - 15, p.downloads, { digits: 4, w: 40, h: 14, kind: 'merged' })}</g>`).join('')
  // a bracket under the board at each bay joint
  const brackets = bays.slice(1).map(({ cx }) => {
    const x = cx - BAY / 2
    return S(slab({ x: x - 1.5, y: SHELF.y + 4, w: 3, d: SHELF.d - 10, r: 0.3 }, BOARD_Z - 10, 10, 1), { tone: 'mid' })
  }).join('')

  // spare blocks on the low board: a "?" block, a brick and a used block
  const spares = [
    halo({ x: X0 + SPAN + 14, y: 20, w: 34, d: 18, r: 0 }, 0, 2, 's'),
    block([X0 + SPAN + 22, 30, 0], { w: 16, d: 16, h: 14 }, 'brick'),
    block([X0 + SPAN + 40, 27, 0], { w: 16, d: 16, h: 14 }, 'q'),
    block([X0 + SPAN + 31, 29, 14], { w: 16, d: 16, h: 14 }, 'used'),
  ]

  const art = [
    bench(),
    backPanel(),
    upright(X0 - UP_W),
    board(LOW_Z, 4),
    brackets,
    board(BOARD_Z, BOARD_H),
    counters,
    ...bays.map(({ p, i, cx }) => `<g class="iso-lift" data-p="pkg${i}">${crate(cx, i, p)}</g>`),
    upright(X0 + SPAN),
    ...spares,
  ]

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label.replace(/"/g, '&quot;')}">${art.join('')}</svg>`
  return { svg, width: W, height: H, fix }
}
