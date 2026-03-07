'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type AnimatedPlaceholderProps = {
  texts: string[]
  interval?: number
}

export function AnimatedPlaceholder({ texts, interval = 3000 }: AnimatedPlaceholderProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (texts.length <= 1) return

    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length)
    }, interval)

    return () => clearInterval(id)
  }, [texts.length, interval])

  return (
    <div
      className="text-muted-foreground pointer-events-none absolute top-0 left-0 overflow-hidden text-sm leading-relaxed select-none"
      aria-hidden="true">
      <AnimatePresence mode="wait">
        <motion.div
          key={texts[index]}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}>
          {texts[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
