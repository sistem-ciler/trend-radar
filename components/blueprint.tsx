'use client';

import { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  GitBranch, Eye, TrendingUp, Lock, ChevronDown, ChevronRight,
  Cpu, Database, Globe, Shield, Box, GitFork, Server, Network,
  HardDrive, Zap, X, ArrowDown,
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  role: string;
  icon: LucideIcon;
  accent: string;
  fork: string;
  purpose: string;
  stack: string[];
  ports: string;
  resources: string;
  auth: string;
  scaling: string;
  upstream: string[];
}

interface FaqItemData { q: string; a: string; }
interface FaqGroup { title: string; items: FaqItemData[]; }

const SERVICES: Service[] = [
  {
    id: 'autoagent',
    name: 'autoagent',
    role: 'AI Autopilot Agents',
    icon: GitBranch,
    accent: '#FACC15',
    fork: 'kevinrgu/autoagent',
    purpose: 'Orchestrates autonomous agent runs — autonomous harness engineering for AI autopilot tasks.',
    stack: ['Python 3.11', 'FastAPI', 'Celery', 'Redis broker', 'PostgreSQL'],
    ports: '8080 / internal',
    resources: '2 vCPU · 4 GiB',
    auth: 'Bearer token + HMAC-signed webhooks',
    scaling: 'Horizontal via Celery workers',
    upstream: ['anthropic api', 'openai api'],
  },
  {
    id: 'cua',
    name: 'cua',
    role: 'CCTV Operator-as-a-Service',
    icon: Eye,
    accent: '#67E8F9',
    fork: 'trycua/cua',
    purpose: 'Provisions sandboxed virtual desktops (macOS / Linux / Windows) for computer-use agents — surveillance & continuous-observation workloads.',
    stack: ['Python', 'FastAPI', 'KVM / QEMU', 'Playwright', 'ffmpeg'],
    ports: '8443 REST · 5900–5910 VNC',
    resources: '4 vCPU · 8 GiB · nested-virt',
    auth: 'OAuth2 + per-session tokens',
    scaling: 'Per-session sandbox isolation',
    upstream: ['object store (frames)'],
  },
  {
    id: 'trend-radar',
    name: 'trend-radar',
    role: 'Scraper + X-Studio',
    icon: TrendingUp,
    accent: '#C4B5FD',
    fork: 'Celina-create/trend-radar',
    purpose: 'Aggregates AI/Agent/OSS signals from 12 sources daily, de-dupes, ranks, generates ready-to-post content via X-Studio.',
    stack: ['Next.js 14', 'Vercel AI SDK', 'Drizzle ORM', 'PostgreSQL'],
    ports: '3000 / internal',
    resources: '1 vCPU · 2 GiB',
    auth: 'NextAuth + admin allowlist',
    scaling: 'Cron-driven, stateless',
    upstream: ['12 RSS / API sources', 'X (Twitter) API'],
  },
  {
    id: 'synapse',
    name: 'synapse',
    role: 'Secure Communication',
    icon: Lock,
    accent: '#86EFAC',
    fork: 'hexsecteam/PureOS-CPC',
    purpose: 'Matrix homeserver — E2EE federated chat hardened on PureOS base, minimal attack surface.',
    stack: ['Python (Twisted)', 'Rust (hot path)', 'PostgreSQL', 'PureOS base'],
    ports: '8008 client · 8448 federation',
    resources: '2 vCPU · 4 GiB · read-only rootfs',
    auth: 'Matrix native + SSO bridge',
    scaling: 'Federation-aware, single instance',
    upstream: ['matrix federation'],
  },
];

const FAQ_GROUPS: FaqGroup[] = [
  {
    title: 'Architecture',
    items: [
      { q: 'How are the services isolated?', a: 'Each service runs in its own rootless Docker container with a dedicated network namespace and per-service Postgres schema. cua additionally uses KVM nested-virt for per-session sandbox isolation.' },
      { q: 'What talks to what internally?', a: 'All four services share PostgreSQL 16 (schema-isolated) and Redis 7 (queue + cache). MinIO holds blob data: frame captures from cua, scraped artefacts from trend-radar.' },
      { q: 'How is traffic routed?', a: 'Cloudflare (DNS + WAF) → Caddy 2 (auto-TLS, HTTP/3) → upstream service. Synapse federation on :8448 bypasses Cloudflare for protocol compliance.' },
    ],
  },
  {
    title: 'Security',
    items: [
      { q: 'TLS posture?', a: 'TLS 1.3 only, HSTS preload, OCSP stapling. Caddy auto-renews via ACME. Synapse federation uses its own certificate pinning.' },
      { q: 'How is SSH secured?', a: 'Key-only on a non-default port. UFW restricts inbound to 22, 80, 443, 8448. fail2ban with aggressive jails on auth + http abuse patterns.' },
      { q: 'Where do secrets live?', a: 'systemd-creds for service-level, .env files mounted read-only into containers. No secrets in the GitHub repo — verified by gitleaks pre-commit hook.' },
      { q: 'How is data encrypted?', a: 'Disk: LUKS at the host level. In transit: TLS 1.3 everywhere. Synapse messages are E2EE end-to-end; even the operator cannot read them.' },
    ],
  },
  {
    title: 'Reliability & Ops',
    items: [
      { q: 'What is the backup strategy?', a: 'Nightly pg_dump per schema, encrypted with age, shipped via Borg to a Hetzner Storage Box. 90-day retention. Restore-from-backup is exercised monthly.' },
      { q: 'How is the system observed?', a: 'Prometheus scrapes every service on /metrics, Grafana dashboards, Loki for log aggregation. Alerts to a private Matrix room on this same Synapse.' },
      { q: 'How do you deploy?', a: 'GitHub Actions builds an OCI image per service, pushes to ghcr.io, then a webhook triggers docker compose pull && up -d on the host. Zero-downtime via Caddy upstream draining.' },
      { q: 'What is the failure mode?', a: 'Single-host today — acknowledged trade-off for a solo workshop. Postgres has WAL streaming to Storage Box; recovery objective is < 30 minutes from a fresh CX52.' },
    ],
  },
  {
    title: 'Scale & Cost',
    items: [
      { q: 'How does it scale?', a: 'Vertical first (Hetzner CCX line goes to 32 vCPU / 128 GiB). Horizontal path: extract Postgres + Redis to managed services, then containerise to a small Nomad cluster across two regions.' },
      { q: 'What does it cost to run?', a: 'Host ~€60/mo (CX52). Cloudflare free tier. Storage Box ~€4/mo. LLM API spend dominates and scales with workload — typically €200–800/mo depending on agent volume.' },
    ],
  },
];

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

const TitleBlock = () => (
  <div className="border border-cyan-500/30 bg-slate-950/40">
    <div className="grid grid-cols-2 md:grid-cols-4 text-[10px]" style={mono}>
      {([
        ['DRAWING', 'SRV-HTZNR-EU-SWS'],
        ['REV.', '03 · 2026-05-03'],
        ['SCALE', '1:1 LOGICAL'],
        ['SHEET', '01 OF 01'],
        ['DRAWN BY', 'hexsec'],
        ['STATUS', 'PRODUCTION'],
        ['CLASS', 'SOLO-OPS'],
        ['DC', 'FALKENSTEIN · EU'],
      ] as [string, string][]).map(([k, v], i) => (
        <div key={i} className="border-r border-b border-cyan-500/20 px-3 py-2 last:border-r-0">
          <div className="text-cyan-700 uppercase tracking-wider">{k}</div>
          <div className="text-cyan-200 mt-0.5">{v}</div>
        </div>
      ))}
    </div>
  </div>
);

const LayerLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-3">
    <span className="text-cyan-600 text-[11px]" style={mono}>┌──</span>
    <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-400" style={mono}>{children}</span>
    <span className="flex-1 h-px bg-cyan-500/20" />
  </div>
);

interface NodeProps {
  icon?: LucideIcon;
  title: string;
  sub?: string;
  accent?: string;
  tags?: string[];
  onClick?: () => void;
}

const Node = ({ icon: Icon, title, sub, accent = '#67E8F9', tags = [], onClick }: NodeProps) => (
  <button
    onClick={onClick}
    className={`group relative w-full text-left border bg-slate-950/60 px-4 py-3 transition-all ${
      onClick ? 'cursor-pointer hover:bg-slate-900/80' : 'cursor-default'
    }`}
    style={{ borderColor: `${accent}40` }}
  >
    <span className="absolute -top-px -left-px h-2 w-2 border-t border-l" style={{ borderColor: accent }} />
    <span className="absolute -top-px -right-px h-2 w-2 border-t border-r" style={{ borderColor: accent }} />
    <span className="absolute -bottom-px -left-px h-2 w-2 border-b border-l" style={{ borderColor: accent }} />
    <span className="absolute -bottom-px -right-px h-2 w-2 border-b border-r" style={{ borderColor: accent }} />
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center border"
             style={{ borderColor: `${accent}60`, backgroundColor: `${accent}15` }}>
          <Icon size={13} style={{ color: accent }} strokeWidth={1.75} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[13px] text-cyan-100" style={mono}>{title}</div>
          {onClick && <ChevronRight size={12} className="shrink-0 text-cyan-700 group-hover:text-cyan-400 transition-colors" />}
        </div>
        {sub && <div className="mt-0.5 text-[11px] text-cyan-600" style={mono}>{sub}</div>}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span key={t} className="text-[9px] px-1.5 py-px border"
                    style={{ ...mono, borderColor: `${accent}40`, color: accent }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  </button>
);

const Connector = ({ count = 4, label }: { count?: number; label?: string }) => (
  <div className="flex flex-col items-center my-1">
    {label && (
      <span className="text-[9px] text-cyan-700 mb-1 px-1.5 py-px border border-cyan-500/20 bg-slate-950" style={mono}>
        {label}
      </span>
    )}
    <div className="flex gap-12 md:gap-20">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="h-3 w-px bg-cyan-500/40" />
          <ArrowDown size={10} className="text-cyan-500/60 -mt-1" strokeWidth={1.5} />
        </div>
      ))}
    </div>
  </div>
);

const ServiceSpec = ({ service, onInspect }: { service: Service; onInspect: () => void }) => {
  const Icon = service.icon;
  return (
    <div className="border border-cyan-500/30 bg-slate-950/50 relative">
      <div className="border-b border-cyan-500/20 px-4 py-2.5 flex items-center justify-between"
           style={{ backgroundColor: `${service.accent}08` }}>
        <div className="flex items-center gap-2.5">
          <Icon size={14} style={{ color: service.accent }} strokeWidth={1.75} />
          <span className="text-sm text-cyan-50" style={mono}>{service.name}</span>
          <span className="text-[10px] text-cyan-700" style={mono}>// {service.role}</span>
        </div>
        <button onClick={onInspect}
                className="text-[10px] text-cyan-500 hover:text-cyan-300 transition-colors flex items-center gap-1"
                style={mono}>
          inspect <ChevronRight size={10} />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-[12px] text-cyan-300 leading-relaxed">{service.purpose}</p>
        <dl className="grid grid-cols-1 gap-2 pt-2 border-t border-cyan-500/10" style={mono}>
          {[
            ['stack', service.stack.join(' · ')],
            ['ports', service.ports],
            ['compute', service.resources],
            ['fork', service.fork],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2 text-[11px]">
              <dt className="text-cyan-700 w-16 shrink-0">{k}</dt>
              <dd className="text-cyan-200">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

const InspectDrawer = ({ service, onClose }: { service: Service | null; onClose: () => void }) => {
  if (!service) return null;
  const Icon = service.icon;
  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 border-l border-cyan-500/30 bg-slate-950 overflow-y-auto">
        <div className="sticky top-0 border-b border-cyan-500/20 bg-slate-950 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Icon size={14} style={{ color: service.accent }} strokeWidth={1.75} />
            <span className="text-sm text-cyan-50" style={mono}>{service.name}.spec</span>
          </div>
          <button onClick={onClose} className="text-cyan-600 hover:text-cyan-200"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-5" style={mono}>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-700 mb-2">role</div>
            <div className="text-sm text-cyan-100">{service.role}</div>
            <p className="mt-2 text-[12px] text-cyan-300 leading-relaxed">{service.purpose}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 pt-4 border-t border-cyan-500/10">
            {[
              ['fork', service.fork],
              ['stack', service.stack.join(', ')],
              ['ports', service.ports],
              ['compute', service.resources],
              ['auth', service.auth],
              ['scaling', service.scaling],
              ['upstream', service.upstream.join(', ')],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[5rem_1fr] gap-2 text-[11px]">
                <span className="text-cyan-700">{k}</span>
                <span className="text-cyan-200">{v}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-cyan-500/10">
            <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-700 mb-2">deploy</div>
            <pre className="text-[10px] text-cyan-300 bg-slate-900/60 border border-cyan-500/10 p-3 overflow-x-auto">
{`$ git pull origin main
$ docker compose build ${service.name}
$ docker compose up -d ${service.name}
✔ healthcheck /metrics OK`}
            </pre>
          </div>
        </div>
      </aside>
    </>
  );
};

const FaqItem = ({ q, a }: FaqItemData) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-cyan-500/20">
      <button onClick={() => setOpen(!open)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-900/40 transition-colors">
        <span className="text-[12.5px] text-cyan-100" style={mono}>
          <span className="text-cyan-600 mr-2">?</span>{q}
        </span>
        <ChevronDown size={14} className={`shrink-0 text-cyan-600 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-3 pt-0">
          <div className="border-l border-cyan-500/30 pl-3 text-[12px] text-cyan-300 leading-relaxed">{a}</div>
        </div>
      )}
    </div>
  );
};

export default function Blueprint() {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch { /* noop */ } };
  }, []);

  return (
    <div className="min-h-screen relative text-cyan-100"
         style={{
           backgroundColor: '#06121F',
           backgroundImage: 'linear-gradient(rgba(34,211,238,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,0.04) 1px,transparent 1px)',
           backgroundSize: '24px 24px',
           fontFamily: "'IBM Plex Sans', sans-serif",
         }}>
      <div className="pointer-events-none fixed inset-0"
           style={{ background: 'radial-gradient(ellipse at center,transparent 30%,rgba(6,18,31,0.8) 100%)' }} />

      <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">

        <header className="mb-10">
          <div className="flex items-baseline justify-between mb-4 flex-wrap gap-3">
            <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-500" style={mono}>◇ technical blueprint</div>
            <div className="text-[10px] text-cyan-700" style={mono}>for client technical review</div>
          </div>
          <h1 className="text-3xl md:text-5xl text-cyan-50 tracking-tight"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 }}>
            SRV-HTZNR-EU-SWS
          </h1>
          <p className="mt-2 text-sm text-cyan-400 max-w-2xl">
            Single-host, four-service production stack. Solo-operated. Hetzner Falkenstein.
            This blueprint answers the questions clients actually ask.
          </p>
          <div className="mt-6"><TitleBlock /></div>
        </header>

        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-[11px] uppercase tracking-[0.3em] text-cyan-400" style={mono}>§ 01 — system architecture</h2>
            <span className="text-[10px] text-cyan-700" style={mono}>5 layers / 14 components</span>
          </div>
          <LayerLabel>L1 · external</LayerLabel>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-2">
            <Node icon={Globe} title="clients" sub="web · mobile · api consumers" />
            <Node icon={Network} title="matrix federation" sub="external homeservers · :8448" />
            <Node icon={GitFork} title="github" sub="ci/cd source · webhook trigger" />
          </div>
          <Connector count={3} label="https / federation / webhook" />
          <LayerLabel>L2 · edge</LayerLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
            <Node icon={Shield} title="cloudflare" sub="dns · waf · ddos · http/3" tags={['proxied', 'rate-limit']} />
            <Node icon={Lock} title="caddy 2" sub="auto-tls · acme · :80 :443" tags={['tls 1.3', 'hsts']} />
            <Node icon={Shield} title="ufw + fail2ban" sub="22 · 80 · 443 · 8448" tags={['key-only ssh']} />
          </div>
          <Connector count={4} label="reverse proxy" />
          <LayerLabel>L3 · application services</LayerLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            {SERVICES.map((s) => (
              <Node key={s.id} icon={s.icon} title={s.name} sub={s.role} accent={s.accent}
                    tags={[s.stack[0]]} onClick={() => setSelected(s.id)} />
            ))}
          </div>
          <Connector count={4} label="tcp / unix sockets" />
          <LayerLabel>L4 · data plane</LayerLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            <Node icon={Database} title="postgres 16" sub="schema-isolated per service" tags={['wal stream', 'logical repl']} />
            <Node icon={Zap} title="redis 7" sub="queue + cache · aof" tags={['celery', 'sessions']} />
            <Node icon={HardDrive} title="minio" sub="object store · s3 api" tags={['frames', 'artefacts']} />
            <Node icon={Box} title="borg" sub="encrypted nightly backup" tags={['90d retention']} />
          </div>
          <Connector count={4} />
          <LayerLabel>L5 · host platform</LayerLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Node icon={Server} title="hetzner ccx52" sub="dedicated vcpu · falkenstein" tags={['eu', 'iso-27001']} />
            <Node icon={Cpu} title="debian 12" sub="minimal · luks · automatic-updates" />
            <Node icon={Box} title="docker rootless" sub="compose · per-service ns" />
            <Node icon={Eye} title="observability" sub="prometheus · grafana · loki" />
          </div>
        </section>

        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-[11px] uppercase tracking-[0.3em] text-cyan-400" style={mono}>§ 02 — service spec sheets</h2>
            <span className="text-[10px] text-cyan-700" style={mono}>tap any sheet to inspect</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SERVICES.map((s) => <ServiceSpec key={s.id} service={s} onInspect={() => setSelected(s.id)} />)}
          </div>
        </section>

        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-[11px] uppercase tracking-[0.3em] text-cyan-400" style={mono}>§ 03 — primary data flows</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'agent task', steps: ['client → caddy', 'caddy → autoagent /run', 'autoagent → redis (enqueue)', 'celery worker → llm api', 'worker → postgres (result)', 'autoagent → client (sse)'] },
              { title: 'cua sandbox session', steps: ['client → cua /session', 'cua → kvm (boot vm)', 'agent ↔ vm (vnc)', 'cua → minio (frames)', 'cua → postgres (audit)'] },
              { title: 'trend scrape', steps: ['cron → trend-radar', 'fetch 12 sources', 'dedupe + embed', 'postgres (signals)', 'x-studio → draft', 'admin review queue'] },
              { title: 'matrix message', steps: ['client → caddy :443', 'caddy → synapse :8008', 'synapse → postgres', 'synapse → federation :8448', 'remote homeserver'] },
            ].map((flow) => (
              <div key={flow.title} className="border border-cyan-500/20 bg-slate-950/40 p-4">
                <div className="text-[11px] text-cyan-400 mb-3" style={mono}>▸ {flow.title}</div>
                <ol className="space-y-1.5" style={mono}>
                  {flow.steps.map((step, i) => (
                    <li key={i} className="flex gap-2 text-[11px]">
                      <span className="text-cyan-700 w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-cyan-200">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-[11px] uppercase tracking-[0.3em] text-cyan-400" style={mono}>§ 04 — technical Q&amp;A reference</h2>
            <span className="text-[10px] text-cyan-700" style={mono}>expandable</span>
          </div>
          <div className="space-y-6">
            {FAQ_GROUPS.map((group, gi) => (
              <div key={group.title}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-cyan-500 text-[10px]" style={mono}>{String(gi + 1).padStart(2, '0')}</span>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-cyan-300" style={mono}>{group.title}</span>
                  <span className="flex-1 h-px bg-cyan-500/15" />
                  <span className="text-[10px] text-cyan-700" style={mono}>{group.items.length} {group.items.length === 1 ? 'item' : 'items'}</span>
                </div>
                <div className="space-y-1.5">
                  {group.items.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-16 pt-6 border-t border-cyan-500/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] text-cyan-600" style={mono}>
            <div><div className="text-cyan-400 mb-1.5">▸ legend</div><div>L# — architectural layer</div><div>§# — document section</div><div>◇ — drawing marker</div></div>
            <div><div className="text-cyan-400 mb-1.5">▸ conventions</div><div>tls everywhere</div><div>schema-per-service</div><div>rootless containers</div></div>
            <div><div className="text-cyan-400 mb-1.5">▸ contact</div><div>matrix: @ops:hexsec</div><div>github: hexsecteam</div><div>region: eu-central</div></div>
            <div><div className="text-cyan-400 mb-1.5">▸ classification</div><div>internal · client-shareable</div><div>rev. 03 · 2026-05-03</div><div>sheet 01 of 01</div></div>
          </div>
          <div className="mt-6 text-center text-[10px] text-cyan-800" style={mono}>— end of drawing —</div>
        </footer>
      </div>

      <InspectDrawer
        service={selected ? (SERVICES.find((s) => s.id === selected) ?? null) : null}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
