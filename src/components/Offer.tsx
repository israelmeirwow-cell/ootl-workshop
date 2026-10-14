import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { Check } from '@phosphor-icons/react'
import { Container, Cta, SeatCounter, SectionTitle, shekel } from './ui'
import { OFFER, PRICING } from '../content'
import { CONFIG } from '../config'
import { useSeats } from '../lib/seats'

const ease = [0.16, 1, 0.3, 1] as const

/**
 * "What's waiting for you" printed as the thing being bought: an admission ticket,
 * with the price on its tear-off stub.
 */
function Ticket() {
  const s = useSeats()
  const ref = useRef<HTMLDivElement>(null)
  const on = useInView(ref, { once: true, amount: 0.3 })
  const notch = 'absolute h-8 w-8 rounded-full border border-ink/10 bg-cream'
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, rotate: -1.2 }}
      animate={on ? { opacity: 1, y: 0, rotate: 0 } : undefined}
      transition={{ duration: 0.9, ease }}
      className="relative mt-10 overflow-hidden rounded-[28px] border border-ink/10 bg-paper lg:mt-14 lg:grid lg:grid-cols-[1fr_380px]"
    >
      <ul className="grid gap-x-10 gap-y-4 p-6 sm:p-8 lg:grid-cols-2 lg:p-12">
        {OFFER.items.map((it, i) => (
          <motion.li
            key={it}
            initial={{ opacity: 0, x: 16 }}
            animate={on ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: 0.6, delay: 0.25 + i * 0.06, ease }}
            className="flex gap-3 text-[17px] leading-[1.5] lg:text-[18px]"
          >
            <span className="mt-[3px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
              <Check size={14} weight="bold" aria-hidden />
            </span>
            {it}
          </motion.li>
        ))}
      </ul>

      {/* the perforation, with a notch cut at each end */}
      <div className="relative">
        <span className="absolute inset-x-8 top-0 border-t-2 border-dashed border-ink/15 lg:inset-x-auto lg:inset-y-8 lg:right-0 lg:border-r-2 lg:border-t-0" aria-hidden="true" />
        <span className={`${notch} -right-4 -top-4 lg:-right-4 lg:-top-4`} aria-hidden="true" />
        <span className={`${notch} -left-4 -top-4 lg:-bottom-4 lg:-right-4 lg:left-auto lg:top-auto`} aria-hidden="true" />

        <div className="flex h-full flex-col justify-center gap-5 p-6 sm:p-8 lg:p-10">
          {!s.full && (
            <p className="font-extrabold tracking-[-0.02em]">
              <span className="block text-[22px] leading-tight">כל זה ב-</span>
              <span className="mt-1 flex flex-wrap items-baseline gap-x-3">
                <span className="tabular text-[52px] leading-none text-claret lg:text-[60px]">{shekel(s.tier.single)}.</span>
                {s.showFull && <del className="tabular text-[22px] font-semibold text-ink/45">{shekel(CONFIG.fullPrice)}</del>}
              </span>
            </p>
          )}
          <p className="text-[16px] leading-[1.55] text-ink/70">{OFFER.summaryUnder}</p>
          <Cta className="w-full justify-center" />
        </div>
      </div>
    </motion.div>
  )
}

/** The price ladder as seats: three blocks sized 12 : 8 : 5, today's block lit, the next ones grey. */
function Ladder() {
  const s = useSeats()
  const ref = useRef<HTMLOListElement>(null)
  const on = useInView(ref, { once: true, amount: 0.3 })
  return (
    <ol ref={ref} className="mt-10 grid gap-3 lg:mt-12 lg:grid-cols-[minmax(0,12fr)_minmax(0,8fr)_minmax(230px,5fr)] lg:gap-4">
      {CONFIG.tiers.map((t, ti) => {
        const past = s.full || ti < s.tierIndex
        const now = !s.full && ti === s.tierIndex
        const before = CONFIG.tiers.slice(0, ti).reduce((a, x) => a + x.seats, 0)
        return (
          <motion.li
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            animate={on ? { opacity: now ? 1 : 0.55, y: 0 } : undefined}
            transition={{ duration: 0.7, delay: ti * 0.12, ease }}
            className={`flex flex-col rounded-[22px] border p-5 lg:p-6 ${now ? 'border-claret bg-paper shadow-[0_0_0_1px_#e0442f]' : 'border-ink/10'}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[19px] font-extrabold">{t.name}</h3>
              <span className="tabular text-[14px] text-ink/60">
                {t.seats} {t.label}
              </span>
            </div>

            <span className="mt-4 flex flex-wrap gap-[4px]" aria-hidden="true">
              {Array.from({ length: t.seats }, (_, i) => {
                const taken = before + i < s.sold
                return (
                  <motion.span
                    key={i}
                    className={`block h-3 w-3 rounded-[2px] ${taken ? 'bg-ink/25' : now ? 'bg-claret' : 'border border-ink/25'}`}
                    initial={{ scale: 0 }}
                    animate={on ? { scale: 1 } : undefined}
                    transition={{ duration: 0.3, delay: 0.35 + ti * 0.12 + i * 0.03, ease: [0.34, 1.56, 0.64, 1] }}
                  />
                )
              })}
            </span>

            <dl className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-2">
              <div>
                <dt className="text-[13px] font-semibold text-ink/55">{PRICING.head.single}</dt>
                <dd className={`tabular m-0 text-[30px] font-extrabold leading-none ${now ? 'text-claret' : ''} ${past ? 'line-through decoration-2' : ''}`}>
                  {shekel(t.single)}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-semibold text-ink/55">{PRICING.head.pair}</dt>
                <dd className={`tabular m-0 text-[20px] font-bold leading-none ${past ? 'line-through' : ''}`}>{shekel(t.pair)}</dd>
              </div>
            </dl>
          </motion.li>
        )
      })}
    </ol>
  )
}

export default function Offer() {
  const s = useSeats()
  return (
    <section id="offer" className="py-20 lg:py-32">
      <Container>
        <SectionTitle text={OFFER.title} />
        <Ticket />

        <div className="mt-20 lg:mt-28">
          <SectionTitle text={PRICING.title} className="max-w-[20ch]" />
          <p className="mt-5 max-w-[60ch] text-[18px] leading-[1.65] text-ink/75 lg:text-[20px]">{PRICING.text}</p>
          <Ladder />

          <div className="mt-6 flex flex-col gap-6 rounded-[22px] bg-ink p-6 text-paper lg:mt-8 lg:flex-row lg:items-center lg:justify-between lg:p-8">
            <p className="text-[18px] leading-[1.5] lg:text-[20px]">
              <span className="block font-extrabold">באים בזוג</span>
              <span className="font-semibold">{PRICING.pairBox.lead}</span>{' '}
              <span className="text-paper/80">
                2 כרטיסים ב-<span className="tabular font-bold text-paper">{shekel(s.tier.pair)}</span>
                {s.tierIndex === 0 ? ' במחיר ההשקה.' : '.'}
              </span>
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">
            <Cta withPrice={false} className="w-full justify-center lg:w-auto" />
            <SeatCounter inTier />
          </div>
        </div>
      </Container>
    </section>
  )
}
