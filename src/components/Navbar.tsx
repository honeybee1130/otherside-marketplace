'use client'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
      <Link href="/" className="text-white font-bold text-lg">Otherside Marketplace</Link>
      <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
    </nav>
  )
}
