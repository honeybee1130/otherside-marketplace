'use client'
import { useState } from 'react'
import { useAccount, useWriteContract, useSwitchChain } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { parseAbi } from 'viem'

const REGISTRY = '0x0E22dc442f31b423b4Ca2A563D33690d342d9196' as const
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const abi = parseAbi([
  'function fulfillListing(address buyer, uint256[] orderIds) payable',
])

export default function BuyButton({ idx, priceRaw, price, paymentMethod, onPurchased }: {
  idx: number
  priceRaw: string
  price: string
  paymentMethod?: string
  onPurchased?: () => void
}) {
  const { address, isConnected, chainId } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { switchChain } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const isNativePayment = !paymentMethod || paymentMethod === ZERO_ADDRESS

  const handleBuy = async () => {
    if (!isConnected) {
      openConnectModal?.()
      return
    }
    if (chainId !== 33139) {
      switchChain?.({ chainId: 33139 })
      return
    }
    setLoading(true)
    setStatus('idle')
    try {
      await writeContractAsync({
        address: REGISTRY,
        abi,
        functionName: 'fulfillListing',
        args: [address!, [BigInt(idx)]],
        value: isNativePayment ? BigInt(priceRaw) : BigInt(0),
      })
      setStatus('success')
      onPurchased?.()
      setTimeout(() => setStatus('idle'), 3000)
    } catch (e: any) {
      console.error('Buy failed:', e)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    } finally {
      setLoading(false)
    }
  }

  const wrongChain = isConnected && chainId !== 33139

  return (
    <div className="mt-3">
      <button
        onClick={handleBuy}
        disabled={loading}
        className="w-full py-2 px-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 hover:border-accent/40"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Processing...
          </span>
        ) : !isConnected ? (
          'Connect Wallet'
        ) : wrongChain ? (
          'Switch to ApeChain'
        ) : status === 'success' ? (
          '✓ Purchased!'
        ) : status === 'error' ? (
          '✕ Failed — Try Again'
        ) : (
          `Buy for ${parseFloat(price).toFixed(2)} APE`
        )}
      </button>
    </div>
  )
}
