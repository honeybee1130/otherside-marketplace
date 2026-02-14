'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { truncateAddress, timeAgo } from '@/lib/apechain'
import BuyButton from './BuyButton'

export default function ListingCard({ idx, tokenId, price, priceRaw, seller, expiration, collectionName, collection, paymentMethod }: {
  idx: number, tokenId: string, price: string, priceRaw: string, seller: string, expiration: number, collectionName?: string, collection?: string, paymentMethod?: string
}) {
  const [image, setImage] = useState<string | null>(null)
  const [nftName, setNftName] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    if (!collection) return
    fetch(`/api/metadata?collection=${collection}&tokenId=${tokenId}`)
      .then(r => r.json())
      .then(data => {
        if (data.image) setImage(data.image)
        if (data.name) setNftName(data.name)
      })
      .catch(() => {})
  }, [collection, tokenId])

  const initial = (collectionName || collection || '?')[0].toUpperCase()

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 6px 24px rgba(99,102,241,0.12)' }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-xl overflow-hidden hover:border-accent/40 transition-colors"
    >
      {/* Image */}
      <div className="aspect-square bg-neutral-800 relative overflow-hidden">
        {image && !errored ? (
          <img
            src={image}
            alt={nftName || `#${tokenId}`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : null}
        {(!image || errored || !loaded) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-neutral-600">{initial}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white truncate">{nftName || `#${tokenId}`}</span>
          <span className="text-xs text-neutral-500">{timeAgo(expiration)}</span>
        </div>
        {collectionName && <div className="text-xs text-neutral-400 mb-2 truncate">{collectionName}</div>}
        <div className="text-xl font-bold text-white mb-2">{parseFloat(price).toFixed(2)} <span className="text-sm text-accent">APE</span></div>
        <div className="text-xs text-neutral-500">Seller: {truncateAddress(seller)}</div>
        <BuyButton idx={idx} priceRaw={priceRaw} price={price} paymentMethod={paymentMethod} />
      </div>
    </motion.div>
  )
}
