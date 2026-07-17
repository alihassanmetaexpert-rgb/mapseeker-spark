import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { LeadoraLogo } from "@/components/LeadoraLogo";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Leadora — Discover Local Businesses Instantly" },
      { name: "description", content: "Research and discover local businesses from Google Maps in seconds. Names, phones, emails, websites — exported straight to Excel or Google Sheets." },
      { property: "og:title", content: "Leadora — Discover Local Businesses Instantly" },
      { property: "og:description", content: "Research and discover local businesses from Google Maps in one click." },
      { property: "og:url", content: "https://mapseeker-spark.lovable.app/" },
      { name: "twitter:title", content: "Leadora — Discover Local Businesses on Google Maps in Seconds" },
      { name: "twitter:description", content: "Research verified local business profiles on Google Maps in seconds. Export to Excel or Google Sheets instantly." },
    ],
    links: [
      { rel: "canonical", href: "https://mapseeker-spark.lovable.app/" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex h-full items-center">
            <LeadoraLogo className="h-8 w-auto" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#product" className="transition-colors hover:text-foreground">Product</a>
            <Link to="/pricing" className="transition-colors hover:text-foreground">Pricing</Link>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline">Sign in</Link>
            <Link to="/dashboard" preload="render">
              <Button variant="outline" className="border-border bg-transparent text-foreground hover:bg-secondary">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="product" className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
            <div>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[color:var(--amber)]/40 bg-[color:var(--amber)]/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-[color:var(--amber)]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--amber)] opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--amber)]" />
                </span>
                any business · any city · worldwide
              </div>
              <h1 className="font-display text-[42px] font-bold leading-[1.05] tracking-tight md:text-6xl">
                Turn Google Maps into your next{" "}
                <span className="text-[color:var(--amber)]">1,000 customers</span>.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Leadora scans Google Maps for verified local businesses — names, phones, emails, websites — and exports them to Google Sheets, ready for outreach.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link to="/dashboard" preload="render">
                  <Button size="lg" className="h-12 bg-[color:var(--amber)] px-6 text-base font-semibold text-[color:var(--amber-foreground)] hover:bg-[color:var(--amber)]/90">
                    Start finding leads <ArrowRight />
                  </Button>
                </Link>
                <a href="#how" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                  <Play className="h-3.5 w-3.5 fill-current" /> Watch 90s demo
                </a>
              </div>
            </div>

            {/* Signature visual — scan path + standalone stat */}
            <div className="relative">
              <ScanPath />
              <div className="mt-8 border-l-2 border-[color:var(--amber)] pl-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">leads found this week</div>
                <div className="mt-1 font-mono text-4xl font-semibold tabular-nums text-foreground">
                  27,000+
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof / stats */}
      <section className="border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <div className="font-mono text-[11px] uppercase tracking-widest text-[color:var(--amber)]">early traction</div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Built on real scans, not projections.
            </h2>
          </div>
          <div className="mt-14 grid grid-cols-1 divide-y divide-border border-y border-border md:grid-cols-4 md:divide-x md:divide-y-0">
            {[
              { stat: "96%", label: "email match rate on scans with contact finder enabled" },
              { stat: "worldwide", label: "coverage — any city, any business Google Maps indexes" },
              { stat: "10,000", label: "leads / month on the top plan" },
              { stat: "2", label: "organic signups to date · zero paid spend" },
            ].map((s) => (
              <div key={s.label} className="px-6 py-8 md:px-8">
                <div className="font-mono text-3xl font-semibold tabular-nums text-foreground md:text-4xl">
                  {s.stat}
                </div>
                <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--cyan)]" />
            Live in production: Google Maps scan backend, Google Sheets export, Supabase auth.
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="border-b border-border py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <div className="font-mono text-[11px] uppercase tracking-widest text-[color:var(--cyan)]">how it works</div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              From a search box to an outreach-ready sheet.
            </h2>
          </div>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {[
              { n: "01", t: "Define the scan", d: "Pick a business type and a city — anywhere Google Maps has coverage." },
              { n: "02", t: "Watch it run live", d: "Verified profiles stream in as they're matched. Emails resolve in the background." },
              { n: "03", t: "Push to Sheets", d: "One click to Google Sheets or .xlsx — cleaned, deduped, ready for outreach." },
            ].map((s) => (
              <div key={s.n}>
                <div className="font-mono text-xs text-[color:var(--amber)]">{s.n}</div>
                <h3 className="mt-3 font-display text-xl font-bold">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-14">
            <Link to="/dashboard" preload="render">
              <Button size="lg" className="h-12 bg-[color:var(--amber)] px-6 text-base font-semibold text-[color:var(--amber-foreground)] hover:bg-[color:var(--amber)]/90">
                Start your first scan <ArrowRight />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

/* Signature visual: thin cyan curved scan path with amber pin dots along it */
function ScanPath() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-card p-6">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" aria-hidden />
      <svg
        viewBox="0 0 360 270"
        className="relative h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 220 C 90 170, 140 240, 200 150 S 300 60, 340 40"
          stroke="#4DD0E1"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          fill="none"
          opacity="0.7"
        />
        {[
          { cx: 20, cy: 220, label: "agency scan" },
          { cx: 180, cy: 168, label: "email match" },
          { cx: 340, cy: 40, label: "export" },
        ].map((p) => (
          <g key={p.label}>
            <circle cx={p.cx} cy={p.cy} r="10" fill="#FF7A33" opacity="0.15" />
            <circle cx={p.cx} cy={p.cy} r="4.5" fill="#FF7A33" />
            <text
              x={p.cx + 10}
              y={p.cy + 4}
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="#8B93A7"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
