import { useMemo, useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { Container, SectionTitle } from './ui'
import { loopPoints, smooth, toPath } from '../lib/loop'
import { FIT } from '../content'

const ease = [0.16, 1, 0.3, 1] as const
const W = 220
const H = 60

/** Each situation as its own piece of the loop: still tangled, one knot left, or a line just starting. */
const SHAPES = [
  { amp: 0.4, straight: () => 1 },
  { amp: 0.4, straight: (u: number) => 1 - smooth(0.42, 0.62, u) },
  { amp: 0.4, straight: () => 0 },
]

function Glyph({ index, play }: { index: number; play: boolean }) {
  const { d, end } = useMemo(() => {
    const pts = loopPoints(W, H, { baseline: 0.82, amp: SHAPES[index].amp, straight: SHAPES[index].straight })
    return { d: toPath(pts.filter((_, k) => k % 3 === 0)), end: pts[pts.length - 1] }
  }, [index])
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[54px] w-[200px] overflow-visible" fill="none" aria-hidden="true">
      <motion.path
        d={d}
        stroke="#0e0d0c"
        strokeWidth={1.8}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={play ? { pathLength: 1 } : undefined}
        transition={{ duration: 1.3, delay: 0.15 + index * 0.15, ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.circle
        cx={end[0]}
        cy={end[1]}
        r={5}
        fill="#e0442f"
        initial={{ scale: 0 }}
        animate={play ? { scale: 1 } : undefined}
        transition={{ duration: 0.4, delay: 1.35 + index * 0.15, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ transformOrigin: `${end[0]}px ${end[1]}px` }}
      />
    </svg>
  )
}

export default function Fit() {
  const ref = useRef<HTMLDivElement>(null)
  const play = useInView(ref, { once: true, amount: 0.25 })

  return (
    <section id="fit" className="py-20 lg:py-32">
      <Container>
        <SectionTitle text={FIT.title} className="max-w-[16ch]" />

        <div ref={ref} className="mt-10 grid gap-4 lg:mt-14 lg:grid-cols-3 lg:gap-6">
          {FIT.cards.map((c, i) => (
            <motion.article
              key={c.title}
              initial={{ opacity: 0, y: 28 }}
              animate={play ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.8, delay: i * 0.1, ease }}
              className={`flex flex-col rounded-[28px] border border-ink/[0.07] bg-paper p-6 shadow-[0_18px_40px_-28px_rgba(60,40,20,0.35)] lg:p-8 ${
                i === 1 ? 'lg:translate-y-10' : ''
              }`}
            >
              <Glyph index={i} play={play} />
              <h3 className="mt-6 text-[26px] font-extrabold leading-[1.15] tracking-[-0.015em] lg:text-[30px]">{c.title}</h3>
              <p className="mt-3 text-[17px] leading-[1.6] text-ink/75 lg:text-[18px]">{c.text}</p>
            </motion.article>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.7, ease }}
          className="mt-12 max-w-[60ch] border-t border-ink/10 pt-6 text-[17px] leading-[1.6] text-ink/70 lg:mt-20 lg:text-[18px]"
        >
          <strong className="font-bold text-ink">{FIT.notFor.lead}</strong> {FIT.notFor.rest}
        </motion.p>
      </Container>
    </section>
  )
}
