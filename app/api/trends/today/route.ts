import { NextResponse } from 'next/server'
import { getCachedDigest } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function GET() {
  const digest = await getCachedDigest()

  if (!digest) {
    return NextResponse.json(
      {
        error: 'no digest yet — trigger GET /api/cron/batch to generate one',
        hint: 'pass x-cron-secret header or ?secret=... if CRON_SECRET is set',
      },
      { status: 404 }
    )
  }

  return NextResponse.json(digest)
}
