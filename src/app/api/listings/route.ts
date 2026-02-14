export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { fetchAllListings } from '@/lib/apechain'

let cache: { data: any, ts: number } | null = null
const TTL = 5 * 60 * 1000 // 5 min

export async function GET() {
  const now = Date.now()
  if (cache && now - cache.ts < TTL) {
    return NextResponse.json(cache.data)
  }
  try {
    const { listings, collections, executed } = await fetchAllListings()
    const data = { listings, collections, totalExecuted: executed.length, fetchedAt: now }
    cache = { data, ts: now }
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
