import { motion } from 'motion/react'
import { Container, SectionTitle } from './ui'
import ScrollLoop from './ScrollLoop'
import AnimatedLines from './AnimatedLines'
import { PAIN } from '../content'

const ease = [0.16, 1, 0.3, 1] as const

/**
 * The page's one dark passage: inside the loop. The thread tangles while the problem is read
 * and comes out straight, with the red dot, where the way out begins.
 */
export default function Pain() {
  return (
    <section id="loop" className="relative bg-ink py-20 text-paper lg:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionTitle text={PAIN.title} tone="cream" />
          </div>

          <ul className="flex flex-col gap-3 lg:col-span-7">
            {PAIN.bullets.map((b, i) => (
              <motion.li
                key={b.lead}
                initial={{ opacity: 0, x: 28 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.7, delay: i * 0.08, ease }}
                className="rounded-[22px] border border-paper/12 bg-paper/[0.04] px-5 py-4 text-[17px] leading-[1.55] lg:px-7 lg:py-5 lg:text-[19px]"
              >
                <span className="font-semibold text-paper">{b.lead}</span> <span className="text-paper/75">{b.rest}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease }}
          className="mt-14 max-w-[52ch] text-[18px] leading-[1.65] text-paper/75 lg:mt-20 lg:text-[21px]"
        >
          {PAIN.body}
        </motion.p>

        <p className="mt-12 font-display text-[clamp(36px,10vw,44px)] font-extrabold leading-[1.05] tracking-[-0.02em] lg:mt-16 lg:text-[clamp(52px,5.2vw,80px)]">
          <AnimatedLines text={PAIN.punch} />
        </p>
      </Container>

      <ScrollLoop className="mt-8 h-[120px] w-full lg:mt-10 lg:h-[190px]" />

      <Container className="mt-8 lg:mt-10">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease }}
          className="max-w-[56ch] text-[18px] leading-[1.65] text-paper/80 lg:text-[21px]"
        >
          {PAIN.after}
        </motion.p>
      </Container>
    </section>
  )
}
