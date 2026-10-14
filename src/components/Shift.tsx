import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { Container, SectionTitle } from './ui'
import { SHIFT } from '../content'

const ease = [0.16, 1, 0.3, 1] as const

/**
 * Before → after, one row at a time: a red stroke crosses out the "before",
 * and only then does the "after" slide in from the right, the way the eye reads.
 */
function Row({ before, after }: { before: string; after: string }) {
  const ref = useRef<HTMLLIElement>(null)
  const on = useInView(ref, { once: true, amount: 0.7 })
  return (
    <li ref={ref} className="grid gap-2 border-t border-ink/10 py-5 lg:grid-cols-2 lg:gap-12 lg:py-7">
      <p className="self-start text-[16px] leading-[1.6] text-ink/50 lg:text-[19px]">
        {/* The strike is a 2px background that grows from the right, line by line on wrapped text. */}
        <motion.span
          className="[box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
          style={{ backgroundImage: 'linear-gradient(#e0442f, #e0442f)', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 58%' }}
          initial={{ backgroundSize: '0% 2px' }}
          animate={on ? { backgroundSize: '100% 2px' } : undefined}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.65, 0, 0.35, 1] }}
        >
          {before}
        </motion.span>
        <span className="sr-only"> (לפני)</span>
      </p>
      <motion.p
        initial={{ opacity: 0, x: 24 }}
        animate={on ? { opacity: 1, x: 0 } : undefined}
        transition={{ duration: 0.7, delay: 0.55, ease }}
        className="text-[19px] font-bold leading-[1.4] text-ink lg:text-[24px] lg:leading-[1.35]"
      >
        {after}
      </motion.p>
    </li>
  )
}

export default function Shift() {
  return (
    <section id="shift" className="py-20 lg:py-32">
      <Container>
        <SectionTitle text={SHIFT.title} />
        <div className="mt-10 lg:mt-14">
          <div className="hidden grid-cols-2 gap-12 pb-4 text-[15px] font-semibold text-ink/55 lg:grid" aria-hidden="true">
            <span>{SHIFT.before}</span>
            <span className="text-claret-deep">{SHIFT.after}</span>
          </div>
          <ul>
            {SHIFT.rows.map(([b, a]) => (
              <Row key={a} before={b} after={a} />
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}
