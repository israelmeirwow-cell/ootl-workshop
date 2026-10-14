import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'

function hash(i: number) {
  let t = (i * 374761393 + 668265263) | 0
  t = ((t ^ (t >> 13)) * 1274126177) | 0
  return ((t ^ (t >> 16)) >>> 0) / 4294967295
}

type Common = {
  children: ReactNode
  className?: string
  contentClassName?: string
  /** Label color at rest and once the pixels have covered the button. */
  textColor?: string
  hoverTextColor?: string
  pixelColor?: string
  pixelSize?: number
  speed?: number
  disabled?: boolean
  ariaLabel?: string
}

type AsLink = Common & { as?: 'a'; href: string; target?: string; rel?: string; onClick?: () => void }
type AsButton = Common & { as: 'button'; type?: 'button' | 'submit'; onClick?: () => void }

/**
 * The main site's pixel button: on hover the fill dissolves in, pixel by pixel, from the reading edge.
 * Here it works for links and for real <button>s (the form submit).
 */
function PixelButton(props: AsLink | AsButton) {
  const {
    children,
    className,
    contentClassName = 'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    textColor = '#fbf8f3',
    hoverTextColor = '#fbf8f3',
    pixelColor = '#0e0d0c',
    pixelSize = 6,
    speed = 0.4,
    disabled,
    ariaLabel,
  } = props
  const rootRef = useRef<HTMLElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [covered, setCovered] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!root || !canvas || !ctx) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let W = 0
    let H = 0
    let cols = 1
    let rows = 1
    let thresholds = new Float32Array(1)
    let progress = 0
    let target01 = 0
    let raf = 0
    let lastT = 0
    const perSec = 1 / Math.max(speed, 0.1)

    function rebuild() {
      cols = Math.max(1, Math.ceil(W / pixelSize))
      rows = Math.max(1, Math.ceil(H / pixelSize))
      thresholds = new Float32Array(cols * rows)
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x
          // Low thresholds on the right: the fill enters from the edge where Hebrew reading starts.
          thresholds[i] = ((1 - x / Math.max(cols - 1, 1)) * 0.65 + hash(i) * 0.35) * 0.92
        }
    }

    function draw(p: number) {
      ctx!.clearRect(0, 0, W, H)
      if (p <= 0) return
      ctx!.fillStyle = pixelColor
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const thr = thresholds[y * cols + x]
          if (p <= thr) continue
          ctx!.globalAlpha = p - thr < 0.12 ? 0.45 : 1
          ctx!.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
        }
      ctx!.globalAlpha = 1
    }

    function frame(now: number) {
      const dt = (now - lastT) / 1000
      lastT = now
      progress = target01 > progress ? Math.min(progress + dt * perSec, 1) : Math.max(progress - dt * perSec, 0)
      draw(progress)
      setCovered(progress > 0.6)
      raf = progress !== target01 ? requestAnimationFrame(frame) : 0
    }
    const kick = () => {
      if (raf) return
      lastT = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const resize = () => {
      W = root.offsetWidth
      H = root.offsetHeight
      if (!W || !H) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      rebuild()
      draw(progress)
    }
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      target01 = 1
      kick()
    }
    const onLeave = () => {
      target01 = 0
      kick()
    }
    root.addEventListener('pointerenter', onEnter)
    root.addEventListener('pointerleave', onLeave)
    const ro = new ResizeObserver(resize)
    ro.observe(root)
    resize()
    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      root.removeEventListener('pointerenter', onEnter)
      root.removeEventListener('pointerleave', onLeave)
    }
  }, [pixelColor, pixelSize, speed])

  const inner = (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{ inset: '-0.5px', width: 'calc(100% + 1px)', height: 'calc(100% + 1px)', borderRadius: 'inherit' }}
      />
      <span className={`relative z-10 ${contentClassName}`} style={{ color: covered ? hoverTextColor : textColor, transition: 'color .15s' }}>
        {children}
      </span>
    </>
  )

  const cls = `relative isolate cursor-pointer select-none overflow-hidden transition-[transform,opacity] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ''}`

  if (props.as === 'button') {
    return (
      <motion.button
        ref={(el) => {
          rootRef.current = el
        }}
        type={props.type ?? 'button'}
        onClick={props.onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cls}
      >
        {inner}
      </motion.button>
    )
  }
  return (
    <motion.a
      ref={(el) => {
        rootRef.current = el
      }}
      href={props.href}
      target={props.target}
      rel={props.rel}
      onClick={props.onClick}
      aria-label={ariaLabel}
      className={cls}
    >
      {inner}
    </motion.a>
  )
}

export default PixelButton
