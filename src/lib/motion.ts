export const easeOut = [0.22, 1, 0.36, 1] as const

export const springSegment = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 34,
}

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: easeOut },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3, ease: easeOut },
}

export const cardEnter = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: easeOut },
}

export const scaleTap = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.985 },
}

export const pagePanel = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.28, ease: easeOut },
}
