// The organizations: three small buildings on a grass-topped ground block, like a level map.
// Pepprio is a restaurant with a striped awning (restaurant order management), Pignelle a
// real-estate agency under a red gable roof with a "for sale" board in the yard, and the
// personal workshop is a brick garage with a roller door, a "?" block sign and a warp pipe.
//
// orgStreet({ label }) → { svg, width, height }

import * as k from './iso-kit.mjs'
import { toolkit } from './parts.mjs'

export function orgStreet({ label = '' } = {}) {
  const W = 640
  const H = 290

  const GROUND = { x: -230, y: -62, w: 460, d: 136, r: 4 }
  const GROUND_H = 14

  const REST = { x: -196, y: -40, w: 92, d: 56, r: 0.6 }
  const REST_H = 40
  const AGENCY = { x: -58, y: -40, w: 84, d: 54, r: 0.6 }
  const AGENCY_H = 32
  const ROOF_H = 26
  const SHOP = { x: 78, y: -42, w: 108, d: 62, r: 0.6 }
  const SHOP_H = 40

  const extreme = [...k.boxCorners(GROUND, -GROUND_H, 0), [AGENCY.x, AGENCY.y + AGENCY.d / 2, AGENCY_H + ROOF_H + 2], [SHOP.x + 70, SHOP.y + 20, SHOP_H + 26]]
  const P = k.fitProjection(extreme, W, H, { pad: 12, azimuth: 58 })
  const { at, S, L, D, slab, poly, halo, faceRect, block, faceText } = toolkit(P)

  const windowOn = (face, at0, u0, z0, w, h, panes = 2) => {
    const frame = faceRect(face, at0, u0, z0, w, h, 0.6, 2)
    const out = [`<g class="mt-sky"><path class="iso-glass" d="${poly(frame)}"/></g>`]
    const lines = []
    const pt = (u, z) => (face === 'y' ? [u, at0, z] : [at0, -u, z])
    for (let i = 1; i < panes; i++) lines.push(k.segment(pt(u0 + (w / panes) * i, z0), pt(u0 + (w / panes) * i, z0 + h), P))
    lines.push(k.segment(pt(u0, z0 + h / 2), pt(u0 + w, z0 + h / 2), P))
    out.push(L(lines.join(''), { tone: 'mid' }))
    out.push(`<path class="iso-line" data-tone="hi" d="${poly(frame)}"/>`)
    // sill
    out.push(L(k.segment(pt(u0 - 1.5, z0 - 0.8), pt(u0 + w + 1.5, z0 - 0.8), P), { tone: 'hi' }))
    return out.join('')
  }

  const door = (face, at0, u0, w, h) => {
    const frame = faceRect(face, at0, u0, 0, w, h, 0.6, 2)
    const pt = (u, z) => (face === 'y' ? [u, at0, z] : [at0, -u, z])
    return `<path class="iso-door" d="${poly(frame)}"/><path class="iso-line" data-tone="hi" d="${poly(frame)}"/>` + D([at(pt(u0 + w - 2.4, h / 2))], { size: 0.7, tone: 'hi' })
  }

  function ground() {
    const out = [halo(GROUND, -GROUND_H, GROUND_H)]
    // dirt courses on the visible sides, like the site's ground strip
    const lines = []
    for (const z of [-GROUND_H + 4.5, -GROUND_H + 9]) lines.push(k.sideSeam(GROUND, z, P, 4))
    for (let x = GROUND.x + 12; x < GROUND.x + GROUND.w - 4; x += 16) lines.push(k.segment([x, GROUND.y + GROUND.d, -GROUND_H + 4.5], [x, GROUND.y + GROUND.d, -GROUND_H + 9], P))
    out.push(`<g class="mt-grass">${S(slab(GROUND, -GROUND_H, GROUND_H, 4, 1), { tone: 'hi', crease: 'mid', inner: L(lines.join(''), { tone: 'lo' }) })}</g>`)
    // a stone path running in front of the three doors
    const path = { x: GROUND.x + 16, y: 36, w: GROUND.w - 32, d: 18, r: 2 }
    out.push(`<path class="iso-path" d="${k.planOutline(path, 0, P, 3)}"/>`)
    const joints = []
    for (let x = path.x + 18; x < path.x + path.w - 4; x += 18) joints.push(k.lineOnTop([x, path.y], [x, path.y + path.d], 0, P))
    out.push(L(joints.join(''), { tone: 'mid' }))
    out.push(`<path class="iso-line" data-tone="mid" d="${k.planOutline(path, 0, P, 3)}"/>`)
    // little walks from the path to each door
    for (const [x, y0] of [[REST.x + 30, REST.y + REST.d], [AGENCY.x + 22, AGENCY.y + AGENCY.d], [SHOP.x + 36, SHOP.y + SHOP.d]]) {
      const walk = { x: x - 7, y: y0, w: 14, d: 36 - y0, r: 0 }
      out.push(`<path class="iso-path" d="${k.planOutline(walk, 0, P, 1)}"/>`, L(k.planOutline(walk, 0, P, 1), { tone: 'mid' }))
    }
    return out.join('')
  }

  function bush(x, y, r = 7) {
    return `<g class="mt-pipe">${S(k.cylinder(x, y, r, 0, r * 0.9, P, 20, r * 0.35), { tone: 'hi', crease: 'lo' })}${S(k.cylinder(x - r * 0.15, y - r * 0.1, r * 0.62, r * 0.9, r * 0.6, P, 18, r * 0.3), { tone: 'hi', crease: 'lo' })}</g>`
  }

  // Pepprio: a restaurant with a flat roof, a parapet, a striped awning and a chimney.
  function restaurant() {
    const b = REST
    const fy = b.y + b.d
    const fx = b.x + b.w
    const out = [halo(b, 0, 3, 's')]
    const inner = [
      L(k.sideSeam(b, 4, P, 1), { tone: 'mid' }),
      door('y', fy, b.x + 23, 14, 22),
      windowOn('y', fy, b.x + 46, 8, 34, 16, 3),
      windowOn('x', fx, -(b.y + b.d - 14), 14, 24, 14, 2),
    ].join('')
    out.push(`<g class="mt-wall">${S(slab(b, 0, REST_H, 1, 0.4), { tone: 'hi', crease: 'lo', inner })}</g>`)
    // parapet and roof deck
    const deck = k.insetPlan(b, 3)
    out.push(`<path class="iso-roof" d="${k.planOutline(deck, REST_H, P, 1)}"/>`, L(k.planOutline(deck, REST_H, P, 1), { tone: 'mid' }))
    out.push(`<g class="mt-wall">${S(slab({ x: b.x, y: b.y, w: b.w, d: 3, r: 0.3 }, REST_H, 3, 1), { tone: 'hi', crease: 'lo' })}${S(slab({ x: b.x, y: b.y, w: 3, d: b.d, r: 0.3 }, REST_H, 3, 1), { tone: 'hi', crease: 'lo' })}</g>`)
    // chimney with a vent cap
    const ch = { x: b.x + 14, y: b.y + 10, w: 10, d: 10, r: 0.4 }
    out.push(`<g class="mt-brick">${S(slab(ch, REST_H, 16, 1, 0.3), { tone: 'hi', crease: 'lo', inner: L(k.sideSeam(ch, REST_H + 8, P, 1), { tone: 'lo' }) })}</g>`)
    out.push(S(slab(k.insetPlan(ch, -1.5), REST_H + 16, 2, 1, 0.3), { tone: 'mid' }))
    // roof sign: a board on two legs
    const sign = { x: b.x + 40, y: b.y + 24, w: 40, d: 3, r: 0.3 }
    for (const x of [sign.x + 6, sign.x + sign.w - 6]) out.push(S(slab({ x: x - 1, y: sign.y, w: 2, d: 2, r: 0 }, REST_H, 6, 1), { tone: 'mid' }))
    out.push(`<g class="mt-red">${S(slab(sign, REST_H + 6, 12, 1, 0.3), { tone: 'hi', crease: 'lo' })}</g>`)
    out.push(faceText('y', sign.y + sign.d, sign.x + sign.w / 2, REST_H + 9, 'EAT', { size: 7, cls: 'iso-glyph iso-glyph--light' }))
    out.push(`<g class="mt-wall">${S(slab({ x: fx - 3, y: b.y, w: 3, d: b.d, r: 0.3 }, REST_H, 3, 1), { tone: 'hi', crease: 'lo' })}${S(slab({ x: b.x, y: fy - 3, w: b.w, d: 3, r: 0.3 }, REST_H, 3, 1), { tone: 'hi', crease: 'lo' })}</g>`)
    // striped awning over the door and the window: a slanted plane, red and white
    const a0 = b.x + 18
    const a1 = b.x + b.w - 6
    const zTop = 30
    const zLow = 24
    const out2 = []
    const stripes = 10
    const step = (a1 - a0) / stripes
    for (let i = 0; i < stripes; i++) {
      const u0 = a0 + i * step
      const u1 = u0 + step
      out2.push(`<path class="${i % 2 ? 'iso-stripe-w' : 'iso-stripe-r'}" d="${poly([[u0, fy, zTop], [u1, fy, zTop], [u1, fy + 10, zLow], [u0, fy + 10, zLow]])}"/>`)
      // scalloped valance
      out2.push(`<path class="${i % 2 ? 'iso-stripe-w' : 'iso-stripe-r'}" d="${poly([[u0, fy + 10, zLow], [u1, fy + 10, zLow], [u1, fy + 10, zLow - 3], [(u0 + u1) / 2, fy + 10, zLow - 4.4], [u0, fy + 10, zLow - 3]])}"/>`)
    }
    out2.push(`<path class="iso-line" data-tone="hi" style="stroke:#1a1a2e" d="${poly([[a0, fy, zTop], [a1, fy, zTop], [a1, fy + 10, zLow], [a0, fy + 10, zLow]])}"/>`)
    out.push(out2.join(''))
    // menu board by the door
    out.push(S(slab({ x: b.x + 8, y: fy + 4, w: 9, d: 2, r: 0.2 }, 0, 12, 1), { tone: 'mid' }))
    out.push(`<path class="iso-hole" d="${poly(faceRect('y', fy + 6, b.x + 9.2, 4, 6.6, 6.8, 0.3, 1))}"/>`)
    out.push(L(k.segment([b.x + 10.5, fy + 6, 8.6], [b.x + 14.5, fy + 6, 8.6], P) + k.segment([b.x + 10.5, fy + 6, 6.2], [b.x + 13.5, fy + 6, 6.2], P), { tone: 'mid', free: true }))
    return out.join('')
  }

  // Pignelle: a real-estate agency with a red gable roof and a "for sale" board in the yard.
  function agency() {
    const b = AGENCY
    const fy = b.y + b.d
    const fx = b.x + b.w
    const out = [halo(b, 0, 3, 's')]
    const inner = [
      L(k.sideSeam(b, 4, P, 1), { tone: 'mid' }),
      door('y', fy, b.x + 15, 13, 21),
      windowOn('y', fy, b.x + 38, 10, 36, 15, 3),
      windowOn('x', fx, -(b.y + b.d - 12), 12, 20, 13, 2),
    ].join('')
    out.push(`<g class="mt-wall">${S(slab(b, 0, AGENCY_H, 1, 0.4), { tone: 'hi', crease: 'lo', inner })}</g>`)
    // gable roof, ridge along x, eaves overhanging by 4
    const o = 4
    const x0 = b.x - o
    const x1 = fx + o
    const y0 = b.y - o
    const y1 = fy + o
    const ym = b.y + b.d / 2
    const ze = AGENCY_H - 2
    const zr = AGENCY_H + ROOF_H
    // gable wall on the +x face (triangle above the wall top)
    out.push(`<g class="mt-wall"><path class="iso-shade" data-shade="2" d="${poly([[fx, b.y, AGENCY_H], [fx, fy, AGENCY_H], [fx, ym, zr - 2]])}"/></g>`)
    const vent = faceRect('x', fx, -(ym + 4), AGENCY_H + 5, 8, 8, 4, 6)
    out.push(`<g class="mt-sky"><path class="iso-glass" d="${poly(vent)}"/></g><path class="iso-line" data-tone="hi" d="${poly(vent)}"/>`)
    out.push(L(poly([[fx, b.y, AGENCY_H], [fx, ym, zr - 2], [fx, fy, AGENCY_H]], false), { tone: 'hi' }))
    // back slope then front slope
    out.push(`<g class="mt-red"><path class="iso-shade" data-shade="1" d="${poly([[x0, y0, ze], [x1, y0, ze], [x1, ym, zr], [x0, ym, zr]])}"/>`)
    const tiles = []
    for (let i = 1; i < 5; i++) {
      const f = i / 5
      tiles.push(k.segment([x0, ym + (y1 - ym) * f, zr + (ze - zr) * f], [x1, ym + (y1 - ym) * f, zr + (ze - zr) * f], P))
    }
    out.push(`<path class="iso-top" d="${poly([[x0, ym, zr], [x1, ym, zr], [x1, y1, ze], [x0, y1, ze]])}"/>`)
    out.push(L(tiles.join(''), { tone: 'lo' }))
    // roof thickness along the front eave and the gable edge
    out.push(`<path class="iso-shade" data-shade="0" d="${poly([[x0, y1, ze], [x1, y1, ze], [x1, y1, ze - 2], [x0, y1, ze - 2]])}"/>`)
    out.push(`<path class="iso-shade" data-shade="2" d="${poly([[x1, ym, zr], [x1, y1, ze], [x1, y1, ze - 2], [x1, ym, zr - 2]])}"/>`)
    out.push(`<path class="iso-line" data-tone="hi" d="${poly([[x0, ym, zr], [x1, ym, zr], [x1, y0, ze], [x1, ym, zr - 2], [x1, y1, ze - 2], [x0, y1, ze - 2], [x0, y1, ze], [x0, ym, zr]], false)}"/>`)
    out.push(L(k.segment([x1, y1, ze], [x0, y1, ze], P) + k.segment([x1, ym, zr], [x1, y1, ze], P), { tone: 'hi' }))
    out.push('</g>')
    // chimney through the back slope
    const ch = { x: b.x + 56, y: b.y + 8, w: 9, d: 9, r: 0.3 }
    const chz = ze + ((ch.y + ch.d / 2 - y0) / (ym - y0)) * (zr - ze)
    out.push(`<g class="mt-brick">${S(slab(ch, chz - 2, zr - chz + 10, 1, 0.3), { tone: 'hi', crease: 'lo' })}</g>`)
    // "for sale" board on a post in the yard
    const sx = b.x + 4
    const sy = fy + 14
    out.push(S(slab({ x: sx - 1, y: sy - 1, w: 2, d: 2, r: 0 }, 0, 26, 1), { tone: 'mid' }))
    out.push(S(slab({ x: sx - 1, y: sy - 1, w: 16, d: 2, r: 0 }, 24, 2, 1), { tone: 'mid' }))
    out.push(`<g class="mt-q">${S(slab({ x: sx + 3, y: sy - 0.6, w: 12, d: 1.2, r: 0 }, 14, 9, 1), { tone: 'hi', crease: 'lo' })}</g>`)
    out.push(faceText('y', sy + 0.6, sx + 9, 16.2, '$', { size: 6.5 }))
    return out.join('')
  }

  // The personal workshop: a brick garage with a roller door, a "?" block sign and a warp pipe.
  function workshop() {
    const b = SHOP
    const fy = b.y + b.d
    const fx = b.x + b.w
    const out = [halo(b, 0, 3, 's')]
    const courses = []
    for (let z = 5; z < SHOP_H - 2; z += 5) courses.push(k.sideSeam(b, z, P, 1))
    const doorU = b.x + 14
    const doorW = 50
    const doorH = 28
    const rd = faceRect('y', fy, doorU, 0, doorW, doorH, 0.4, 1)
    const slats = []
    for (let z = 3; z < doorH; z += 3) slats.push(k.segment([doorU, fy, z], [doorU + doorW, fy, z], P))
    const inner = [
      L(courses.join(''), { tone: 'lo' }),
      `<g class="mt-wall"><path class="iso-shade" data-shade="3" d="${poly(rd)}"/></g>`,
      L(slats.join(''), { tone: 'mid' }),
      `<path class="iso-line" data-tone="hi" d="${poly(rd)}"/>`,
      door('y', fy, b.x + 74, 13, 22),
      windowOn('x', fx, -(b.y + b.d - 12), 16, 30, 13, 3),
    ].join('')
    out.push(`<g class="mt-brick">${S(slab(b, 0, SHOP_H, 1, 0.4), { tone: 'hi', crease: 'lo', inner })}</g>`)
    // flat roof with a skylight and the "?" block sign
    const deck = k.insetPlan(b, 2.5)
    out.push(`<path class="iso-roof" d="${k.planOutline(deck, SHOP_H, P, 1)}"/>`, L(k.planOutline(deck, SHOP_H, P, 1), { tone: 'mid' }))
    const sky = { x: b.x + 14, y: b.y + 12, w: 22, d: 16, r: 0.4 }
    out.push(S(slab(sky, SHOP_H, 3, 1, 0.3), { tone: 'mid' }))
    out.push(`<g class="mt-sky"><path class="iso-glass" d="${k.planOutline(k.insetPlan(sky, 2), SHOP_H + 3, P, 1)}"/></g>`)
    out.push(S(slab({ x: b.x + 66, y: b.y + 30, w: 4, d: 4, r: 0 }, SHOP_H, 6, 1), { tone: 'mid' }))
    out.push(block([b.x + 68, b.y + 32, SHOP_H + 6], { w: 20, d: 20, h: 18 }, 'q'))
    // warp pipe beside the garage
    const [px, py] = [fx + 16, b.y + 20]
    out.push(halo({ x: px - 12, y: py - 12, w: 24, d: 24, r: 12 }, 0, 2, 's'))
    out.push(`<g class="mt-pipe">${S(k.cylinder(px, py, 9, 0, 22, P, 32), { tone: 'hi', crease: 'none', inner: L(k.knurl(px, py, 9, 0, 22, 6, P, 0.6), { tone: 'faint' }) })}${S(k.cylinder(px, py, 11.5, 22, 7, P, 32, 0.5), { tone: 'hi', crease: 'lo' })}<path class="iso-hole" d="${k.ring(px, py, 8.5, 29, P, 32)}"/></g>`)
    return out.join('')
  }

  const art = [
    ground(),
    bush(GROUND.x + 20, GROUND.y + 20, 8),
    `<g class="iso-lift" data-p="pepprio">${restaurant()}</g>`,
    bush(-86, -48, 7),
    `<g class="iso-lift" data-p="pignelle">${agency()}</g>`,
    bush(50, -50, 6),
    `<g class="iso-lift" data-p="benmacha">${workshop()}</g>`,
    bush(GROUND.x + GROUND.w - 18, GROUND.y + GROUND.d - 30, 7),
  ]

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label.replace(/"/g, '&quot;')}">${art.join('')}</svg>`
  return { svg, width: W, height: H }
}
