import { motion } from 'motion/react'
import { Fragment, type CSSProperties } from 'react'

interface AnimatedWordsProps {
  text: string
  isInView?: boolean
  duration?: number
  stagger?: number
  baseDelay?: number
  wordStyle?: CSSProperties
}

function AnimatedWords({
  text,
  isInView = true,
  duration = 0.5,
  stagger = 0.07,
  baseDelay = 0,
  wordStyle,
}: AnimatedWordsProps) {
  const words = text.split(' ')

  return (
    <>
      {words.map((word, i) => (
        <Fragment key={i}>
        {/* a real space between words, so screen readers and copy-paste keep them apart */}
        {i > 0 && ' '}
        <span
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            paddingBottom: '0.15em',
            marginBottom: '-0.15em',
          }}
        >
          <motion.span
            initial={{ y: '100%', opacity: 0 }}
            animate={isInView ? { y: '0%', opacity: 1 } : undefined}
            transition={{ duration, delay: baseDelay + i * stagger, ease: 'easeOut' }}
            style={{ display: 'inline-block', ...wordStyle }}
          >
            {word}
          </motion.span>
        </span>
        </Fragment>
      ))}
    </>
  )
}

export default AnimatedWords
