import { useRef, type ReactNode } from 'react'
import { motion, useInView } from 'motion/react'
import { InstagramLogo } from '@phosphor-icons/react'
import PixelButton from './PixelButton'
import AnimatedLines from './AnimatedLines'
import LogoMark from './LogoMark'
import { leftPhrase, useSeats } from '../lib/seats'
import { CONFIG } from '../config'
import { WAITLIST_CTA } from '../content'

export const isDev = import.meta.env.DEV

/** '/images/raz.jpg' → the same file under the site's base path (e.g. /ootl-workshop/images/raz.jpg on GitHub Pages). */
export function asset(path: string) {
  return path.startsWith('/') && !path.startsWith('//') ? import.meta.env.BASE_URL.replace(/\/$/, '') + path : path
}

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10 ${className}`}>{children}</div>
}

/**
 * A detail the client still has to send (date, names, texts).
 * Dev: a dashed marker so it is not forgotten. Live build: nothing at all.
 */
export function Pending({ label, className = '' }: { label: string; className?: string }) {
  if (!isDev) return null
  return (
    <span
      title="חסר: יגיע מהלקוח"
      className={`inline-flex items-center rounded-md border border-dashed border-claret-deep/50 px-1.5 text-[0.85em] font-medium text-claret-deep ${className}`}
    >
      {label}
    </span>
  )
}

export function SectionTitle({ text, className = '', tone = 'ink' }: { text: string; className?: string; tone?: 'ink' | 'cream' }) {
  return (
    <h2
      className={`font-display text-[clamp(34px,8.6vw,40px)] font-extrabold leading-[1.06] tracking-[-0.02em] lg:text-[clamp(44px,4.2vw,64px)] ${
        tone === 'cream' ? 'text-paper' : 'text-ink'
      } ${className}`}
    >
      <AnimatedLines text={text} />
    </h2>
  )
}

export const shekel = (n: number) => `${n.toLocaleString('he-IL')} ש״ח`

/** CTA label per the brief: "שומרים לי מקום · 49 ש״ח", or the waitlist line when sold out. */
export function useCtaLabel(withPrice: boolean) {
  const s = useSeats()
  if (s.full) return WAITLIST_CTA
  return withPrice ? `שומרים לי מקום · ${shekel(s.tier.single)}` : 'שומרים לי מקום'
}

export function Cta({ withPrice = true, className = '', size = 'lg' }: { withPrice?: boolean; className?: string; size?: 'lg' | 'md' }) {
  const label = useCtaLabel(withPrice)
  const pad = size === 'lg' ? 'min-h-[60px] px-7 text-[19px]' : 'min-h-[48px] px-5 text-[17px]'
  return (
    <PixelButton href="#register" className={`flex items-center justify-center rounded-[18px] bg-claret font-bold tracking-[-0.005em] shadow-[0_10px_30px_-12px_rgba(168,50,31,0.55)] ${pad} ${className}`}>
      {label}
    </PixelButton>
  )
}

/**
 * The real seats left at today's price, as squares: red = still open, stone = taken.
 * Fills in one by one the first time it is seen.
 */
export function SeatPips({ size = 10, className = '' }: { size?: number; className?: string }) {
  const s = useSeats()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  if (s.full) return null
  return (
    <span ref={ref} className={`inline-flex flex-wrap gap-[3px] ${className}`} aria-hidden="true">
      {Array.from({ length: s.tier.seats }, (_, i) => {
        const open = i >= s.takenInTier
        return (
          <motion.span
            key={i}
            className={`block rounded-[2px] ${open ? 'bg-claret' : 'bg-stone'}`}
            style={{ width: size, height: size }}
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : undefined}
            transition={{ duration: 0.3, delay: i * 0.035, ease: [0.34, 1.56, 0.64, 1] }}
          />
        )
      })}
    </span>
  )
}

/** "נשארו X מקומות ב-49 ש״ח", with the full price struck beside it while it is lower. */
export function SeatCounter({ className = '', inTier = false, tone = 'ink' }: { className?: string; inTier?: boolean; tone?: 'ink' | 'cream' }) {
  const s = useSeats()
  if (s.full) return null
  const muted = tone === 'cream' ? 'text-paper/60' : 'text-ink/55'
  return (
    <p className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-[16px] leading-tight ${tone === 'cream' ? 'text-paper' : 'text-ink'} ${className}`}>
      <SeatPips />
      <span className="tabular">
        <strong className="font-extrabold text-claret">{leftPhrase(s.left).replace(/^(\S+) /, '$1 ')}</strong>{' '}
        {inTier ? 'במחיר הזה' : <>ב-{shekel(s.tier.single)}</>}
        {s.showFull && !inTier && (
          <del className={`ms-2 ${muted} decoration-[1.5px]`} aria-label={`במקום ${shekel(CONFIG.fullPrice)}`}>
            {shekel(CONFIG.fullPrice)}
          </del>
        )}
      </span>
    </p>
  )
}

export function Brand({ tone = 'ink', size = 36 }: { tone?: 'ink' | 'cream'; size?: number }) {
  const color = tone === 'cream' ? '#fbf8f3' : '#0e0d0c'
  return (
    <span className="flex items-center gap-2 font-serif" style={{ color }}>
      <LogoMark size={size} color={color} />
      <span className="flex flex-col text-[17px] leading-[0.98]">
        <span>יציאה</span>
        <span className="font-light">מהלופ</span>
      </span>
    </span>
  )
}

/**
 * A real photo when the client sends one; until then an ink plate with the loop mark,
 * never a stock or generated face.
 */
export function Photo({
  src,
  alt,
  className = '',
  round = false,
  initials,
  position,
}: {
  src: string
  alt: string
  className?: string
  round?: boolean
  initials?: string
  /** Where the face is, so tight crops (circles, 4:5) keep it, e.g. '54% 28%'. */
  position?: string
}) {
  const shape = round ? 'rounded-full' : 'rounded-[28px]'
  if (src)
    return (
      <img
        src={asset(src)}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`block bg-soot object-cover ${shape} ${className}`}
        style={position ? { objectPosition: position } : undefined}
      />
    )
  return (
    <span role="img" aria-label={alt} className={`relative flex items-center justify-center overflow-hidden bg-[#e7e1d6] [container-type:inline-size] ${shape} ${className}`}>
      {initials ? (
        <span className="font-serif text-[34cqi] font-light leading-none text-ink/70">{initials}</span>
      ) : (
        <LogoMark size={88} color="rgba(14,13,12,0.75)" />
      )}
      {isDev && !round && <span className="absolute bottom-3 text-[12px] text-ink/45">תמונה תגיע</span>}
    </span>
  )
}

/** A link to an Instagram profile: the logo and the profile's display name. */
export function InstagramLink({ href, name, className = '', tone = 'ink' }: { href: string; name: string; className?: string; tone?: 'ink' | 'cream' }) {
  if (!href) return null
  const color = tone === 'cream' ? 'text-paper/80 hover:text-paper' : 'text-ink/70 hover:text-ink'
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={`inline-flex min-h-[44px] items-center gap-2 text-[15px] font-semibold underline-offset-4 transition-colors hover:underline ${color} ${className}`}
    >
      <InstagramLogo size={20} aria-hidden />
      <span>{name}</span>
    </a>
  )
}
