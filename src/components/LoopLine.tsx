import { useMemo } from 'react'
import { motion, type MotionValue } from 'motion/react'
import { loopPoints, toPath } from '../lib/loop'

interface LoopLineProps {
  width: number
  height: number
  stroke?: string
  strokeWidth?: number
  className?: string
  isInView?: boolean
  delay?: number
  duration?: number
  baseline?: number
  amp?: number
  /** Optional scroll-driven draw progress (0..1). Overrides the in-view animation. */
  progress?: MotionValue<number>
  dot?: string
  style?: React.CSSProperties
  preserveAspectRatio?: string
}

/** The signature loop line, drawn as an SVG path that writes itself in. */
function LoopLine({
  width,
  height,
  stroke = '#f4efe6',
  strokeWidth = 2,
  className,
  isInView = true,
  delay = 0,
  duration = 2.4,
  baseline,
  amp,
  progress,
  dot,
  style,
  preserveAspectRatio,
}: LoopLineProps) {
  const pts = useMemo(() => loopPoints(width, height, { baseline, amp }), [width, height, baseline, amp])
  const d = useMemo(() => toPath(pts), [pts])
  const end = pts[pts.length - 1]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={style}
      preserveAspectRatio={preserveAspectRatio}
      fill="none"
      aria-hidden="true"
    >
      {progress ? (
        <motion.path d={d} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" style={{ pathLength: progress }} />
      ) : (
        <motion.path
          d={d}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : undefined}
          transition={{ duration, delay, ease: [0.65, 0, 0.35, 1] }}
        />
      )}
      {dot && (
        <motion.circle
          cx={end[0]}
          cy={end[1]}
          r={strokeWidth * 3.2}
          fill={dot}
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : undefined}
          transition={{ duration: 0.4, delay: delay + duration - 0.1, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ transformOrigin: `${end[0]}px ${end[1]}px` }}
        />
      )}
    </svg>
  )
}

export default LoopLine
