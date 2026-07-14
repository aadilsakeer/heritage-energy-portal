export const easeOut = [0.22, 1, 0.36, 1] as const

export const springSegment = {
  type: 'spring' as const,
  stiffness: 520,
  damping: 42,
  mass: 0.75,
}

export const fadeUp = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18, ease: easeOut },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.16, ease: easeOut },
}

export const cardEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: easeOut },
}

export const scaleTap = {
  whileTap: { scale: 0.98 },
}

export const pagePanel = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.16, ease: easeOut },
}
