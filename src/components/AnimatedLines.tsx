import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { motion, useInView } from 'motion/react'

interface AnimatedLinesProps {
  text: string
  className?: string
  style?: CSSProperties
  duration?: number
  stagger?: number
  baseDelay?: number
  amount?: number
}

/**
 * The main site's heading reveal: the text is measured into its real lines, and each line
 * rises out of its own mask. Renders spans only, so it can sit inside <h1>/<h2>/<p>.
 */
function AnimatedLines({ text, className, style, duration = 0.5, stagger = 0.07, baseDelay = 0, amount = 0.4 }: AnimatedLinesProps) {
  const measureRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLSpanElement>(null)
  const [lines, setLines] = useState<string[] | null>(null)
  const words = text.split(' ')
  // Phones scroll fast: start just before the text arrives and play quicker, so a flick never lands on an empty block.
  const [isPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches)
  const inView = useInView(containerRef, isPhone ? { once: true, amount: 0, margin: '0px 0px 12% 0px' } : { once: true, amount })
  const dur = isPhone ? duration * 0.8 : duration
  const gap = isPhone ? stagger * 0.7 : stagger

  useLayoutEffect(() => {
    setLines(null)
  }, [text])

  useLayoutEffect(() => {
    if (!('fonts' in document)) return
    let alive = true
    document.fonts.ready.then(() => alive && setLines(null))
    const onResize = () => setLines(null)
    window.addEventListener('resize', onResize)
    return () => {
      alive = false
      window.removeEventListener('resize', onResize)
    }
  }, [])

  useLayoutEffect(() => {
    if (lines !== null) return
    const el = measureRef.current
    if (!el) return
    const spans = Array.from(el.querySelectorAll<HTMLSpanElement>('span[data-w]'))
    const groups: string[] = []
    let top: number | null = null
    let cur: string[] = []
    spans.forEach((s, i) => {
      const t = s.offsetTop
      if (top === null || Math.abs(t - top) < 2) cur.push(words[i])
      else {
        groups.push(cur.join(' '))
        cur = [words[i]]
      }
      top = t
    })
    if (cur.length) groups.push(cur.join(' '))
    setLines(groups)
  }, [lines, words])

  return (
    <span ref={containerRef} className={`block ${className ?? ''}`} style={style}>
      {lines === null ? (
        <span ref={measureRef} className="block" style={{ visibility: 'hidden' }}>
          {words.map((w, i) => (
            <span key={i} data-w="">
              {w}{' '}
            </span>
          ))}
        </span>
      ) : (
        <>
          {lines.map((line, i) => (
            <span key={i} className="block overflow-hidden" style={{ paddingBottom: '0.12em', marginBottom: '-0.12em' }}>
              <motion.span
                className="inline-block"
                initial={{ y: '105%' }}
                animate={inView ? { y: '0%' } : undefined}
                transition={{ duration: dur, delay: baseDelay + i * gap, ease: [0.16, 1, 0.3, 1] }}
              >
                {line}
              </motion.span>
              {i < lines.length - 1 ? ' ' : null}
            </span>
          ))}
        </>
      )}
    </span>
  )
}

export default AnimatedLines
