'use client'
import { useEffect, useState } from 'react'

interface Sale {
  idx: number
  collection: string
  collectionName: string
  tokenId: string
  price: string
  seller: string
  buyer: string
  timestamp: number
  txHash: string
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'yesterday'
  return `${Math.floor(diff / 86400)}d ago`
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function SaleCard({ sale, index }: { sale: Sale; index: number }) {
  const [image, setImage] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/metadata?collection=${sale.collection}&tokenId=${sale.tokenId}`)
      .then(r => r.json())
      .then(d => { if (d.image) setImage(d.image) })
      .catch(() => {})
  }, [sale.collection, sale.tokenId])

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all duration-300"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg bg-white/[0.05] flex-shrink-0 overflow-hidden">
        {image ? (
          <img src={image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">NFT</div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-white text-sm font-medium truncate">{sale.collectionName}</span>
          <span className="text-neutral-500 text-xs flex-shrink-0">{timeAgo(sale.timestamp)}</span>
        </div>
        <div className="text-neutral-400 text-xs">#{sale.tokenId}</div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-accent text-sm font-semibold">{parseFloat(sale.price).toFixed(2)} APE</span>
          <span className="text-neutral-500 text-xs">→ {truncate(sale.buyer)}</span>
        </div>
      </div>
    </div>
  )
}

export default function RecentSales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sales')
      .then(r => r.json())
      .then(d => { setSales(d.sales || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="lg:sticky lg:top-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🔥</span>
          <h2 className="text-white font-semibold text-lg">Recently Sold</h2>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[72px] rounded-xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (sales.length === 0) return null

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block lg:sticky lg:top-8 self-start">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🔥</span>
          <h2 className="text-white font-semibold text-lg">Recently Sold</h2>
        </div>
        <div className="space-y-2">
          {sales.map((s, i) => (
            <SaleCard key={s.idx} sale={s} index={i} />
          ))}
        </div>
      </div>

      {/* Mobile horizontal scroll */}
      <div className="lg:hidden mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔥</span>
          <h2 className="text-white font-semibold text-lg">Recently Sold</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {sales.map((s, i) => (
            <div key={s.idx} className="flex-shrink-0 w-[260px]">
              <SaleCard sale={s} index={i} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
