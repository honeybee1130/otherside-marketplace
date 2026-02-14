export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

export async function GET() {
  // Sales data would require event log parsing; return empty for now
  // Can be enhanced with getLogs for OrderExecuted events
  return NextResponse.json({ sales: [], note: 'Sales tracking coming soon' })
}
