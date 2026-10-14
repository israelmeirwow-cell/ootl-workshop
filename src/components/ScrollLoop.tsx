import { useMemo } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { loopPoints, smooth, toPath } from '../lib/loop'
import useSize from '../hooks/useSize'

const STEPS = 40

/**
 * The loop, tied to the scroll: it writes itself while the problem is read,
 * then pulls straight while the way out is read, and the red dot lands at its end.
 */
export default function ScrollLoop({ stroke = '#fbf8f3', className = '' }: { stroke?: string; className?: string }) {
  const [ref, box] = useSize<HTMLDivElement>()
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] })

  const frames = useMemo(() => {
    if (!box.w) return [] as string[]
    const out: string[] = []
    for (let i = 0; i <= STEPS; i++) {
      const p = i / STEPS
      const pts = loopPoints(box.w, box.h, {
        baseline: 0.8,
        amp: 0.36,
        straight: (u) => 1 - smooth(u - 0.25, u + 0.05, p * 1.3),
      })
      out.push(toPath(pts.filter((_, k) => k % 2 === 0)))
    }
    return out
  }, [box.w, box.h])

  // band enters → the loop writes itself (until 60% up the screen), holds while the line is read, then pulls straight
  const draw = useTransform(scrollYProgress, [0.02, 0.4], [0, 1])
  const d = useTransform(scrollYProgress, (p) => {
    if (!frames.length) return ''
    const s = Math.max(0, Math.min(1, (p - 0.56) / 0.3))
    return frames[Math.round(s * STEPS)]
  })
  const dotScale = useTransform(scrollYProgress, [0.8, 0.88], [0, 1])
  const end = useMemo(() => (box.w ? loopPoints(box.w, box.h, { baseline: 0.8, amp: 0.36 })[720] : [0, 0]), [box.w, box.h])

  return (
    <div ref={ref} className={`relative ${className}`} aria-hidden="true">
      {box.w > 0 && (
        <svg viewBox={`0 0 ${box.w} ${box.h}`} className="absolute inset-0 h-full w-full overflow-visible" fill="none">
          {reduce ? (
            <path d={frames[STEPS]} stroke={stroke} strokeWidth={2} strokeLinecap="round" />
          ) : (
            <motion.path d={d} stroke={stroke} strokeWidth={2} strokeLinecap="round" style={{ pathLength: draw }} />
          )}
          <motion.circle
            cx={end[0]}
            cy={end[1]}
            r={7}
            fill="#e0442f"
            style={reduce ? undefined : { scale: dotScale, transformOrigin: `${end[0]}px ${end[1]}px` }}
          />
        </svg>
      )}
    </div>
  )
}
