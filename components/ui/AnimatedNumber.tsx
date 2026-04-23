"use client"
import React, { useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  format?: (val: number) => string
  className?: string
}

export function AnimatedNumber({ value, format = (v) => v.toString(), className = "" }: AnimatedNumberProps) {
  const springValue = useSpring(0, { stiffness: 200, damping: 30 })
  const formattedValue = useTransform(springValue, (latest) => format(latest))

  useEffect(() => {
    springValue.set(value)
  }, [value, springValue])

  return <motion.span className={className}>{formattedValue}</motion.span>
}
