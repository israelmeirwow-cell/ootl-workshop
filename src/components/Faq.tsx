import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Container, SectionTitle } from './ui'
import { FAQ } from '../content'

function PlusIcon({ open }: { open: boolean }) {
  return (
    <motion.svg width="18" height="18" viewBox="0 0 18 18" fill="none" animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.3 }} aria-hidden="true">
      <path d="M9 2v14M2 9h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </motion.svg>
  )
}

function Item({ q, a, id, open, onToggle }: { q: string; a: string; id: string; open: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded-[22px] border transition-colors duration-300 ${open ? 'border-ink/15 bg-paper' : 'border-ink/10 hover:border-ink/20'}`}>
      <h3 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-a`}
          onClick={onToggle}
          className="flex min-h-[64px] w-full items-center justify-between gap-4 px-5 py-4 text-start lg:px-6"
        >
          <span className="text-[17px] font-bold leading-[1.4] lg:text-[18px]">{q}</span>
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${open ? 'bg-ink text-paper' : 'bg-ink/[0.06] text-ink'}`}>
            <PlusIcon open={open} />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-a`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.65, 0, 0.35, 1] }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-[16px] leading-[1.6] text-ink/75 lg:px-6 lg:text-[17px]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Faq() {
  const [open, setOpen] = useState<number | null>(null)
  const half = Math.ceil(FAQ.items.length / 2)
  const cols = [FAQ.items.slice(0, half), FAQ.items.slice(half)]
  return (
    <section id="faq" className="py-20 lg:py-32">
      <Container>
        <SectionTitle text={FAQ.title} />
        <div className="mt-10 grid items-start gap-3 lg:mt-14 lg:grid-cols-2 lg:gap-4">
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-3 lg:gap-4">
              {col.map((it, i) => {
                const n = ci * half + i
                return <Item key={it.q} id={`faq-${n}`} q={it.q} a={it.a} open={open === n} onToggle={() => setOpen(open === n ? null : n)} />
              })}
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
