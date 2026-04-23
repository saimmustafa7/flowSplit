export const spring = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 36,
  mass: 0.8
}

export const gentleSpring = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 28
}

export const easeOut = {
  type: 'tween' as const,
  ease: [0.16, 1, 0.3, 1],
  duration: 0.4
}

export const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { ...easeOut, duration: 0.35 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } }
}

export const listContainer = {
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
}

export const listItem = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0, transition: easeOut }
}

export const cardHover = {
  whileHover: { scale: 1.01, transition: spring },
  whileTap: { scale: 0.98, transition: spring }
}
