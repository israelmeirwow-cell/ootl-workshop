import { useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { Brand, Cta, InstagramLink, shekel, useCtaLabel } from './ui'
import PixelButton from './PixelButton'
import { leftPhrase, useSeats } from '../lib/seats'
import { CONFIG } from '../config'
import { RAZ } from '../content'

/** Top bar: the brand, and on desktop the one action. Turns solid once the hero is behind. */
export function Header({ showCta = true }: { showCta?: boolean }) {
  const { scrollY } = useScroll()
  const [solid, setSolid] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setSolid(y > 40))

  return (
    <motion.header
      initial={{ y: '-100%' }}
      animate={{ y: '0%' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        solid ? 'border-b border-ink/10 bg-cream/85 backdrop-blur-md' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <a href="#top" className="flex min-h-[44px] items-center" aria-label="יציאה מהלופ, לראש העמוד">
          <Brand size={34} />
        </a>
        <AnimatePresence>
          {showCta && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="hidden lg:block">
              <Cta size="md" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}

/**
 * Phone only: the registration button stays under the thumb for the whole scroll (brief: "כפתור הרשמה דביק").
 * It steps aside while the form itself is on screen.
 */
export function StickyBar({ hidden }: { hidden: boolean }) {
  const s = useSeats()
  const label = useCtaLabel(true)
  const { scrollY } = useScroll()
  const [past, setPast] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setPast(y > 120))
  const show = past && !hidden

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: '110%' }}
          animate={{ y: '0%' }}
          exit={{ y: '110%' }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-cream/90 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden"
        >
          {!s.full && (
            <p className="mb-2 flex items-center justify-center gap-2 text-[14px] leading-none text-ink/70">
              <strong className="tabular font-bold text-claret">{leftPhrase(s.left)}</strong>
              <span>במחיר הזה</span>
              {s.showFull && <del className="tabular text-ink/45">{shekel(CONFIG.fullPrice)}</del>}
            </p>
          )}
          <PixelButton href="#register" className="flex min-h-[56px] w-full items-center justify-center rounded-[16px] bg-claret text-[18px] font-bold">
            {label}
          </PixelButton>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-cream pb-36 pt-12 lg:pb-14">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col items-start gap-6 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <Brand size={40} />
        <div className="flex flex-col items-start gap-1 lg:flex-row lg:items-center lg:gap-8">
          <InstagramLink href={CONFIG.team.razInstagram} name={RAZ.instagramName} />
          <p className="text-[15px] text-ink/60">סדנה מעשית · {CONFIG.event.city}</p>
        </div>
      </div>
    </footer>
  )
}
