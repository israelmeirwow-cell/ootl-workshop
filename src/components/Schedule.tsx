import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CaretDown, ChatsCircle, Coffee, Crosshair, Footprints, Handshake, Spiral, UsersThree, VideoCamera } from '@phosphor-icons/react'
import { Container, SectionTitle } from './ui'
import useIsMobile from '../hooks/useIsMobile'
import { SCHEDULE, type Stage } from '../content'

const ease = [0.16, 1, 0.3, 1] as const
const ICONS = [UsersThree, Spiral, Crosshair, VideoCamera, Coffee, ChatsCircle, Footprints, Handshake]
const TOTAL = SCHEDULE.stages.reduce((s, x) => s + x.minutes, 0) // 240
const STARTS = SCHEDULE.stages.map((_, i) => SCHEDULE.stages.slice(0, i).reduce((sum, x) => sum + x.minutes, 0))

/* The 4 hours as a clock face: one arc per block, sized by its minutes, clockwise from the top. */
function arcPath(i: number, C: number, R: number, gap: number) {
  const a = (STARTS[i] / TOTAL) * Math.PI * 2 + gap
  const b = ((STARTS[i] + SCHEDULE.stages[i].minutes) / TOTAL) * Math.PI * 2 - gap
  const p = (t: number) => `${(C + R * Math.sin(t)).toFixed(2)} ${(C - R * Math.cos(t)).toFixed(2)}`
  return `M${p(a)}A${R} ${R} 0 0 1 ${p(b)}`
}

const minutesLabel = (m: number) => `${m} דק׳`

function Dial({ active }: { active: number }) {
  const s = SCHEDULE.stages[active]
  return (
    <div className="relative aspect-square w-full max-w-[420px]">
      <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
        {SCHEDULE.stages.map((_, i) => (
          <path
            key={i}
            d={arcPath(i, 150, 128, 0.035)}
            strokeWidth={i === active ? 18 : 12}
            stroke={i === active ? '#e0442f' : i < active ? '#0e0d0c' : '#d6d2c8'}
            style={{ transition: 'stroke .35s' }}
          />
        ))}
      </svg>
      <div className="absolute inset-[22%] flex flex-col items-center justify-center text-center">
        <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }}>
          <p className="tabular text-[56px] font-extrabold leading-none text-claret">{s.minutes}</p>
          <p className="mt-1 text-[15px] font-semibold text-ink/60">דקות</p>
          <p className="mt-3 text-[18px] font-bold leading-tight">{s.name}</p>
        </motion.div>
      </div>
    </div>
  )
}

function MiniRing({ index }: { index: number }) {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" fill="none" aria-hidden="true">
      {SCHEDULE.stages.map((_, i) => (
        <path key={i} d={arcPath(i, 20, 15, 0.06)} strokeWidth={i === index ? 5 : 3} stroke={i === index ? '#e0442f' : '#d6d2c8'} />
      ))}
    </svg>
  )
}

function Meta({ stage }: { stage: Stage }) {
  return (
    <span className="text-[15px] text-ink/60">
      <span className="tabular">{minutesLabel(stage.minutes)}</span>
      {stage.lead && <> · {stage.lead}</>}
    </span>
  )
}

function Rows({ stage }: { stage: Stage }) {
  return (
    <dl className="flex flex-col gap-3">
      {stage.rows.map((r) => {
        const out = r.label === 'יוצאים עם'
        return (
          <div key={r.label} className={`grid gap-1 lg:grid-cols-[96px_1fr] lg:gap-4 ${out ? 'rounded-[14px] bg-cream px-3 py-2.5 lg:-mx-3' : ''}`}>
            <dt className={`text-[14px] font-bold lg:pt-[3px] ${out ? 'text-claret-deep' : 'text-ink/55'}`}>{r.label}</dt>
            <dd className={`m-0 text-[16px] leading-[1.55] lg:text-[17px] ${out ? 'font-semibold text-ink' : 'text-ink/80'}`}>{r.text}</dd>
          </div>
        )
      })}
    </dl>
  )
}

function StageIcon({ i, on }: { i: number; on: boolean }) {
  const Icon = ICONS[i]
  return (
    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${on ? 'border-ink bg-ink text-paper' : 'border-ink/15 bg-paper text-ink'}`}>
      <Icon size={24} weight="light" aria-hidden />
    </span>
  )
}

/** Desktop: every block open, a clock face that follows the block in the middle of the screen. */
function DesktopSchedule() {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLLIElement | null)[]>([])
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i))
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    refs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="mt-16 grid grid-cols-12 gap-16">
      <ol className="col-span-7 flex flex-col">
        {SCHEDULE.stages.map((s, i) => (
          <li
            key={s.name}
            ref={(el) => {
              refs.current[i] = el
            }}
            data-i={i}
            className="grid grid-cols-[48px_1fr] gap-6 border-t border-ink/10 py-9"
          >
            <StageIcon i={i} on={i === active} />
            <div>
              <h3 className="text-[26px] font-extrabold leading-tight tracking-[-0.01em]">{s.name}</h3>
              <p className="mt-1">
                <Meta stage={s} />
              </p>
              <div className="mt-5">
                <Rows stage={s} />
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div className="col-span-5">
        <div className="sticky top-28 flex justify-center">
          <Dial active={active} />
        </div>
      </div>
    </div>
  )
}

/** Phone: a vertical timeline of accordions (brief: "אקורדיון שנפתח בלחיצה"). */
function MobileSchedule() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <ol className="relative mt-10">
      {SCHEDULE.stages.map((s, i) => {
        const isOpen = open === i
        return (
          <li key={s.name} className="relative border-t border-ink/10">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`stage-${i}`}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center gap-3 py-4 text-start"
            >
              <StageIcon i={i} on={isOpen} />
              <span className="min-w-0 flex-1">
                <span className="block text-[18px] font-extrabold leading-tight">{s.name}</span>
                <Meta stage={s} />
              </span>
              <MiniRing index={i} />
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className="text-ink/50">
                <CaretDown size={18} aria-hidden />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`stage-${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.65, 0, 0.35, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-6 ps-[60px]">
                    <Rows stage={s} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        )
      })}
    </ol>
  )
}

export default function Schedule() {
  const isMobile = useIsMobile()
  return (
    <section id="schedule" className="bg-paper py-20 lg:py-32">
      <Container>
        <SectionTitle text={SCHEDULE.title} />
        <p className="mt-4 text-[18px] text-ink/65 lg:text-[21px]">{SCHEDULE.sub}</p>
        {isMobile ? <MobileSchedule /> : <DesktopSchedule />}
      </Container>
    </section>
  )
}
