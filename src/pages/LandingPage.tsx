import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Camera,
  Map as MapIcon,
  ArrowRight,
  ScanSearch,
  MapPin,
  Users,
  ClipboardCheck,
  Wrench,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Activity,
  BarChart3,
  CheckCircle2,
  HandCoins,
  Radar,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SeverityBadge } from '@/components/ui/badges'
import { useAppStore } from '@/store/app'
import { CATEGORIES } from '@/lib/constants'

function HeroVisual() {
  const [confidence, setConfidence] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setConfidence((c) => {
        if (c >= 94) {
          clearInterval(t)
          return 94
        }
        return Math.min(94, c + 1)
      })
    }, 28)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      {/* Glow backdrop */}
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-brand-600/15 via-brand-400/5 to-transparent blur-2xl" aria-hidden />

      <div className="relative rounded-3xl border border-surface-200/70 bg-white p-3 shadow-lift dark:border-surface-700 dark:bg-surface-900">
        <div className="relative overflow-hidden rounded-2xl bg-surface-100 dark:bg-surface-800">
          <div className="flex aspect-[4/3] w-full items-center justify-center">
            <ScanSearch className="h-16 w-16 text-surface-300 dark:text-surface-600" />
          </div>
          {/* Bounding box */}
          <div className="pointer-events-none absolute left-[30%] top-[38%] h-[24%] w-[30%] rounded-lg border-2 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]">
            <span className="absolute -top-6 left-0 whitespace-nowrap rounded-md bg-emerald-400 px-2 py-0.5 text-[11px] font-bold text-emerald-950">
              Pothole {confidence}%
            </span>
          </div>
          {/* Scan line */}
          <div className="pointer-events-none absolute inset-x-0 h-10 animate-scan-line bg-gradient-to-b from-transparent via-brand-400/30 to-transparent" style={{ animation: 'scan-line 2.2s linear infinite' }} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-950/40 to-transparent" />
        </div>

        {/* Status footer */}
        <div className="flex items-center justify-between px-2 pb-1 pt-3">
          <div className="flex items-center gap-2 text-xs font-medium text-surface-500 dark:text-surface-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            AI verified · live
          </div>
          <SeverityBadge severity="high" />
        </div>
      </div>

      {/* Floating result chips */}
      <div className="absolute -left-3 -top-4 hidden rounded-2xl border border-surface-200/80 bg-white px-4 py-2.5 shadow-lift animate-float sm:block dark:border-surface-700 dark:bg-surface-800">
        <p className="text-xs text-surface-400">Priority Score</p>
        <p className="text-lg font-bold text-brand-600 dark:text-brand-400">91/100</p>
      </div>
      <div className="absolute -bottom-4 -right-2 hidden rounded-2xl border border-surface-200/80 bg-white px-4 py-2.5 shadow-lift animate-float sm:block dark:border-surface-700 dark:bg-surface-800">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-500" />
          <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">37 confirmed</p>
        </div>
      </div>
    </div>
  )
}

function StatBlock({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="text-center sm:text-left">
      <p className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl dark:text-white">{value}</p>
      <p className="mt-1 text-sm font-medium text-surface-600 dark:text-surface-300">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-surface-400">{sub}</p>}
    </div>
  )
}

export function LandingPage() {
  const analytics = useAppStore((s) => s.computeAnalytics())

  const impactStats = [
    { icon: BarChart3, value: `${analytics.total}`, label: 'Problems reported' },
    { icon: Users, value: `${analytics.totalConfirmations}`, label: 'Community confirmations' },
    { icon: CheckCircle2, value: `${analytics.resolutionRate}%`, label: 'Resolution rate' },
    { icon: TrendingDown, value: `${analytics.avgResolutionDays.toFixed(1)}d`, label: 'Avg. resolution time' },
  ]

  const howItWorks = [
    {
      icon: Camera,
      title: '1. Snap a photo',
      body: 'Capture the problem from your phone — a pothole, a broken light, a flooded street.',
    },
    {
      icon: Radar,
      title: '2. AI verifies it',
      body: 'Computer vision classifies the problem, estimates severity and size, and flags exact location.',
    },
    {
      icon: ClipboardCheck,
      title: '3. Community confirms',
      body: 'Neighbors confirm the issue, boosting its priority so it gets fixed faster.',
    },
    {
      icon: Wrench,
      title: '4. Crews get assigned',
      body: 'The right maintenance team receives a routed work order with full context and location.',
    },
  ]

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-40 left-1/2 h-[480px] w-[880px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:pt-24">
          <div>
            <Badge tone="brand" className="px-3 py-1">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered civic reporting
            </Badge>
            <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-surface-900 sm:text-5xl lg:text-6xl dark:text-white">
              See Problems. Report Smarter.{' '}
              <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 bg-clip-text text-transparent">
                Build Better Streets.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-surface-500 dark:text-surface-400">
              StreetVision AI turns a street photo into a verified infrastructure report — with AI
              detection, severity scoring, and community confirmation — so cities fix the right
              things, first.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/report">
                <Button size="lg" className="w-full sm:w-auto" leftIcon={<Camera className="h-5 w-5" />} rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Report a Problem
                </Button>
              </Link>
              <Link to="/map">
                <Button size="lg" variant="outline" className="w-full sm:w-auto" leftIcon={<MapIcon className="h-5 w-5" />}>
                  Explore Street Map
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-surface-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-green-500" /> No app install needed
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-brand-500" /> Precise GPS location
              </span>
            </div>
          </div>

          <HeroVisual />
        </div>

        {/* Stats strip */}
        <div className="relative border-y border-surface-200/70 bg-white/60 backdrop-blur dark:border-surface-800 dark:bg-surface-900/40">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
            {impactStats.map((s) => (
              <StatBlock key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <Badge tone="brand">How it works</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl dark:text-white">
            From photo to fix in minutes
          </h2>
          <p className="mt-3 text-lg text-surface-500 dark:text-surface-400">
            A reporting workflow designed for the street, not the office.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((step) => (
            <div
              key={step.title}
              className="group rounded-2xl border border-surface-200/70 bg-white p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift dark:border-surface-800 dark:bg-surface-900"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950/60 dark:text-brand-400 dark:group-hover:bg-brand-600 dark:group-hover:text-white">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-surface-900 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-surface-500 dark:text-surface-400">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ SUPPORTED PROBLEMS ============ */}
      <section id="problems" className="border-y border-surface-200/70 bg-surface-50/70 dark:border-surface-800 dark:bg-surface-900/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <Badge tone="brand">Detection coverage</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl dark:text-white">
              Problems we recognize
            </h2>
            <p className="mt-3 text-lg text-surface-500 dark:text-surface-400">
              Ten detection categories out of the box — and the model is built to grow with your city.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORIES.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-3 rounded-2xl border border-surface-200/70 bg-white p-5 shadow-soft transition-colors hover:border-brand-300 dark:border-surface-800 dark:bg-surface-900 dark:hover:border-brand-600"
              >
                <span className="text-3xl">{c.emoji}</span>
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-white">{c.label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-surface-400">{c.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COMMUNITY IMPACT ============ */}
      <section id="impact" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge tone="brand">Community impact</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl dark:text-white">
              Neighbors amplify every report
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-surface-500 dark:text-surface-400">
              One photo starts a report. Every confirmation raises its priority. Cities can finally
              see what residents see every day — ranked by severity, not by volume of phone calls.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: HandCoins, title: 'Priority that adapts', body: 'Confirmation count, severity and age feed a transparent 0–100 priority score.' },
                { icon: Activity, title: 'Live street intelligence', body: 'Heatmaps and analytics surface the most problematic areas in real time.' },
                { icon: ShieldCheck, title: 'Trustworthy by design', body: 'Every report is AI-verified and community-checked before it reaches a crew.' },
              ].map((f) => (
                <li key={f.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-surface-900 dark:text-white">{f.title}</h3>
                    <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Community impact card */}
          <div className="rounded-3xl border border-surface-200/70 bg-white p-6 shadow-soft dark:border-surface-800 dark:bg-surface-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-surface-900 dark:text-white">Downtown · last 7 days</p>
              <Badge tone="green">+{Math.max(3, analytics.weeklyTrend.reduce((a, b) => a + b.count, 0))} reports</Badge>
            </div>
            <div className="mt-6 flex h-36 items-end gap-2">
              {analytics.weeklyTrend.map((d) => (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition-all"
                    style={{ height: `${Math.max(12, d.count * 26)}px` }}
                  />
                  <span className="text-[10px] text-surface-400">{d.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface-50 p-4 dark:bg-surface-800/60">
                <p className="text-xs text-surface-400">Community confirmations</p>
                <p className="mt-1 text-xl font-bold text-surface-900 dark:text-white">{analytics.totalConfirmations}</p>
              </div>
              <div className="rounded-xl bg-surface-50 p-4 dark:bg-surface-800/60">
                <p className="text-xs text-surface-400">Resolved so far</p>
                <p className="mt-1 text-xl font-bold text-surface-900 dark:text-white">{analytics.resolvedCount}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ BEFORE / AFTER ============ */}
      <section className="border-y border-surface-200/70 bg-surface-50/70 dark:border-surface-800 dark:bg-surface-900/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="brand">Real results</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl dark:text-white">
              From reported to resolved
            </h2>
            <p className="mt-3 text-lg text-surface-500 dark:text-surface-400">
              Every report tracks a full status journey — and stays visible to the community until
              the fix is in.
            </p>
          </div>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 text-center">
            <p className="text-surface-500 dark:text-surface-400">
              Join your community and start reporting street problems in seconds.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/register">
                <Button size="lg" leftIcon={<UserPlus className="h-4 w-4" />}>Create an account</Button>
              </Link>
              <Link to="/community/reports">
                <Button variant="outline" size="lg" leftIcon={<MapIcon className="h-4 w-4" />}>Browse community reports</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-6 py-16 text-center shadow-lift sm:px-16">
          <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden>
            <ScanSearch className="absolute left-8 top-8 h-24 w-24 rotate-12" />
            <ScanSearch className="absolute bottom-8 right-8 h-24 w-24 -rotate-12" />
          </div>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Spot something broken? Report it in 60 seconds.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">
            Take a photo, let AI verify it, and help your city fix what matters most.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/report">
              <Button size="lg" variant="secondary" className="w-full bg-white text-brand-700 hover:bg-brand-50 sm:w-auto" leftIcon={<Camera className="h-5 w-5" />}>
                Report a Problem
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="w-full border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10 sm:w-auto">
                Create free account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
