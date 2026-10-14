/**
 * The loop line: starts on the right ("where you are now"), tangles into a few loops,
 * and leaves straight to the left ("a business that makes money").
 * `straight(u)` returns 0..1, how tangled the line still is at position u.
 */
export type Pt = [number, number]

export function loopPoints(W: number, H: number, opts: { straight?: (u: number) => number; baseline?: number; amp?: number } = {}): Pt[] {
  const N = 720
  const pts: Pt[] = []
  const y0 = H * (opts.baseline ?? 0.8)
  const pad = 14
  const rs = 0.13
  const re = 0.85
  const span = (W - pad * 2) * (re - rs)
  const b = H * (opts.amp ?? 0.37)
  const loops = Math.max(2, Math.round(span / ((2 * Math.PI * b) / 2.6)))
  for (let i = 0; i <= N; i++) {
    const u = i / N
    let x = W - pad - u * (W - pad * 2)
    let y = y0
    const v = (u - rs) / (re - rs)
    if (v > 0 && v < 1) {
      const th = Math.PI + v * Math.PI * 2 * loops
      const k = Math.pow(Math.sin(Math.PI * v), 0.45) * (opts.straight ? opts.straight(u) : 1)
      x += b * Math.sin(th) * k
      y -= b * (1 + Math.cos(th)) * k
    }
    pts.push([x, y])
  }
  return pts
}

export function toPath(pts: Pt[]) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) d += `L${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`
  return d
}

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v))
}

export function smooth(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Keeps number ranges like 2–3 in order inside Hebrew text. */
export function ltr(s: string) {
  return `⁦${s}⁩`
}

export const CONFIG = {
  /** International format, no + and no leading 0 (050-1234567 → 972501234567) */
  whatsappNumber: '972555530881',
  /** ⚠️ Replace with the real Instagram page before going live */
  instagramUrl: 'https://instagram.com/',
}

export const waLink = (text = 'היי! אשמח לשמוע על הליווי 🙂') =>
  `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`

/* ------------------------------------------------------------------
   The big loop: one trochoid lap with straight tails, used by the
   "ככה נראה הלופ." stage. Pure geometry, computed once per shape.
   ------------------------------------------------------------------ */
export interface LoopShape {
  W: number
  y0: number
  b: number
  D: number
  sx: number
  cx: number
  tail?: number
  N?: number
}

export function bigLoopPoints({ W, y0, b, D, sx, cx, tail = 20, N = 900 }: LoopShape): Pt[] {
  const xA = cx + D / 2
  const pts: Pt[] = []
  for (let x = W + tail; x > xA; x -= 6) pts.push([x, y0])
  for (let i = 0; i <= N; i++) {
    const v = i / N
    const th = Math.PI + v * Math.PI * 2
    const k = Math.pow(Math.sin(Math.PI * v), 0.45) // same envelope as loopPoints
    pts.push([xA - v * D + sx * b * Math.sin(th) * k, y0 - b * (1 + Math.cos(th)) * k])
  }
  for (let x = xA - D - 6; x > -tail; x -= 6) pts.push([x, y0])
  return pts
}

function segX(a: Pt, b: Pt, c: Pt, d: Pt) {
  const q = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0])
  if (Math.abs(q) < 1e-9) return null
  const t = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / q
  const u = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / q
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { x: a[0] + t * (b[0] - a[0]), y: a[1] + t * (b[1] - a[1]) } : null
}

/** Where the loop crosses itself: first half against second half. Runs once per shape. */
export function findCrossing(p: Pt[], s: LoopShape) {
  const from = p.findIndex((q) => q[0] <= s.cx + s.D / 2)
  const to = from + (s.N ?? 900)
  const mid = (from + to) >> 1
  for (let i = from; i < mid; i++) {
    for (let j = mid; j < to; j++) {
      const r = segX(p[i], p[i + 1], p[j], p[j + 1])
      if (r) return { i, j, ...r }
    }
  }
  throw new Error('loop has no crossing')
}

export interface Track {
  total: number
  at(s: number, wrap?: boolean): { x: number; y: number }
}

/** Arc-length parametrised polyline: at(0..1) walks it at constant speed. */
export function makeTrack(pts: Pt[]): Track {
  const L = new Float64Array(pts.length)
  for (let i = 1; i < pts.length; i++) L[i] = L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  const total = L[L.length - 1]
  return {
    total,
    at(s, wrap = true) {
      const t = (wrap ? ((s % 1) + 1) % 1 : clamp(s, 0, 1)) * total
      let lo = 0
      let hi = L.length - 1
      while (hi - lo > 1) {
        const m = (lo + hi) >> 1
        if (L[m] < t) lo = m
        else hi = m
      }
      const f = (t - L[lo]) / (L[hi] - L[lo] || 1)
      return { x: pts[lo][0] + (pts[hi][0] - pts[lo][0]) * f, y: pts[lo][1] + (pts[hi][1] - pts[lo][1]) * f }
    },
  }
}

export interface LoopCanon {
  shape: LoopShape
  pts: Pt[]
  i: number
  j: number
  C: Pt
  ghosts: Pt[][]
  box: { x0: number; x1: number; top: number }
}

export function loopCanon(shape: LoopShape, deltas: [number, number, number][]): LoopCanon {
  const closed = (p: Pt[], k: { i: number; j: number; x: number; y: number }): Pt[] => [[k.x, k.y], ...p.slice(k.i + 1, k.j + 1), [k.x, k.y]]
  const pts = bigLoopPoints(shape)
  const c = findCrossing(pts, shape)
  const loop = pts.slice(c.i + 1, c.j + 1)
  const ghosts = deltas.map(([db, dD, ds]) => {
    const s = { ...shape, b: shape.b + db, D: shape.D + dD, sx: shape.sx + ds }
    const g = bigLoopPoints(s)
    return closed(g, findCrossing(g, s))
  })
  return {
    shape,
    pts,
    i: c.i,
    j: c.j,
    C: [c.x, c.y],
    ghosts,
    box: { x0: Math.min(...loop.map((q) => q[0])), x1: Math.max(...loop.map((q) => q[0])), top: Math.min(...loop.map((q) => q[1])) },
  }
}

export interface LoopGeometry {
  C: { x: number; y: number }
  loop: Track
  entry: Track
  exit: Track
  dMain: string
  dExit: string
  dRed: string
  dGhosts: string[]
  top: number
  bottom: number
  inLen: number
  loopLen: number
  mainLen: number
}

export function loopGeometry(k: LoopCanon, o: { startX: number; stopX: number; map?: (p: Pt) => Pt }): LoopGeometry {
  const map = o.map ?? ((p: Pt) => p)
  const pts = k.pts.map(map)
  const C = map(k.C)
  const head = pts.slice(0, k.i + 1)
  const loopPts: Pt[] = [C, ...pts.slice(k.i + 1, k.j + 1), C]
  const mainPts = [...head, ...loopPts]
  const exitPts: Pt[] = [C, ...pts.slice(k.j + 1)]
  const stop = exitPts.findIndex((q) => q[0] <= o.stopX)
  const redPts = exitPts.slice(0, stop < 0 ? exitPts.length : stop + 1)
  const entryPts: Pt[] = [...head.slice(Math.max(0, head.findIndex((q) => q[0] <= o.startX))), C]
  const loop = makeTrack(loopPts)
  return {
    C: { x: C[0], y: C[1] },
    loop,
    entry: makeTrack(entryPts),
    exit: makeTrack(redPts),
    dMain: toPath(mainPts),
    dExit: toPath(exitPts),
    dRed: toPath(redPts),
    dGhosts: k.ghosts.map((g) => toPath(g.map(map))),
    top: Math.min(...loopPts.map((q) => q[1])),
    bottom: C[1],
    inLen: makeTrack([...head, C]).total,
    loopLen: loop.total,
    mainLen: makeTrack(mainPts).total,
  }
}
