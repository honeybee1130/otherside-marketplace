'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function CollectionCard({ address, name, listings, floor }: {
  address: string, name: string, listings: number, floor: string
}) {
  return (
    <Link href={`/collection/${address}`}>
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(99,102,241,0.15)' }}
        whileTap={{ scale: 0.98 }}
        className="bg-surface border border-border rounded-xl p-5 cursor-pointer transition-colors hover:border-accent/50"
      >
        <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-3 text-accent font-bold text-lg">
          {name.charAt(0)}
        </div>
        <h3 className="font-semibold text-white truncate">{name}</h3>
        <div className="flex justify-between mt-3 text-sm">
          <div>
            <span className="text-neutral-500">Floor</span>
            <div className="text-white font-medium">{parseFloat(floor).toFixed(2)} APE</div>
          </div>
          <div className="text-right">
            <span className="text-neutral-500">Listings</span>
            <div className="text-white font-medium">{listings}</div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
