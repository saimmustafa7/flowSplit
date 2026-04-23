import React from 'react'
import { motion } from 'framer-motion'
import { Card } from './Card'

export const Skeleton = ({ className = "" }: { className?: string }) => (
  <motion.div
    initial={{ opacity: 0.5 }}
    animate={{ opacity: 1 }}
    transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse' }}
    className={`bg-[var(--bg-elevated)] rounded-md ${className}`}
  />
)

export const SkeletonCard = () => (
  <Card className="flex flex-col gap-4">
    <Skeleton className="h-6 w-1/3" />
    <Skeleton className="h-10 w-2/3" />
    <div className="flex gap-2">
      <Skeleton className="h-5 w-1/4 rounded-full" />
      <Skeleton className="h-5 w-1/4 rounded-full" />
    </div>
  </Card>
)

export const SkeletonListItem = () => (
  <div className="flex items-center gap-4 py-3 border-b border-[var(--border)]">
    <Skeleton className="w-12 h-12 rounded-full" />
    <div className="flex-1 flex flex-col gap-2">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
    <Skeleton className="h-6 w-16" />
  </div>
)

export const SkeletonMemberCard = () => (
  <Card className="flex items-center gap-4 p-4 py-4">
    <Skeleton className="w-10 h-10 rounded-full" />
    <div className="flex-1 flex flex-col gap-2">
      <Skeleton className="h-5 w-1/2" />
    </div>
    <Skeleton className="h-6 w-20" />
  </Card>
)
