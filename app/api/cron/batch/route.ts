import { type NextRequest, NextResponse } from 'next/server'
import { runPipeline } from '@/lib/agent/pipeline'
import { setCachedDigest } from '@/lib/cache'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const secret =
    req.headers.get('x-cron-secret') ??
    req.nextUrl.searchParams.get('secret')

  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const t0 = Date.now()
  try {
    const digest = await runPipeline()
    await setCachedDigest(digest)

    return NextResponse.json({
      ok: true,
      date: digest.date,
      trends: digest.trends.length,
      totalPosts: digest.totalPosts,
      sources: digest.sourceHealth.map((s) => ({
        source: s.source,
        ok: s.ok,
        posts: s.postCount,
        error: s.error,
      })),
      durationMs: Date.now() - t0,
    })
  } catch (err) {
    console.error('[cron/batch] pipeline failed', err)
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - t0,
      },
      { status: 500 }
    )
  }
}
