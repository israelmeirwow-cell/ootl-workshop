import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { CalendarBlank, Clock, ForkKnife, MapPin } from '@phosphor-icons/react'
import AnimatedWords from './AnimatedWords'
import LoopLine from './LoopLine'
import { Container, Cta, Pending, Photo, SeatCounter } from './ui'
import { HERO } from '../content'
import { CONFIG } from '../config'
import useSize from '../hooks/useSize'

const ease = [0.16, 1, 0.3, 1] as const
/** The line finishes writing at this moment; the dot lands, then the action appears. */
const LINE_DELAY = 0.55
const LINE_DUR = 1.9
const LANDED = LINE_DELAY + LINE_DUR

function Details() {
  const { city, date, hours } = CONFIG.event
  const item = 'inline-flex items-center gap-1.5 whitespace-nowrap'
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[16px] font-medium text-ink/80">
      <li className={item}>
        <MapPin size={19} weight="light" aria-hidden />
        {city}
      </li>
      <li className={item}>
        <CalendarBlank size={19} weight="light" aria-hidden />
        {date || <Pending label="תאריך" />}
      </li>
      <li className={item}>
        <Clock size={19} weight="light" aria-hidden />
        4 שעות
        {hours && <span className="tabular text-ink/60">({hours})</span>}
      </li>
      <li className={item}>
        <ForkKnife size={19} weight="light" aria-hidden />
        אוכל ושתייה עלינו
      </li>
    </ul>
  )
}

/**
 * Until there is one photo of both founders (CONFIG.photos.hero), their two portraits meet:
 * each slides in from its own side and settles slightly overlapped, like two prints on a table.
 */
function Founders({ inView }: { inView: boolean }) {
  const card = 'absolute w-[60%] overflow-hidden rounded-[26px] shadow-[0_24px_50px_-28px_rgba(40,25,10,0.55)] ring-1 ring-ink/10'
  return (
    <div className="relative mx-auto aspect-[5/6] w-full max-w-[400px] lg:max-w-[min(480px,calc((100dvh-170px)*0.83))]">
      <motion.figure
        initial={{ opacity: 0, x: 60, rotate: 6 }}
        animate={inView ? { opacity: 1, x: 0, rotate: 2.5 } : undefined}
        transition={{ duration: 1.1, delay: 0.45, ease }}
        className={`${card} right-0 top-0 aspect-[4/5]`}
      >
        <Photo src={CONFIG.photos.raz} alt="רז בזק" position="54% 22%" className="h-full w-full rounded-none" />
      </motion.figure>
      <motion.figure
        initial={{ opacity: 0, x: -60, rotate: -6 }}
        animate={inView ? { opacity: 1, x: 0, rotate: -2.5 } : undefined}
        transition={{ duration: 1.1, delay: 0.6, ease }}
        className={`${card} bottom-0 left-0 aspect-[4/5]`}
      >
        <Photo src={CONFIG.photos.partner} alt="לבב מלכה" position="60% 34%" className="h-full w-full rounded-none" />
      </motion.figure>
    </div>
  )
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const [lineRef, box] = useSize<HTMLDivElement>()
  const show = (delay: number, y = 14) => ({
    initial: { opacity: 0, y },
    animate: inView ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.7, delay, ease },
  })

  return (
    <section id="top" ref={ref} className="relative overflow-hidden pb-16 pt-[92px] lg:pb-20 lg:pt-[104px]">
      <Container className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <motion.p {...show(0.15, 8)} className="inline-flex rounded-full border border-ink/15 px-3 py-1 text-[14px] font-medium text-ink/70">
            {HERO.tag}
          </motion.p>

          <motion.p {...show(0.25, 10)} className="mt-5 text-[17px] font-semibold text-claret-deep lg:text-[19px]">
            {HERO.hook}
          </motion.p>

          <h1 className="mt-3 font-display text-[clamp(40px,11vw,48px)] font-extrabold leading-[1.03] tracking-[-0.025em] text-ink lg:text-[clamp(52px,4.5vw,70px)]">
            <AnimatedWords text={HERO.title} isInView={inView} baseDelay={0.35} stagger={0.06} duration={0.6} />
          </h1>

          {/* The signature: the loop tangles where the hesitating is, then leaves straight, ending in the red dot. */}
          <div ref={lineRef} className="relative -mx-5 mt-5 h-[78px] sm:-mx-8 lg:mx-0 lg:mt-5 lg:h-[84px]">
            {box.w > 0 && (
              <LoopLine
                key={box.w}
                width={box.w}
                height={box.h}
                amp={0.36}
                baseline={0.82}
                stroke="#0e0d0c"
                strokeWidth={2}
                isInView={inView}
                delay={LINE_DELAY}
                duration={LINE_DUR}
                dot="#e0442f"
                className="absolute inset-0 h-full w-full overflow-visible"
              />
            )}
          </div>

          <motion.p {...show(LANDED - 0.6)} className="mt-5 max-w-[56ch] text-[17px] leading-[1.6] text-ink/80 lg:text-[19px]">
            {HERO.sub}
          </motion.p>

          <motion.div {...show(LANDED - 0.45)} className="mt-6">
            <Details />
          </motion.div>

          <motion.div {...show(LANDED - 0.1, 10)} className="mt-8 flex flex-col gap-4 lg:mt-7 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-6 lg:gap-y-3">
            <Cta className="w-full justify-center lg:w-auto" />
            <SeatCounter />
          </motion.div>
        </div>

        <div className="lg:col-span-5">
          {CONFIG.photos.hero || !(CONFIG.photos.raz && CONFIG.photos.partner) ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={inView ? { opacity: 1, scale: 1 } : undefined} transition={{ duration: 1, delay: 0.4, ease }}>
              <Photo
                src={CONFIG.photos.hero}
                alt="רז בזק ולבב מלכה"
                className="aspect-square w-full sm:aspect-[4/5] lg:aspect-auto lg:h-[min(640px,calc(100dvh-170px))]"
              />
            </motion.div>
          ) : (
            <Founders inView={inView} />
          )}
        </div>
      </Container>
    </section>
  )
}
