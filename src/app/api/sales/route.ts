export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { client, REGISTRY, RegistryABI, getCollectionName, truncateAddress } from '@/lib/apechain'
import { formatEther, type Address } from 'viem'

const OrderExecutedEvent = {
  type: 'event' as const,
  name: 'OrderExecuted' as const,
  inputs: [{ name: 'idx', type: 'uint256' as const, indexed: true }],
}

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

let cachedSales: Sale[] | null = null
let cacheTime = 0
const CACHE_TTL = 120_000 // 2 minutes

export async function GET() {
  const now = Date.now()
  if (cachedSales && now - cacheTime < CACHE_TTL) {
    return NextResponse.json({ sales: cachedSales }, {
      headers: { 'Cache-Control': 'public, max-age=120, s-maxage=120' },
    })
  }

  try {
    const blockNumber = await client.getBlockNumber()
    const fromBlock = blockNumber - BigInt(50000)

    const logs = await client.getLogs({
      address: REGISTRY,
      event: OrderExecutedEvent,
      fromBlock,
      toBlock: blockNumber,
    })

    // Take last 15 events, newest first
    const recentLogs = logs.slice(-15).reverse()

    const sales: Sale[] = []

    await Promise.all(
      recentLogs.map(async (log) => {
        try {
          const idx = Number((log.args as any).idx)
          const [orderData, receipt, block] = await Promise.all([
            client.readContract({
              address: REGISTRY,
              abi: RegistryABI,
              functionName: 'getSignedOrder',
              args: [BigInt(idx)],
            }),
            client.getTransactionReceipt({ hash: log.transactionHash }),
            client.getBlock({ blockNumber: log.blockNumber }),
          ])

          const signedOrder = (orderData as any)[0]
          const sd = signedOrder.saleDetails
          const collectionName = await getCollectionName(sd.tokenAddress)

          sales.push({
            idx,
            collection: sd.tokenAddress.toLowerCase(),
            collectionName,
            tokenId: sd.tokenId.toString(),
            price: formatEther(sd.itemPrice),
            seller: sd.maker,
            buyer: receipt.from,
            timestamp: Number(block.timestamp),
            txHash: log.transactionHash,
          })
        } catch {
          // skip failed entries
        }
      })
    )

    // Sort newest first
    sales.sort((a, b) => b.timestamp - a.timestamp)

    cachedSales = sales
    cacheTime = now

    return NextResponse.json({ sales }, {
      headers: { 'Cache-Control': 'public, max-age=120, s-maxage=120' },
    })
  } catch (err) {
    console.error('Sales API error:', err)
    return NextResponse.json({ sales: [], error: 'Failed to fetch sales' }, { status: 500 })
  }
}
