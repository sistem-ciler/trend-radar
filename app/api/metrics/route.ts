// Prometheus text exposition format — scraped by prometheus.yml at /api/metrics
export const dynamic = 'force-dynamic';

const START_MS = Date.now();

export async function GET() {
  const mem = process.memoryUsage();
  const uptimeSec = ((Date.now() - START_MS) / 1000).toFixed(2);

  const lines = [
    '# HELP nodejs_uptime_seconds Process uptime in seconds.',
    '# TYPE nodejs_uptime_seconds gauge',
    `nodejs_uptime_seconds ${uptimeSec}`,
    '',
    '# HELP nodejs_memory_rss_bytes Resident set size in bytes.',
    '# TYPE nodejs_memory_rss_bytes gauge',
    `nodejs_memory_rss_bytes ${mem.rss}`,
    '',
    '# HELP nodejs_memory_heap_used_bytes Heap used in bytes.',
    '# TYPE nodejs_memory_heap_used_bytes gauge',
    `nodejs_memory_heap_used_bytes ${mem.heapUsed}`,
    '',
    '# HELP nodejs_memory_heap_total_bytes Heap total in bytes.',
    '# TYPE nodejs_memory_heap_total_bytes gauge',
    `nodejs_memory_heap_total_bytes ${mem.heapTotal}`,
    '',
    '# HELP trend_radar_up Service health (1 = up).',
    '# TYPE trend_radar_up gauge',
    'trend_radar_up 1',
  ].join('\n');

  return new Response(lines, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' },
  });
}
