import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { Container, Cta, SeatCounter } from './ui'
import AnimatedLines from './AnimatedLines'
import useSize from '../hooks/useSize'
import { FINAL } from '../content'

/** The last call: the thread runs straight across the page and the dot lands at the button's side. */
export default function Final() {
  const ref = useRef<HTMLElement>(null)
  const on = useInView(ref, { once: true, amount: 0.4 })
  const [lineRef, box] = useSize<HTMLDivElement>()
  const y = box.h / 2
  return (
    <section ref={ref} id="next" className="overflow-hidden py-20 lg:py-32">
      <div ref={lineRef} className="h-6 w-full" aria-hidden="true">
        {box.w > 0 && (
          <svg viewBox={`0 0 ${box.w} ${box.h}`} className="h-full w-full overflow-visible" fill="none">
            <motion.path
              d={`M${box.w} ${y}L${Math.min(box.w * 0.18, 220)} ${y}`}
              stroke="#0e0d0c"
              strokeWidth={2}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={on ? { pathLength: 1 } : undefined}
              transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
            />
            <motion.circle
              cx={Math.min(box.w * 0.18, 220)}
              cy={y}
              r={8}
              fill="#e0442f"
              initial={{ scale: 0 }}
              animate={on ? { scale: 1 } : undefined}
              transition={{ duration: 0.45, delay: 1.05, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ transformOrigin: `${Math.min(box.w * 0.18, 220)}px ${y}px` }}
            />
          </svg>
        )}
      </div>

      <Container className="mt-12 lg:mt-16">
        <h2 className="font-display text-[clamp(40px,11vw,48px)] font-extrabold leading-[1.04] tracking-[-0.025em] lg:text-[clamp(60px,6vw,96px)]">
          <AnimatedLines text={FINAL.title} />
        </h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={on ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 max-w-[40ch] text-[19px] leading-[1.55] text-ink/75 lg:text-[24px]"
        >
          {FINAL.sub}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={on ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.7, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-9 flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8"
        >
          <Cta withPrice={false} className="w-full justify-center lg:w-auto" />
          <SeatCounter />
        </motion.div>
      </Container>
    </section>
  )
}
