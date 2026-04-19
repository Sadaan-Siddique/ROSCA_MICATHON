import { useState } from "react";
import {
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Lock,
  ArrowRight,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/AuthDialog";
import { formatPKR } from "@/lib/format";

const PUBLIC_POOLS = [
  { name: "Karachi Family Gold Pool", members: 12, contribution: 50000, frequency: "MONTHLY", filled: 10 },
  { name: "Lahore Tech Workers Saving", members: 8, contribution: 25000, frequency: "MONTHLY", filled: 6 },
  { name: "Islamabad Eid Fund", members: 10, contribution: 15000, frequency: "MONTHLY", filled: 9 },
  { name: "Office Weekly Pool", members: 6, contribution: 5000, frequency: "WEEKLY", filled: 4 },
  { name: "Wedding Joint Saving", members: 15, contribution: 30000, frequency: "MONTHLY", filled: 11 },
  { name: "Students Microsaving", members: 8, contribution: 2000, frequency: "WEEKLY", filled: 5 },
];

export function Landing() {
  const [authOpen, setAuthOpen] = useState(false);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card bg-grid-emerald p-8 sm:p-14">
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Pakistan's first vault-secured digital ROSCA
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
              Save together.{" "}
              <span className="bg-gradient-to-r from-primary to-emerald-glow bg-clip-text text-transparent">
                Trust the vault.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Run your <strong className="text-foreground">BC committee</strong> with bank-grade
              security, transparent payouts and a 10% Safepay advance held as collateral. No
              spreadsheets, no chase-ups, zero defaults.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" className="h-12 shadow-emerald font-semibold" onClick={() => setAuthOpen(true)}>
                <Zap className="h-5 w-5" />
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-border/80 bg-card/40 font-semibold"
                onClick={() => setAuthOpen(true)}
              >
                Login
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
              <Trust icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Vault Secured" />
              <Trust icon={<Lock className="h-3.5 w-3.5" />} label="PCI-DSS L1" />
              <Trust icon={<TrendingUp className="h-3.5 w-3.5" />} label="0% Defaults" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-primary/20 blur-3xl" />
            <div className="rounded-3xl border border-border/60 bg-card/80 p-6 backdrop-blur shadow-emerald">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Total locked in vault
                </span>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Live
                </span>
              </div>
              <p className="tabular mt-2 text-4xl font-bold sm:text-5xl">{formatPKR(48_200_000)}</p>
              <p className="mt-1 text-xs text-muted-foreground">across 124 active committees</p>

              <div className="mt-6 space-y-3">
                <Stat icon={<Users className="h-4 w-4" />} label="Members on Kameti" value="3,420+" />
                <Stat icon={<Wallet className="h-4 w-4" />} label="Avg. monthly payout" value={formatPKR(180_000)} />
                <Stat icon={<TrendingUp className="h-4 w-4" />} label="On-time settlements" value="99.7%" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Public Pools */}
      <section className="mt-14">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Social Proof</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Example committee structures
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Illustrative layouts only — sign in to create or join committees backed by your API.
            </p>
          </div>
          <Button variant="outline" onClick={() => setAuthOpen(true)} className="hidden sm:inline-flex">
            Join one <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PUBLIC_POOLS.map((p) => {
            const pct = Math.round((p.filled / p.members) * 100);
            return (
              <div
                key={p.name}
                className="group cursor-pointer rounded-2xl border border-border/60 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-emerald"
                onClick={() => setAuthOpen(true)}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold leading-tight">{p.name}</h3>
                  <span className="rounded-full border border-border/60 bg-secondary/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {p.frequency === "WEEKLY" ? "Weekly" : "Monthly"}
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="tabular text-2xl font-bold">{formatPKR(p.contribution)}</span>
                  <span className="text-xs text-muted-foreground">/ member</span>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground tabular">
                      {p.filled} / {p.members} joined
                    </span>
                    <span className="tabular font-semibold text-primary">{pct}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-glow" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                  <span className="text-muted-foreground tabular">
                    Pool · <span className="font-semibold text-foreground">{formatPKR(p.contribution * p.members)}</span>
                  </span>
                  <span className="text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Login to join →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-14 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-8 text-center sm:p-12">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ready to start your Kameti?</h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Sign up in 30 seconds with just your phone number.
        </p>
        <Button size="lg" className="mt-6 h-12 shadow-emerald font-semibold" onClick={() => setAuthOpen(true)}>
          <Zap className="h-5 w-5" /> Get Started Free
        </Button>
      </section>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}

function Trust({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/60 px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground">
      <span className="text-primary">{icon}</span>
      {label}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-3 py-2.5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <span className="tabular text-sm font-bold">{value}</span>
    </div>
  );
}
