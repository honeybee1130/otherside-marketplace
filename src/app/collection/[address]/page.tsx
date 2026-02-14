'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ListingCard from '@/components/ListingCard'
import Skeleton from '@/components/Skeleton'

interface Listing {
  idx: number
  collection: string
  collectionName: string
  tokenId: string
  price: string
  priceRaw: string
  seller: string
  expiration: number
}

export default function CollectionPage() {
  const params = useParams()
  const address = (params.address as string).toLowerCase()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')

  useEffect(() => {
    fetch('/api/listings')
      .then(r => r.json())
      .then(data => {
        const filtered = (data.listings || [])
          .filter((l: Listing) => l.collection === address)
          .sort((a: Listing, b: Listing) => parseFloat(a.price) - parseFloat(b.price))
        setListings(filtered)
        if (filtered.length > 0) setName(filtered[0].collectionName)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [address])

  return (
    <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <Link href="/" className="text-accent text-sm hover:underline mb-4 inline-block">← Back</Link>
      <h1 className="text-2xl font-bold text-white mb-1">{name || address}</h1>
      <p className="text-neutral-500 text-sm mb-6">{listings.length} listing{listings.length !== 1 ? 's' : ''}</p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center text-neutral-500 py-20">No active listings</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map(l => (
            <ListingCard key={l.idx} tokenId={l.tokenId} price={l.price} seller={l.seller} expiration={l.expiration} />
          ))}
        </div>
      )}
    </main>
  )
}
