'use client'
import { motion } from 'framer-motion'
import { truncateAddress, timeAgo } from '@/lib/apechain'
import BuyButton from './BuyButton'

export default function ListingCard({ idx, tokenId, price, priceRaw, seller, expiration, collectionName, paymentMethod }: {
  idx: number, tokenId: string, price: string, priceRaw: string, seller: string, expiration: number, collectionName?: string, paymentMethod?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 6px 24px rgba(99,102,241,0.12)' }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-xl p-4 hover:border-accent/40 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-neutral-500 uppercase tracking-wider">#{tokenId}</span>
        <span className="text-xs text-neutral-500">{timeAgo(expiration)}</span>
      </div>
      {collectionName && <div className="text-xs text-neutral-400 mb-2 truncate">{collectionName}</div>}
      <div className="text-xl font-bold text-white mb-2">{parseFloat(price).toFixed(2)} <span className="text-sm text-accent">APE</span></div>
      <div className="text-xs text-neutral-500">Seller: {truncateAddress(seller)}</div>
      <BuyButton idx={idx} priceRaw={priceRaw} price={price} paymentMethod={paymentMethod} />
    </motion.div>
  )
}
