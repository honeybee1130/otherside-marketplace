'use client'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

function AnimatedNumber({ value, duration = 1000 }: { value: number, duration?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const initial = display
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      setDisplay(Math.floor(initial + (value - initial) * progress))
      if (progress < 1) requestAnimationFrame(tick)
    }
    tick()
  }, [value])
  return <span>{display}</span>
}

export default function StatsBar({ totalListings, totalCollections, totalSales }: {
  totalListings: number, totalCollections: number, totalSales: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-8 justify-center py-4 px-6 bg-surface rounded-xl border border-border mb-8"
    >
      <div className="text-center">
        <div className="text-2xl font-bold text-white"><AnimatedNumber value={totalListings} /></div>
        <div className="text-xs text-neutral-500 uppercase tracking-wider">Listings</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-white"><AnimatedNumber value={totalCollections} /></div>
        <div className="text-xs text-neutral-500 uppercase tracking-wider">Collections</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-white"><AnimatedNumber value={totalSales} /></div>
        <div className="text-xs text-neutral-500 uppercase tracking-wider">Sales</div>
      </div>
    </motion.div>
  )
}
