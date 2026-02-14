export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, type Address } from 'viem'
import { apechain } from '@/lib/apechain'

const client = createPublicClient({ chain: apechain, transport: http('https://rpc.apechain.com') })

const ERC721_TOKEN_URI = [{ type: 'function', name: 'tokenURI', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'string' }], stateMutability: 'view' }] as const
const ERC1155_URI = [{ type: 'function', name: 'uri', inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ type: 'string' }], stateMutability: 'view' }] as const

const cache = new Map<string, { image: string | null; name: string | null; description: string | null }>()

function resolveUri(uri: string): string {
  if (uri.startsWith('ipfs://ipfs/')) return 'https://ipfs.io/ipfs/' + uri.slice(12)
  if (uri.startsWith('ipfs://')) return 'https://ipfs.io/ipfs/' + uri.slice(7)
  if (uri.startsWith('ar://')) return 'https://arweave.net/' + uri.slice(5)
  if (uri.startsWith('data:')) return uri
  return uri
}

export async function GET(req: NextRequest) {
  const collection = req.nextUrl.searchParams.get('collection')
  const tokenId = req.nextUrl.searchParams.get('tokenId')
  if (!collection || !tokenId) return NextResponse.json({ image: null, name: null, description: null })

  const key = `${collection.toLowerCase()}-${tokenId}`
  if (cache.has(key)) return NextResponse.json(cache.get(key), { headers: { 'Cache-Control': 'public, max-age=86400' } })

  try {
    let tokenUri: string | undefined
    try {
      tokenUri = await client.readContract({ address: collection as Address, abi: ERC721_TOKEN_URI, functionName: 'tokenURI', args: [BigInt(tokenId)] }) as string
    } catch {
      tokenUri = await client.readContract({ address: collection as Address, abi: ERC1155_URI, functionName: 'uri', args: [BigInt(tokenId)] }) as string
    }

    if (!tokenUri) throw new Error('No URI')

    // ERC1155 {id} substitution
    tokenUri = tokenUri.replace('{id}', BigInt(tokenId).toString(16).padStart(64, '0'))

    const resolved = resolveUri(tokenUri)
    let metadata: any

    if (resolved.startsWith('data:application/json')) {
      const b64 = resolved.split(',')[1]
      metadata = JSON.parse(Buffer.from(b64, 'base64').toString())
    } else {
      const res = await fetch(resolved, { signal: AbortSignal.timeout(10000) })
      metadata = await res.json()
    }

    const result = {
      image: metadata.image ? resolveUri(metadata.image) : null,
      name: metadata.name || null,
      description: metadata.description || null,
    }
    cache.set(key, result)
    return NextResponse.json(result, { headers: { 'Cache-Control': 'public, max-age=86400' } })
  } catch {
    const fallback = { image: null, name: null, description: null }
    cache.set(key, fallback)
    return NextResponse.json(fallback)
  }
}
