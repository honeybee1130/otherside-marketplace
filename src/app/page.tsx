'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import StatsBar from '@/components/StatsBar'
import CollectionCard from '@/components/CollectionCard'
import Skeleton from '@/components/Skeleton'
import RecentSales from '@/components/RecentSales'

interface CollectionInfo {
  address: string
  name: string
  listings: number
  floor: string
}

export default function Home() {
  const [collections, setCollections] = useState<CollectionInfo[]>([])
  const [totalListings, setTotalListings] = useState(0)
  const [totalSales, setTotalSales] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/listings')
      .then(r => r.json())
      .then(data => {
        setCollections(data.collections || [])
        setTotalListings(data.listings?.length || 0)
        setTotalSales(data.totalExecuted || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = collections.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.address.includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="px-4 py-8 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Otherside Marketplace</h1>
        <p className="text-neutral-500 text-sm">NFT Listings on ApeChain</p>
      </div>

      <StatsBar totalListings={totalListings} totalCollections={collections.length} totalSales={totalSales} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <div>

      <input
        type="text"
        placeholder="Search collections..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-accent/50 mb-8 transition-colors"
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-neutral-500 py-20">No collections found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <CollectionCard key={c.address} {...c} />
          ))}
        </div>
      )}

      </div>

      {/* Sidebar: Recent Sales */}
      <RecentSales />
      </div>
      </div>
    </main>
  )
}
