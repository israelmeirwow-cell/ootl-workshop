import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { ArrowCounterClockwise, ChatCircleText, Hammer, Lightbulb } from '@phosphor-icons/react'
import { Container, SectionTitle } from './ui'
import useIsMobile from '../hooks/useIsMobile'
import { METHOD } from '../content'

const ease = [0.16, 1, 0.3, 1] as const
const ICONS = [Lightbulb, Hammer, ChatCircleText, ArrowCounterClockwise]

/*
 * The workshop's own loop, the good one: knowledge → doing → feedback → second try → back to the top, better.
 * It runs counter-clockwise, so from the top it first heads left, the way Hebrew reads.
 */
const C = 200
const R = 150
const GAP = 0.36 // radians kept clear around each node
const pt = (t: number) => [C - R * Math.sin(t), C - R * Math.cos(t)] as const
const NODE = [0, 1, 2, 3].map((i) => pt((i * Math.PI) / 2))

function arc(i: number) {
  const a = (i * Math.PI) / 2 + GAP
  const b = ((i + 1) * Math.PI) / 2 - GAP
  const [x1, y1] = pt(a)
  const [x2, y2] = pt(b)
  // arrowhead along the direction of travel at b
  const tx = -Math.cos(b)
  const ty = Math.sin(b)
  const nx = -ty
  const ny = tx
  const s = 9
  const head = `M${x2 - tx * s + nx * s * 0.7} ${y2 - ty * s + ny * s * 0.7}L${x2} ${y2}L${x2 - tx * s - nx * s * 0.7} ${y2 - ty * s - ny * s * 0.7}`
  return { body: `M${x1} ${y1}A${R} ${R} 0 0 0 ${x2} ${y2}`, head }
}
const ARCS = [0, 1, 2, 3].map(arc)

function Ring({ progress, active }: { progress: MotionValue<number>; active: number }) {
  const cx = useTransform(progress, (p) => pt(p * Math.PI * 2)[0])
  const cy = useTransform(progress, (p) => pt(p * Math.PI * 2)[1])
  const step = METHOD.steps[active]
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px] lg:max-w-[460px]">
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full overflow-visible" fill="none" aria-hidden="true">
        {ARCS.map((a, i) => (
          <g key={i} stroke={i < active ? '#0e0d0c' : '#c9c3b6'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke .4s' }}>
            <path d={a.body} />
            <path d={a.head} />
          </g>
        ))}
        <motion.circle cx={cx} cy={cy} r={9} fill="#e0442f" />
      </svg>

      {NODE.map(([x, y], i) => {
        const Icon = ICONS[i]
        const on = i === active
        const done = i < active
        return (
          <span
            key={i}
            className={`absolute flex h-[60px] w-[60px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-colors duration-300 lg:h-[76px] lg:w-[76px] ${
              on ? 'border-ink bg-ink text-paper' : done ? 'border-ink bg-paper text-ink' : 'border-stone bg-paper text-ink/45'
            }`}
            style={{ left: `${(x / 400) * 100}%`, top: `${(y / 400) * 100}%` }}
            aria-hidden="true"
          >
            <Icon size={26} weight="light" />
          </span>
        )
      })}

      <div className="absolute inset-[24%] flex flex-col items-center justify-center text-center" aria-hidden="true">
        <motion.p key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }} className="text-[22px] font-extrabold leading-tight lg:text-[30px]">
          {step.name}
        </motion.p>
      </div>
    </div>
  )
}

function Steps({ active, all }: { active: number; all: boolean }) {
  return (
    <ol className="flex flex-col gap-2">
      {METHOD.steps.map((s, i) => {
        const on = all || i === active
        return (
          <li
            key={s.name}
            className={`flex gap-4 rounded-[20px] px-4 py-3.5 transition-colors duration-300 lg:px-5 lg:py-4 ${on ? 'bg-paper shadow-[0_14px_30px_-24px_rgba(60,40,20,0.5)]' : ''}`}
          >
            <span className={`tabular mt-0.5 text-[15px] font-bold ${on ? 'text-claret' : 'text-ink/40'}`}>{i + 1}</span>
            <span>
              <span className={`block text-[19px] font-extrabold leading-tight lg:text-[21px] ${on ? 'text-ink' : 'text-ink/55'}`}>{s.name}</span>
              <span className={`mt-1 block text-[16px] leading-[1.5] lg:text-[17px] ${on ? 'text-ink/75' : 'text-ink/50'}`}>{s.text}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function useActive(progress: MotionValue<number>) {
  const [active, setActive] = useState(0)
  useMotionValueEvent(progress, 'change', (p) => setActive(Math.min(3, Math.floor(p * 4 + 0.02))))
  return active
}

/** Desktop: the section holds still while the scroll drives the dot around once. */
function PinnedCycle() {
  const wrap = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start start', 'end end'] })
  const progress = useTransform(scrollYProgress, [0.08, 0.88], [0, 1], { clamp: true })
  const active = useActive(progress)
  return (
    <div ref={wrap} className="relative h-[230vh]">
      <div className="sticky top-0 flex h-screen items-center">
        <Container className="grid grid-cols-12 items-center gap-16">
          <div className="col-span-6">
            <SectionTitle text={METHOD.title} />
            <p className="mt-6 max-w-[48ch] text-[20px] leading-[1.6] text-ink/75">{METHOD.text}</p>
            <div className="mt-10">
              <Steps active={active} all={false} />
            </div>
          </div>
          <div className="col-span-6">
            <Ring progress={progress} active={active} />
          </div>
        </Container>
      </div>
    </div>
  )
}

/** Phone: no pinning. The dot runs the loop once when the ring comes into view, steps lighting in turn. */
function PlayedCycle() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.55 })
  const progress = useMotionValue(0)
  const active = useActive(progress)
  useEffect(() => {
    if (!inView) return
    const c = animate(progress, 0.999, { duration: 6.4, ease: [0.45, 0, 0.55, 1] })
    return () => c.stop()
  }, [inView, progress])
  return (
    <Container>
      <SectionTitle text={METHOD.title} />
      <p className="mt-5 text-[18px] leading-[1.6] text-ink/75">{METHOD.text}</p>
      <div ref={ref} className="mt-10">
        <Ring progress={progress} active={active} />
      </div>
      <div className="mt-8">
        <Steps active={active} all={false} />
      </div>
    </Container>
  )
}

function StaticCycle() {
  const progress = useMotionValue(0)
  return (
    <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div>
        <SectionTitle text={METHOD.title} />
        <p className="mt-5 text-[18px] leading-[1.6] text-ink/75 lg:text-[20px]">{METHOD.text}</p>
        <div className="mt-8">
          <Steps active={0} all />
        </div>
      </div>
      <Ring progress={progress} active={0} />
    </Container>
  )
}

export default function Method() {
  const isMobile = useIsMobile()
  const reduce = useReducedMotion()
  return (
    <section id="method" className="py-20 lg:py-0">
      {reduce ? <StaticCycle /> : isMobile ? <PlayedCycle /> : <PinnedCycle />}

      <Container className="lg:pb-32">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.7, ease }}
          className="mt-14 max-w-[30ch] text-[26px] font-extrabold leading-[1.25] tracking-[-0.015em] lg:mt-0 lg:text-[36px]"
        >
          {METHOD.bold}
        </motion.p>
        <p className="mt-5 max-w-[64ch] text-[15px] leading-[1.6] text-ink/60 lg:text-[16px]">{METHOD.small}</p>
      </Container>
    </section>
  )
}
