// The pull request machine: an isometric bench where "?" blocks (pull requests) drop out of
// a warp pipe onto an indexing conveyor and pass under a review stamp. The stamp hits each
// block, the block turns into a used block and pays a coin. Merged pull requests are the
// coins piled in the brick crate; pull requests still under review wait as "?" blocks in the
// holding tray. The dial on the station reads the share merged, and two counters give the
// true totals (the crate and the tray draw at most 12 pieces each).
//
// prMachine({ projects: [{ id, merged, open }], idPrefix }) → { svg, width, height }

import * as k from './iso-kit.mjs'
import { allocate, fix, toolkit } from './parts.mjs'

export function prMachine({ projects, idPrefix = 'prm', label = '' }) {
  const MERGED = projects.reduce((s, p) => s + p.merged, 0)
  const OPEN = projects.reduce((s, p) => s + p.open, 0)
  const TOTAL = MERGED + OPEN
  const SHARE = TOTAL ? MERGED / TOTAL : 0

  const W = 640
  const H = 330

  // ---------------------------------------------------------------- world (units ~ 1 px of the object)
  const BENCH = { x: -262, y: -78, w: 524, d: 166, r: 9 }
  const BENCH_H = 12
  const FOOT_H = 5

  const BELT_Y = -20
  const BELT = { x0: -192, x1: 150 }
  const RAIL_Z = 14
  const RAIL_TOP = 25
  const BELT_TOP = 22
  const STEP = 66
  const DWELL = [-198, -132, -66, 0, 66, 132]
  const STATION = 0

  const CUBE = { w: 18, d: 18, h: 16 }

  const PLINTH = { x: -248, y: -50, w: 58, d: 60, r: 2 }
  const PLINTH_H = 44
  const PIPE = [PLINTH.x + PLINTH.w / 2, PLINTH.y + PLINTH.d / 2]
  const PIPE_R = 19
  const PIPE_TOP = 74
  const LIP_R = 23
  const LIP_H = 10

  const POST_R = 3.6
  const POSTS = [[STATION, BELT_Y - 31], [STATION, BELT_Y + 29]]
  const BEAM = { x: STATION - 8, y: BELT_Y - 37, w: 16, d: 74, r: 2 }
  const BEAM_Z = 70
  const BEAM_H = 8
  const DIAL = [STATION, BELT_Y - 4]
  const DIAL_R = 18
  const DIAL_Z = BEAM_Z + BEAM_H + 2.5
  const DIAL_H = 7
  const DIAL_TOP = DIAL_Z + DIAL_H
  const HEAD_Z = BELT_TOP + CUBE.h + 3
  const PRESS = 3

  const TRAY = { x: -176, y: 18, w: 168, d: 56, r: 3 }
  const TRAY_RIM = 6

  const CRATE = { x: 160, y: -54, w: 88, d: 68, r: 2.5 }
  const CRATE_WALL = 4
  const CRATE_H = 14

  const PANEL = { x: 104, y: 40, w: 48, d: 30, r: 2.5 }
  const PANEL_H = 9

  const extreme = [
    ...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0),
    [STATION, BEAM.y, DIAL_TOP + 2],
    [STATION, BEAM.y + BEAM.d, DIAL_TOP + 2],
    [PIPE[0] - LIP_R, PIPE[1], PIPE_TOP + LIP_H + 2],
    [PIPE[0], PIPE[1] - LIP_R, PIPE_TOP + LIP_H + 2],
  ]
  const P = k.fitProjection(extreme, W, H, { pad: 10, azimuth: 66 })
  const t = toolkit(P)
  const { at, S, L, D, slab, byDepth, poly, shift, halo, voidPath, faceRect, block, coinStack, counter } = t

  // ---------------------------------------------------------------- parts
  function bench() {
    const out = [halo(BENCH, -BENCH_H - FOOT_H, BENCH_H)]
    for (const [x, y] of byDepth(k.corners(BENCH, 24)).slice(1)) {
      out.push(S(k.cylinder(x, y, 7.5, -BENCH_H - FOOT_H, 1.6, P, 18), { tone: 'lo' }))
      out.push(S(k.cylinder(x, y, 5.6, -BENCH_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 18), { tone: 'mid' }))
    }
    out.push(S(slab(BENCH, -BENCH_H, BENCH_H, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(BENCH, -BENCH_H + 4, P, 8), { tone: 'faint' }) }))
    out.push(L(k.planOutline(k.insetPlan(BENCH, 5), 0, P), { tone: 'faint' }))
    const screws = k.corners(BENCH, 11)
    out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.3, 0, P, 14)).join(''), { tone: 'lo' }))
    out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.55 }))
    // ruler strip along the front edge
    const strip = { x: 6, y: BENCH.y + BENCH.d - 11, w: 160, d: 6.5, r: 1 }
    out.push(S(slab(strip, 0, 0.6, 3), { tone: 'lo', crease: 'none' }))
    const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y, 0.6, [2, 3.6], P)
    out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }))
    out.push(D([at([strip.x + 2, strip.y + 3.3, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.3, 0.6])], { size: 0.45 }))
    return out.join('')
  }

  // Intake: a square plinth with the belt's exit slot, and a green warp pipe standing on it.
  function intake() {
    const out = [halo(PLINTH, 0, 4, 's')]
    out.push(S(slab(PLINTH, 0, 4, 3, 0.6), { tone: 'lo' }))
    const body = k.insetPlan(PLINTH, 3)
    out.push(S(slab(body, 4, PLINTH_H - 4, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(body, 9, P, 3), { tone: 'faint' }) }))
    out.push(D(k.corners(body, 2.4).map(([x, y]) => at([x, y, PLINTH_H])), { size: 0.45 }))
    // label plate on the front face, three rule lines standing for text
    const fy = body.y + body.d
    const plate = faceRect('y', fy, body.x + 6, 6.5, 22, 12, 1)
    out.push(`<path class="iso-line" data-tone="lo" d="${poly(plate)}"/>`)
    ;[[body.x + 9, body.x + 24], [body.x + 9, body.x + 20], [body.x + 9, body.x + 22]].forEach(([a, b], i) =>
      out.push(L(k.segment([a, fy, 15.5 - i * 3], [b, fy, 15.5 - i * 3], P), { tone: 'lo', free: true })))
    // exit slot on the +x face where the belt comes out
    const fx = body.x + body.w
    const slot = faceRect('x', fx, -(BELT_Y + 15), BELT_TOP - 1, 30, CUBE.h + 3, 1.5)
    out.push(voidPath(poly(slot)), `<path class="iso-line" data-tone="lo" d="${poly(slot)}"/>`)
    // warp pipe: flange ring, body, lip, dark mouth
    const [px, py] = PIPE
    out.push(S(k.cylinder(px, py, PIPE_R + 3, PLINTH_H, 2, P, 40, 0.4), { tone: 'mid' }))
    out.push(D([0, 1, 2, 3, 4, 5].map(i => at([px + Math.cos(i * Math.PI / 3 + 0.3) * (PIPE_R + 1.6), py + Math.sin(i * Math.PI / 3 + 0.3) * (PIPE_R + 1.6), PLINTH_H + 2])), { size: 0.45 }))
    const shine = k.knurl(px, py, PIPE_R, PLINTH_H + 2, PIPE_TOP, 7, P, 0.6)
    out.push(`<g class="mt-pipe">`)
    out.push(S(k.cylinder(px, py, PIPE_R, PLINTH_H + 2, PIPE_TOP - PLINTH_H - 2, P, 40), { tone: 'hi', crease: 'none', inner: L(shine, { tone: 'faint' }) }))
    out.push(S(k.cylinder(px, py, LIP_R, PIPE_TOP, LIP_H, P, 40, 0.6), { tone: 'hi', crease: 'lo', inner: L(k.sideArc(px, py, LIP_R, PIPE_TOP + LIP_H / 2, P, 40), { tone: 'faint' }) }))
    out.push(`<path class="iso-hole" d="${k.ring(px, py, LIP_R - 4, PIPE_TOP + LIP_H, P, 40)}"/>`)
    out.push(L(k.ring(px, py, LIP_R - 4, PIPE_TOP + LIP_H, P, 40), { tone: 'lo' }))
    out.push('</g>')
    return out.join('')
  }

  function motor() {
    const out = []
    const plan = { x: 92, y: BELT_Y - 46, w: 36, d: 20, r: 2 }
    out.push(halo(plan, 0, 3, 's'))
    out.push(S(slab({ x: plan.x - 3, y: plan.y - 2, w: plan.w + 6, d: plan.d + 4, r: 1.5 }, 0, 3, 3, 0.5), { tone: 'lo' }))
    const ribs = []
    for (let x = plan.x + 4; x <= plan.x + plan.w - 4; x += 4) ribs.push(k.segment([x, plan.y + plan.d, 6], [x, plan.y + plan.d, 21], P))
    out.push(S(slab(plan, 3, 21, 4, 0.8), { tone: 'mid', inner: L(ribs.join(''), { tone: 'faint' }) }))
    out.push(L(k.planOutline(k.insetPlan(plan, 3), 24, P, 3), { tone: 'faint' }))
    const box = { x: plan.x + 6, y: plan.y + 4, w: 12, d: 10, r: 1 }
    out.push(S(slab(box, 24, 6, 2, 0.4), { tone: 'mid' }))
    out.push(D(k.corners(box, 2).map(([x, y]) => at([x, y, 30])), { size: 0.4 }))
    out.push(S(k.cylinder(plan.x + plan.w - 8, plan.y + plan.d / 2, 4, 24, 3, P, 20), { tone: 'mid' }))
    out.push(S(slab({ x: plan.x + plan.w - 16, y: plan.y + plan.d, w: 10, d: BELT_Y - 22 - plan.y - plan.d + 1, r: 1 }, 12, 8, 2, 0.4), { tone: 'mid' }))
    return out.join('')
  }

  function post([x, y]) {
    const out = []
    out.push(S(k.cylinder(x, y, 6.5, 0, 2, P, 18, 0.4), { tone: 'lo' }))
    out.push(D([0, 1, 2, 3].map(i => at([x + Math.cos(i * Math.PI / 2 + 0.4) * 5, y + Math.sin(i * Math.PI / 2 + 0.4) * 5, 2])), { size: 0.4 }))
    out.push(S(k.cylinder(x, y, 4.6, 2, 4, P, 14), { tone: 'mid' }))
    const seams = [28, 50].map(z => k.sideArc(x, y, POST_R, z, P, 14)).join('')
    out.push(S(k.cylinder(x, y, POST_R, 6, BEAM_Z - 6, P, 14), { tone: 'mid', crease: 'none', inner: L(seams, { tone: 'faint' }) }))
    return out.join('')
  }

  function legs(y) {
    const out = []
    for (const x of [-168, -40, 112]) {
      out.push(S(slab({ x: x - 2.2, y: y - 2.2, w: 4.4, d: 4.4, r: 0 }, 0, RAIL_Z, 1), { tone: 'mid' }))
      out.push(D([at([x - 3.4, y + 3.4, 0]), at([x + 3.4, y + 3.4, 0])], { size: 0.4 }))
    }
    return out.join('')
  }

  function rail(y0) {
    const plan = { x: BELT.x0, y: y0, w: BELT.x1 - BELT.x0, d: 4, r: 1 }
    const bolts = []
    for (let x = BELT.x0 + 8; x < BELT.x1 - 4; x += 22) bolts.push(at([x, y0 + 2, RAIL_TOP]))
    return S(slab(plan, RAIL_Z, RAIL_TOP - RAIL_Z, 2, 0.4), { tone: 'mid', inner: L(k.sideSeam(plan, RAIL_Z + 4, P, 2), { tone: 'faint' }) }) + D(bolts, { size: 0.42 })
  }

  function belt() {
    const out = []
    const plan = { x: BELT.x0, y: BELT_Y - 16, w: BELT.x1 - BELT.x0, d: 32, r: 0 }
    out.push(S(slab({ ...plan, r: 4 }, RAIL_Z + 2, BELT_TOP - RAIL_Z - 2, 4), { tone: 'lo' }))
    const clip = k.planOutline(plan, BELT_TOP, P, 1)
    const lines = []
    for (let x = BELT.x0 - STEP; x <= BELT.x1; x += STEP / 10) lines.push(k.lineOnTop([x, plan.y], [x, plan.y + plan.d], BELT_TOP, P))
    out.push(`<clipPath id="${idPrefix}-belt"><path d="${clip}"/></clipPath><g clip-path="url(#${idPrefix}-belt)"><g class="${idPrefix}-cleats">${L(lines.join(''), { tone: 'faint' })}</g></g>`)
    out.push(L(k.sideRing([BELT.x1, BELT_Y + 18, RAIL_Z + 5.5], 2.2, 'x', P, 14), { tone: 'lo' }))
    out.push(D([at([BELT.x1, BELT_Y + 18, RAIL_Z + 5.5])], { size: 0.5 }))
    return out.join('')
  }

  function railCaps() {
    const out = []
    for (const y of [BELT_Y - 22, BELT_Y + 18]) {
      const plan = { x: BELT.x1 - 2, y, w: 5, d: 4, r: 0.8 }
      out.push(S(slab(plan, RAIL_Z - 2, RAIL_TOP - RAIL_Z + 4, 2, 0.4), { tone: 'mid' }))
    }
    return out.join('')
  }

  // The stamp: a rod out of the gland and a red hammer head (the one lit part).
  function stamp() {
    const out = []
    const [x, y] = [STATION, BELT_Y]
    out.push(S(k.cylinder(x, y, 2, HEAD_Z + 6, BEAM_Z - 7 - HEAD_Z - 6, P, 18), { tone: 'mid', crease: 'none' }))
    out.push(S(k.cylinder(x, y, 4.2, HEAD_Z + 6, 2.5, P, 14), { tone: 'mid' }))
    const head = { x: x - 10, y: y - 11, w: 20, d: 22, r: 1.5 }
    out.push(`<g class="mt-red">`)
    out.push(S(slab(head, HEAD_Z + 1, 5, 3, 0.5), { tone: 'hi', crease: 'lo', inner: L(k.sideSeam(head, HEAD_Z + 3, P, 3), { tone: 'faint' }) }))
    out.push('</g>')
    out.push(S(slab(k.insetPlan(head, 1.2), HEAD_Z, 1, 3), { tone: 'lo', crease: 'none' }))
    out.push(D(k.corners(head, 2.4).map(([px, py]) => at([px, py, HEAD_Z + 6])), { size: 0.42, tone: 'hi' }))
    return out.join('')
  }

  function gland() {
    const [x, y] = [STATION, BELT_Y]
    const plan = { x: x - 6, y: y - 6, w: 12, d: 12, r: 1.5 }
    return S(slab(plan, BEAM_Z - 7, 7, 3, 0.4), { tone: 'mid' }) + L(k.sideArc(x, y, 2.6, BEAM_Z - 7, P, 12), { tone: 'faint' })
  }

  function beam() {
    const out = []
    out.push(S(slab(BEAM, BEAM_Z, BEAM_H, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(BEAM, BEAM_Z + 3, P, 3), { tone: 'faint' }) }))
    out.push(D(POSTS.map(([x, y]) => at([x, y, BEAM_Z + BEAM_H])), { size: 0.55 }))
    out.push(L(POSTS.map(([x, y]) => k.ring(x, y, 2.4, BEAM_Z + BEAM_H, P, 14)).join(''), { tone: 'lo' }))
    const [dx, dy] = DIAL
    out.push(S(slab({ x: dx - 7, y: dy - 7, w: 14, d: 14, r: 1.5 }, BEAM_Z + BEAM_H, 2.5, 3, 0.3), { tone: 'mid' }))
    out.push(S(k.cylinder(dx, dy, DIAL_R, DIAL_Z, DIAL_H, P, 40, 0.8), { tone: 'hi', crease: 'lo' }))
    out.push(L(k.knurl(dx, dy, DIAL_R, DIAL_TOP - 3.2, DIAL_TOP, 60, P, 0.3), { tone: 'lo' }))
    out.push(L(k.sideArc(dx, dy, DIAL_R, DIAL_TOP - 3.2, P, 40), { tone: 'faint' }))
    out.push(L(k.ring(dx, dy, DIAL_R - 2, DIAL_TOP, P, 40), { tone: 'lo' }))
    const FROM = -0.75 * Math.PI
    const SPAN = 1.5 * Math.PI
    // merged share painted as a coin-yellow arc band under the ticks
    const arc = []
    const steps = 40
    for (let i = 0; i <= steps; i++) {
      const a = FROM + (i / steps) * SHARE * SPAN
      arc.push([dx + Math.sin(a) * (DIAL_R - 3.4), dy - Math.cos(a) * (DIAL_R - 3.4), DIAL_TOP])
    }
    if (SHARE > 0) out.push(`<path class="iso-line" style="stroke:var(--coin);stroke-width:2.2;stroke-linecap:butt" d="${poly(arc, false)}"/>`)
    const ticks = k.radialTicks(dx, dy, DIAL_R - 2, 20, 5, DIAL_TOP, [1.2, 2.6], P, FROM, SPAN)
    out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }))
    const z0 = [Math.sin(FROM), -Math.cos(FROM)]
    out.push(L(k.lineOnTop([dx + z0[0] * (DIAL_R - 5.2), dy + z0[1] * (DIAL_R - 5.2)], [dx + z0[0] * (DIAL_R - 2), dy + z0[1] * (DIAL_R - 2)], DIAL_TOP, P), { tone: 'hi' }))
    out.push(S(slab({ x: dx + DIAL_R - 1, y: dy - 2.2, w: 4.4, d: 4.4, r: 1 }, DIAL_Z + 1.5, 4, 2), { tone: 'mid' }))
    out.push(S(slab({ x: dx + DIAL_R + 3, y: dy - 3, w: 2.4, d: 6, r: 1 }, DIAL_Z + 0.8, 5.4, 2), { tone: 'mid' }))
    const angle = FROM + SHARE * SPAN
    const s = [Math.sin(angle), -Math.cos(angle)]
    out.push(`<path class="iso-line" data-tone="lit" style="stroke-width:1.2" d="${k.lineOnTop([dx - s[0] * 3.2, dy - s[1] * 3.2], [dx + s[0] * (DIAL_R - 4), dy + s[1] * (DIAL_R - 4)], DIAL_TOP + 0.2, P)}"/>`)
    out.push(L(k.ring(dx, dy, 1.5, DIAL_TOP + 0.2, P, 14), { tone: 'mid' }))
    return out.join('')
  }

  function stand(plan, value, kind) {
    return halo(plan, 0, 2, 's') + `<g data-p="${kind}">` + S(slab(plan, 0, 19, 3, 0.6), { tone: 'mid' }) + counter(plan.y + plan.d, plan.x + 3, 2.2, value, { kind }) + '</g>'
  }

  // Holding tray: "?" blocks still under review, shared out between the projects.
  function tray() {
    const out = [halo(TRAY, 0, 2, 's')]
    out.push(S(slab(TRAY, 0, 2.5, 4, 0.5), { tone: 'lo' }))
    const inner = k.insetPlan(TRAY, 3)
    out.push(`<path class="iso-top" d="${k.planOutline(inner, 2.5, P, 3)}"/>`)
    for (let col = 1; col < 6; col++) {
      const x = inner.x + (inner.w / 6) * col
      out.push(L(k.lineOnTop([x, inner.y], [x, inner.y + inner.d], 2.5, P), { tone: 'faint' }))
    }
    out.push(L(k.lineOnTop([inner.x, inner.y + inner.d / 2], [inner.x + inner.w, inner.y + inner.d / 2], 2.5, P), { tone: 'faint' }))
    out.push(S(slab({ x: TRAY.x, y: TRAY.y, w: TRAY.w, d: 3, r: 1 }, 2.5, TRAY_RIM - 2.5, 2, 0.3), { tone: 'mid' }))
    out.push(S(slab({ x: TRAY.x, y: TRAY.y, w: 3, d: TRAY.d, r: 1 }, 2.5, TRAY_RIM - 2.5, 2, 0.3), { tone: 'mid' }))
    const owners = allocate(projects.map(p => ({ id: p.id, count: p.open })), 12)
    const slots = []
    for (let row = 0; row < 2; row++) for (let col = 0; col < 6; col++) slots.push([inner.x + (inner.w / 6) * (col + 0.5), inner.y + (inner.d / 2) * (row + 0.5)])
    const placed = owners.map((id, i) => ({ id, p: [slots[i][0] + ((i * 7) % 3) - 1, slots[i][1] + ((i * 5) % 3) - 1, 2.5] }))
    for (const { id, p } of byDepth(placed.map(x => x.p)).map(p => placed.find(x => x.p === p))) out.push(block(p, CUBE, 'q', ` data-p="${id} open"`))
    out.push(S(slab({ x: TRAY.x + TRAY.w - 3, y: TRAY.y, w: 3, d: TRAY.d, r: 1 }, 2.5, TRAY_RIM - 2.5, 2, 0.3), { tone: 'mid' }))
    out.push(S(slab({ x: TRAY.x, y: TRAY.y + TRAY.d - 3, w: TRAY.w, d: 3, r: 1 }, 2.5, TRAY_RIM - 2.5, 2, 0.3), { tone: 'mid' }))
    out.push(D(k.corners(TRAY, 1.5).map(([x, y]) => at([x, y, TRAY_RIM])), { size: 0.42 }))
    out.push(stand({ x: TRAY.x + TRAY.w + 8, y: TRAY.y + TRAY.d - 16, w: 40, d: 12, r: 1.5 }, OPEN, 'open'))
    return out.join('')
  }

  // Brick crate: the coins paid out by merged pull requests, in stacks.
  function crate() {
    const out = [halo(CRATE, 0, 3, 's')]
    const c = CRATE
    const w = CRATE_WALL
    out.push(S(slab(c, 0, 3, 3, 0.5), { tone: 'lo' }))
    const inner = k.insetPlan(c, w)
    out.push(`<path class="iso-top" d="${k.planOutline(inner, 3, P, 2)}"/>`)
    const wall = (plan, face) => {
      const lines = []
      const rows = 3
      for (let i = 1; i < rows; i++) lines.push(k.sideSeam(plan, 3 + ((CRATE_H - 3) / rows) * i, P, 2))
      // staggered head joints on the visible face
      for (let i = 0; i < rows; i++) {
        const z0 = 3 + ((CRATE_H - 3) / rows) * i
        const z1 = z0 + (CRATE_H - 3) / rows
        const len = face === 'y' ? plan.w : plan.d
        for (let u = (i % 2 ? 7 : 14); u < len - 3; u += 14) {
          if (face === 'y') lines.push(k.segment([plan.x + u, plan.y + plan.d, z0], [plan.x + u, plan.y + plan.d, z1], P))
          else lines.push(k.segment([plan.x + plan.w, plan.y + u, z0], [plan.x + plan.w, plan.y + u, z1], P))
        }
      }
      return `<g class="mt-brick">${S(slab(plan, 3, CRATE_H - 3, 2, 0.4), { tone: 'hi', crease: 'lo', inner: L(lines.join(''), { tone: 'lo' }) })}</g>`
    }
    out.push(wall({ x: c.x, y: c.y, w: c.w, d: w, r: 0.8 }, 'y'))
    out.push(wall({ x: c.x, y: c.y, w, d: c.d, r: 0.8 }, 'x'))
    // coins: one stack per slot, 3 x 2 slots, at most 30 coins drawn
    const owners = allocate(projects.map(p => ({ id: p.id, count: p.merged })), 30)
    const stacks = Array.from({ length: 6 }, () => [])
    owners.forEach((id, i) => stacks[i % 6].push(id))
    const spots = []
    for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) spots.push([inner.x + 13 + col * 27 + ((row + col) % 2), inner.y + 15 + row * 30 - ((row * col) % 2)])
    const order = byDepth(spots.map((p, i) => [...p, 3, i]))
    for (const [x, y, , i] of order) {
      const ids = stacks[i]
      if (!ids.length) continue
      out.push(coinStack([x, y, 3], ids.length, 8.5, 2.4, ` data-p="${[...new Set(ids)].join(' ')} merged"`))
    }
    out.push(wall({ x: c.x + c.w - w, y: c.y, w, d: c.d, r: 0.8 }, 'x'))
    out.push(wall({ x: c.x, y: c.y + c.d - w, w: c.w, d: w, r: 0.8 }, 'y'))
    out.push(D(k.corners(c, 1.8).map(([x, y]) => at([x, y, CRATE_H])), { size: 0.45, tone: 'hi' }))
    out.push(stand({ x: c.x + c.w - 44, y: c.y + c.d + 6, w: 40, d: 12, r: 1.5 }, MERGED, 'merged'))
    return out.join('')
  }

  function panel() {
    const out = [halo(PANEL, 0, 2, 's')]
    out.push(S(slab(PANEL, 0, PANEL_H, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(PANEL, 3, P, 3), { tone: 'faint' }) }))
    out.push(L(k.planOutline(k.insetPlan(PANEL, 2.5), PANEL_H, P, 3), { tone: 'faint' }))
    out.push(D(k.corners(PANEL, 2.4).map(([x, y]) => at([x, y, PANEL_H])), { size: 0.42 }))
    // a d-pad and two round buttons, like a controller
    const pad = [PANEL.x + 13, PANEL.y + 15]
    out.push(S(k.cylinder(pad[0], pad[1], 6.5, PANEL_H, 1.2, P, 16), { tone: 'lo' }))
    out.push(S(slab({ x: pad[0] - 5, y: pad[1] - 1.6, w: 10, d: 3.2, r: 0.4 }, PANEL_H + 1.2, 1.8, 1), { tone: 'mid' }))
    out.push(S(slab({ x: pad[0] - 1.6, y: pad[1] - 5, w: 3.2, d: 10, r: 0.4 }, PANEL_H + 1.2, 1.8, 1), { tone: 'mid' }))
    for (const [x, y, mat] of [[PANEL.x + 33, PANEL.y + 10, 'red'], [PANEL.x + 37, PANEL.y + 20, 'q']]) {
      out.push(S(k.cylinder(x, y, 4.2, PANEL_H, 1, P, 14), { tone: 'lo' }))
      out.push(`<g class="mt-${mat}">${S(k.cylinder(x, y, 3.2, PANEL_H + 1, 2.2, P, 14, 0.3), { tone: 'hi', crease: 'lo' })}</g>`)
    }
    return out.join('')
  }

  // End-of-level flagpole behind the crate: the flag is up when something got merged.
  function flagpole() {
    const out = []
    const [x, y] = [244, -66]
    const base = { x: x - 6, y: y - 6, w: 12, d: 12, r: 1 }
    out.push(halo(base, 0, 2, 's'))
    out.push(`<g class="mt-brick">${S(slab(base, 0, 8, 2, 0.4), { tone: 'hi', crease: 'lo' })}</g>`)
    const POLE = 96
    out.push(S(k.cylinder(x, y, 1.6, 8, POLE - 8, P, 12), { tone: 'mid', crease: 'none' }))
    out.push(`<g class="mt-pipe">${S(k.cylinder(x, y, 3.4, POLE, 4.5, P, 16, 1.2), { tone: 'hi', crease: 'lo' })}</g>`)
    if (MERGED > 0) {
      const fy = y
      const flag = [[x, fy, POLE - 4], [x - 26, fy, POLE - 13], [x, fy, POLE - 22]]
      out.push(`<path class="${idPrefix}-flag" fill="#43b047" stroke="#0b2b10" stroke-width=".8" stroke-linejoin="round" d="${poly(flag)}"/>`)
      const [fx, fy2] = at([x - 9, fy, POLE - 13])
      out.push(`<circle cx="${fix(fx)}" cy="${fix(fy2)}" r="3" fill="#fff" stroke="#0b2b10" stroke-width=".6"/>`)
    }
    return out.join('')
  }

  // ---------------------------------------------------------------- moving blocks
  const TAU = 3
  const MOVE = 0.55
  const N = DWELL.length - 1
  const HIT = 0.72 // share of an index when the stamp lands
  const beltBlocks = []
  for (let i = 0; i < N; i++) {
    beltBlocks.push(`<g class="${idPrefix}-bp ${idPrefix}-bp${i}"><g class="${idPrefix}-q">${block([0, BELT_Y, BELT_TOP], CUBE, 'q')}</g><g class="${idPrefix}-u">${block([0, BELT_Y, BELT_TOP], CUBE, 'used')}</g></g>`)
  }
  const px = x => shift(x, 0, 0)
  const keys = []
  for (let j = 0; j < N; j++) {
    const t0 = (j / N) * 100
    const t1 = ((j + MOVE) / N) * 100
    const [ax, ay] = px(DWELL[j])
    const [bx, by] = px(DWELL[j + 1])
    keys.push(`${fix(t0)}%{transform:translate(${ax}px,${ay}px);opacity:${j === 0 ? 0 : 1}}`)
    keys.push(`${fix(t1)}%{transform:translate(${bx}px,${by}px);opacity:${j === N - 1 ? 0 : 1}}`)
  }
  const [ex, ey] = px(DWELL[N])
  keys.push(`100%{transform:translate(${ex}px,${ey}px);opacity:0}`)
  const swap = fix(((2 + HIT) / N) * 100)
  const [cx6, cy6] = shift(STEP, 0, 0)
  const [sx, sy] = shift(0, 0, -PRESS)
  const [, coinRise] = shift(0, 0, 30)
  const staticBlocks = DWELL.slice(0, N).map((x, i) => {
    const [tx, ty] = px(x)
    return `.${idPrefix}-bp${i}{transform:translate(${tx}px,${ty}px);opacity:${i === 0 ? 0 : 1}}${i > 3 ? `.${idPrefix}-bp${i} .${idPrefix}-q{opacity:0}` : `.${idPrefix}-bp${i} .${idPrefix}-u{opacity:0}`}`
  }).join('')
  const delays = Array.from({ length: N }, (_, i) => `.${idPrefix}-bp${i},.${idPrefix}-bp${i} .${idPrefix}-q,.${idPrefix}-bp${i} .${idPrefix}-u{animation-delay:${fix(-i * TAU)}s}`).join('')
  const css = `${staticBlocks}
.${idPrefix}-coin{opacity:0}
@keyframes ${idPrefix}-belt{${keys.join('')}}
@keyframes ${idPrefix}-q{0%,${swap}%{opacity:1}${fix(swap + 0.2)}%,100%{opacity:0}}
@keyframes ${idPrefix}-u{0%,${swap}%{opacity:0}${fix(swap + 0.2)}%,100%{opacity:1}}
@keyframes ${idPrefix}-cleat{0%{transform:translate(0,0)}${fix(MOVE * 100)}%,100%{transform:translate(${cx6}px,${cy6}px)}}
@keyframes ${idPrefix}-press{0%,60%{transform:translate(0,0)}70%,80%{transform:translate(${sx}px,${sy}px)}92%,100%{transform:translate(0,0)}}
@keyframes ${idPrefix}-coin{0%,${fix(HIT * 100)}%{opacity:0;transform:translate(0,0)}${fix(HIT * 100 + 4)}%{opacity:1}${fix(HIT * 100 + 18)}%{opacity:1;transform:translate(0,${coinRise}px)}${fix(HIT * 100 + 26)}%,100%{opacity:0;transform:translate(0,${coinRise}px)}}
@media (prefers-reduced-motion:no-preference){
.${idPrefix}-bp{animation:${idPrefix}-belt ${N * TAU}s ease-in-out infinite}
.${idPrefix}-q{animation:${idPrefix}-q ${N * TAU}s linear infinite}
.${idPrefix}-u{animation:${idPrefix}-u ${N * TAU}s linear infinite}
${delays}
.${idPrefix}-cleats{animation:${idPrefix}-cleat ${TAU}s ease-in-out infinite}
.${idPrefix}-press{animation:${idPrefix}-press ${TAU}s ease-in-out infinite}
.${idPrefix}-coin{animation:${idPrefix}-coin ${TAU}s ease-out infinite}
}`

  // The coin a hit block pays: a sprite-like upright coin above the stamp head.
  const [cxs, cys] = at([STATION, BELT_Y + 14, HEAD_Z + 10])
  const coinSprite = `<g class="${idPrefix}-coin"><ellipse cx="${fix(cxs)}" cy="${fix(cys)}" rx="4.4" ry="6.4" fill="var(--coin)" stroke="#1a1a2e" stroke-width="1"/><path d="M${fix(cxs)} ${fix(cys - 3.4)}v6.8" stroke="var(--coin-dark)" stroke-width="1.6"/></g>`

  // ---------------------------------------------------------------- assemble, back to front
  const art = [
    bench(),
    intake(),
    motor(),
    post(POSTS[0]),
    legs(BELT_Y - 22),
    rail(BELT_Y - 22),
    belt(),
    ...beltBlocks,
    rail(BELT_Y + 18),
    railCaps(),
    legs(BELT_Y + 20),
    `<g class="${idPrefix}-press">${stamp()}</g>`,
    gland(),
    post(POSTS[1]),
    beam(),
    coinSprite,
    flagpole(),
    tray(),
    crate(),
    panel(),
  ]

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label.replace(/"/g, '&quot;')}"><style>${css}</style>${art.join('')}</svg>`
  return { svg, width: W, height: H, merged: MERGED, open: OPEN, share: SHARE }
}
