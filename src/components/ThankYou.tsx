import { useEffect } from 'react'
import { motion } from 'motion/react'
import { UsersThree, WhatsappLogo } from '@phosphor-icons/react'
import PixelButton from './PixelButton'
import LoopLine from './LoopLine'
import AnimatedLines from './AnimatedLines'
import { Container, Pending } from './ui'
import useSize from '../hooks/useSize'
import { ENTRY, THANKS } from '../content'
import { CONFIG } from '../config'
import { loadOrder, sendPaidClaim } from '../lib/order'
import { trackPurchase } from '../lib/track'
import { useSeats } from '../lib/seats'

const ease = [0.16, 1, 0.3, 1] as const

/** Out of the loop: the thread has gone straight, and the dot lands where the next step starts. */
export default function ThankYou() {
  const s = useSeats()
  const [lineRef, box] = useSize<HTMLDivElement>()

  useEffect(() => {
    window.scrollTo(0, 0)
    const o = loadOrder()
    // back from a payment page (?paid=1): report it like "סיימתי לשלם" (sent once per registration)
    if (o) void sendPaidClaim(o)
    trackPurchase(o?.amount ?? s.tier.single)
  }, [s.tier.single])

  const order = loadOrder()
  const url = CONFIG.siteUrl || `${window.location.origin}${window.location.pathname}`
  const share = `https://wa.me/?text=${encodeURIComponent(THANKS.shareMessage(url))}`

  return (
    <section className="flex min-h-[100dvh] flex-col justify-center pb-16 pt-28 lg:pt-32">
      <div ref={lineRef} className="h-[90px] w-full lg:h-[130px]" aria-hidden="true">
        {box.w > 0 && (
          <LoopLine
            key={box.w}
            width={box.w}
            height={box.h}
            amp={0.36}
            baseline={0.82}
            stroke="#0e0d0c"
            strokeWidth={2}
            delay={0.2}
            duration={1.6}
            dot="#e0442f"
            className="h-full w-full overflow-visible"
          />
        )}
      </div>

      <Container className="mt-10">
        <h1 className="font-display text-[clamp(40px,11vw,48px)] font-extrabold leading-[1.04] tracking-[-0.025em] lg:text-[clamp(56px,5.6vw,88px)]">
          <AnimatedLines text={THANKS.title} baseDelay={1.9} />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 2.2, ease }}
          className="mt-6 max-w-[48ch] text-[19px] leading-[1.6] text-ink/75 lg:text-[22px]"
        >
          {THANKS.text}
        </motion.p>

        {order?.code && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 2.3, ease }}
            className="mt-9 flex flex-col gap-2 rounded-[22px] bg-ink p-6 text-paper sm:flex-row sm:items-center sm:justify-between lg:p-8"
          >
            <div>
              <p className="text-[15px] text-paper/70">{ENTRY.label}</p>
              <p dir="ltr" className="tabular mt-1 text-right font-display text-[44px] font-extrabold leading-none tracking-[0.12em] text-claret lg:text-[56px]">
                {order.code}
              </p>
            </div>
            <p className="max-w-[34ch] text-[15px] leading-[1.5] text-paper/75">
              {CONFIG.leadsEndpoint && order.lead.email ? ENTRY.sent(order.lead.email) : ENTRY.keep}
            </p>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 2.4, ease }} className="mt-9">
          {CONFIG.whatsappGroupUrl ? (
            <PixelButton href={CONFIG.whatsappGroupUrl} target="_blank" rel="noopener" className="flex min-h-[60px] w-full items-center rounded-[18px] bg-claret px-7 text-[19px] font-bold sm:w-auto sm:inline-flex">
              <UsersThree size={22} aria-hidden />
              {THANKS.group}
            </PixelButton>
          ) : (
            <Pending label={`${THANKS.group} (קישור לקבוצה)`} />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 2.6, ease }}
          className="mt-14 flex flex-col gap-4 border-t border-ink/10 pt-8 lg:flex-row lg:items-center lg:justify-between"
        >
          <p className="max-w-[40ch] text-[17px] leading-[1.55] text-ink/75 lg:text-[19px]">{THANKS.shareLine}</p>
          <a
            href={share}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[16px] border border-ink/25 px-6 text-[17px] font-bold transition-colors hover:border-ink hover:bg-ink hover:text-paper"
          >
            <WhatsappLogo size={22} aria-hidden />
            {THANKS.share}
          </a>
        </motion.div>
      </Container>
    </section>
  )
}
