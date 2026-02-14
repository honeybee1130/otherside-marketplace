import { createPublicClient, http, formatEther, type Address } from 'viem'
import { defineChain } from 'viem'

export const apechain = defineChain({
  id: 33139,
  name: 'ApeChain',
  nativeCurrency: { name: 'APE', symbol: 'APE', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.apechain.com'] } },
})

export const REGISTRY = '0x0E22dc442f31b423b4Ca2A563D33690d342d9196' as Address

const saleDetailsComponents = [
  { name: 'protocol', type: 'uint256' },
  { name: 'maker', type: 'address' },
  { name: 'beneficiary', type: 'address' },
  { name: 'marketplace', type: 'address' },
  { name: 'fallbackRoyaltyRecipient', type: 'address' },
  { name: 'paymentMethod', type: 'address' },
  { name: 'tokenAddress', type: 'address' },
  { name: 'tokenId', type: 'uint256' },
  { name: 'amount', type: 'uint256' },
  { name: 'itemPrice', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'expiration', type: 'uint256' },
  { name: 'marketplaceFeeNumerator', type: 'uint256' },
  { name: 'maxRoyaltyFeeNumerator', type: 'uint256' },
  { name: 'requestedFillAmount', type: 'uint256' },
  { name: 'minimumFillAmount', type: 'uint256' },
  { name: 'protocolFeeVersion', type: 'uint256' },
] as const

export const RegistryABI = [
  {
    type: 'function', name: 'totalOrders', inputs: [],
    outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'getSignedOrder',
    inputs: [{ name: 'idx', type: 'uint256' }],
    outputs: [
      { name: 'signedOrder', type: 'tuple', components: [
        { name: 'saleDetails', type: 'tuple', components: saleDetailsComponents },
        { name: 'sellerSignature', type: 'tuple', components: [
          { name: 'v', type: 'uint256' }, { name: 'r', type: 'bytes32' }, { name: 's', type: 'bytes32' },
        ]},
        { name: 'cosignature', type: 'tuple', components: [
          { name: 'signer', type: 'address' }, { name: 'taker', type: 'address' },
          { name: 'expiration', type: 'uint256' }, { name: 'v', type: 'uint256' },
          { name: 'r', type: 'bytes32' }, { name: 's', type: 'bytes32' },
        ]},
        { name: 'feeOnTop', type: 'tuple', components: [
          { name: 'recipient', type: 'address' }, { name: 'amount', type: 'uint256' },
        ]},
      ]},
      { name: 'isExecuted', type: 'bool' },
    ],
    stateMutability: 'view',
  },
] as const

const ERC721NameABI = [
  { type: 'function', name: 'name', inputs: [], outputs: [{ name: '', type: 'string' }], stateMutability: 'view' },
] as const

export const client = createPublicClient({
  chain: apechain,
  transport: http('https://rpc.apechain.com'),
})

// Name cache
const nameCache = new Map<string, string>()

export async function getCollectionName(address: string): Promise<string> {
  const key = address.toLowerCase()
  if (nameCache.has(key)) return nameCache.get(key)!
  try {
    const name = await client.readContract({
      address: address as Address,
      abi: ERC721NameABI,
      functionName: 'name',
    })
    nameCache.set(key, name)
    return name
  } catch {
    const short = `${address.slice(0, 6)}...${address.slice(-4)}`
    nameCache.set(key, short)
    return short
  }
}

export interface Listing {
  idx: number
  collection: string
  collectionName: string
  tokenId: string
  price: string
  priceRaw: string
  seller: string
  expiration: number
}

export interface CollectionInfo {
  address: string
  name: string
  listings: number
  floor: string
  floorRaw: string
}

export async function fetchAllListings(): Promise<{ listings: Listing[], collections: CollectionInfo[], executed: number[] }> {
  const totalOrders = await client.readContract({
    address: REGISTRY,
    abi: RegistryABI,
    functionName: 'totalOrders',
  })

  const total = Number(totalOrders)
  const now = Math.floor(Date.now() / 1000)
  const listings: Listing[] = []
  const executed: number[] = []
  const BATCH = 50
  
  // Only scan last 800 orders — active listings are recent, no need to scan from 0
  const start = Math.max(0, total - 800)

  for (let i = start; i < total; i += BATCH) {
    const end = Math.min(i + BATCH, total)
    const promises = []
    for (let j = i; j < end; j++) {
      promises.push(
        client.readContract({
          address: REGISTRY,
          abi: RegistryABI,
          functionName: 'getSignedOrder',
          args: [BigInt(j)],
        }).then(result => ({ idx: j, data: result }))
          .catch(() => null)
      )
    }
    const results = await Promise.all(promises)
    const active = results.filter(r => {
      if (!r) return false
      const [signedOrder, isExecuted] = r.data as any
      if (isExecuted) { executed.push(r.idx); return false }
      const exp = Number(signedOrder.saleDetails.expiration)
      if (exp !== 0 && exp < now) return false
      return true
    })

    // Resolve names in parallel
    const namePromises = active.map(r => {
      const sd = (r!.data as any)[0].saleDetails
      return getCollectionName(sd.tokenAddress)
    })
    const names = await Promise.all(namePromises)

    active.forEach((r, i) => {
      const sd = (r!.data as any)[0].saleDetails
      listings.push({
        idx: r!.idx,
        collection: sd.tokenAddress.toLowerCase(),
        collectionName: names[i],
        tokenId: sd.tokenId.toString(),
        price: formatEther(sd.itemPrice),
        priceRaw: sd.itemPrice.toString(),
        seller: sd.maker,
        expiration: Number(sd.expiration),
      })
    })
  }

  // Build collection info
  const collMap = new Map<string, { address: string, name: string, count: number, floorWei: bigint }>()
  for (const l of listings) {
    const existing = collMap.get(l.collection)
    const wei = BigInt(l.priceRaw)
    if (!existing) {
      collMap.set(l.collection, { address: l.collection, name: l.collectionName, count: 1, floorWei: wei })
    } else {
      existing.count++
      if (wei < existing.floorWei) existing.floorWei = wei
    }
  }

  const collections: CollectionInfo[] = Array.from(collMap.values()).map(c => ({
    address: c.address,
    name: c.name,
    listings: c.count,
    floor: formatEther(c.floorWei),
    floorRaw: c.floorWei.toString(),
  })).sort((a, b) => b.listings - a.listings)

  return { listings, collections, executed }
}

export function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function timeAgo(timestamp: number): string {
  if (timestamp === 0) return 'No expiry'
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp
  if (diff < 0) {
    const abs = -diff
    if (abs < 3600) return `expires in ${Math.floor(abs / 60)}m`
    if (abs < 86400) return `expires in ${Math.floor(abs / 3600)}h`
    return `expires in ${Math.floor(abs / 86400)}d`
  }
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
