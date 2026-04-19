import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Wallet,
  Plus,
  KeyRound,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Users,
  TrendingUp,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { formatPKR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SafepayDrawer } from "@/components/SafepayDrawer";
import { Landing } from "@/components/Landing";
import { useAuth } from "@/lib/auth-context";
import {
  getDashboard,
  getPendingContributions,
  getCommitteeByInvite,
  getCommitteeMembers,
  getCurrentCycle,
  joinCommittee,
  parseDecimal,
} from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Kameti" },
      {
        name: "description",
        content:
          "Your Kameti dashboard: wallet balance, active committees, pending contributions, and next payout.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Landing />;
  return <DashboardPage />;
}

type PendingContribution = {
  id: string;
  committeeId: string;
  committeeName: string;
  amount: number;
  dueDate: string;
  cycleNumber: number;
};

type DashboardCommittee = {
  id: string;
  name: string;
  contributionAmount: number;
  cycleLength: number;
  currentCycle: number;
  totalMembers: number;
  frequency: "WEEKLY" | "MONTHLY";
  startDate: string;
};

type DashboardData = {
  walletBalance: number;
  committees: DashboardCommittee[];
  nextPayout?: {
    committeeId: string;
    committeeName: string;
    amount: number;
    expectedDate: string;
    cycleNumber: number;
    recipientId: string;
  } | null;
};

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [pending, setPending] = useState<PendingContribution[]>([]);
  const [activePay, setActivePay] = useState<PendingContribution | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [dashRes, pendRes] = await Promise.all([
        getDashboard(user.id),
        getPendingContributions(user.id),
      ]);
      const dash = dashRes.data;
      const pendingList: PendingContribution[] = pendRes.data.map((c) => ({
        id: c.id,
        committeeId: c.committeeId,
        committeeName: c.committee.name,
        amount: parseDecimal(c.committee.contributionAmount),
        dueDate: c.dueDate,
        cycleNumber: c.cycleNumber,
      }));

      const committeesEnriched: DashboardCommittee[] = await Promise.all(
        (dash.committees ?? []).map(async (m) => {
          const c = m.committee;
          const [cycleRes, membersRes] = await Promise.all([
            getCurrentCycle(c.id),
            getCommitteeMembers(c.id),
          ]);
          return {
            id: c.id,
            name: c.name,
            contributionAmount: parseDecimal(c.contributionAmount),
            cycleLength: c.cycleLength,
            currentCycle: cycleRes.data.currentCycle,
            totalMembers: membersRes.data.length,
            frequency: c.frequency,
            startDate: c.startDate,
          };
        }),
      );

      let nextPayout: DashboardData["nextPayout"] = null;
      const np = dash.nextPayout;
      if (np?.committee) {
        const c = np.committee;
        nextPayout = {
          committeeId: np.committeeId,
          committeeName: c.name,
          amount: parseDecimal(c.contributionAmount) * c.cycleLength,
          expectedDate: np.createdAt,
          cycleNumber: np.cycleNumber,
          recipientId: np.recipientId,
        };
      }

      setData({
        walletBalance: 0,
        committees: committeesEnriched,
        nextPayout,
      });
      setPending(pendingList);
    } catch {
      /* global toast */
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const walletBalance = data?.walletBalance ?? 0;
  const committees = data?.committees ?? [];
  const nextPayout = data?.nextPayout ?? null;
  const isOverdue = (dueDate: string) => new Date(dueDate).getTime() < Date.now();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Wallet Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card bg-grid-emerald p-6 sm:p-10">
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Secure Wallet · Protected by Kameti Vault
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Welcome back, <span className="font-semibold text-foreground">{user?.name}</span>
            </p>
            <div className="mt-2 flex items-center gap-3">
              <h1 className="tabular text-4xl font-bold tracking-tight sm:text-6xl">
                {showBalance ? formatPKR(walletBalance) : "PKR ••••••"}
              </h1>
              <button
                onClick={() => setShowBalance((v) => !v)}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Toggle balance visibility"
              >
                {showBalance ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </button>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="tabular">{committees.length}</span> active committees
            </div>
            <p className="mt-2 max-w-md text-[11px] text-muted-foreground">
              Vault balance will reflect settled funds when the wallet service is connected. Contribution amounts below
              are live from your committees.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto">
            <Button asChild size="lg" className="h-14 shadow-emerald font-semibold">
              <Link to="/create">
                <Plus className="h-5 w-5" />
                Create New Kameti
              </Link>
            </Button>
            <JoinDialog onJoined={() => void loadData()} />
          </div>
        </div>
      </section>

      {/* Pending Alerts */}
      {pending.length > 0 && (
        <section className="mt-6 rounded-2xl border border-warning/30 bg-warning/5 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/15 text-warning">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">
              Pending contributions ({pending.length})
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            {pending.map((p) => {
              const overdue = isOverdue(p.dueDate);
              return (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 rounded-xl border border-warning/20 bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{p.committeeName}</p>
                      {overdue && (
                        <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
                          Overdue
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Cycle #{p.cycleNumber} · Due{" "}
                      {new Date(p.dueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:gap-6">
                    <span className="tabular text-lg font-bold text-foreground">
                      {formatPKR(p.amount)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setActivePay(p)}
                      className="bg-warning text-warning-foreground hover:bg-warning/90"
                    >
                      Pay Now
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {activePay && (
        <SafepayDrawer
          open={!!activePay}
          onOpenChange={(o) => !o && setActivePay(null)}
          contributionId={activePay.id}
          amount={activePay.amount}
          committeeName={activePay.committeeName}
          cycleNumber={activePay.cycleNumber}
          onComplete={() => {
            setActivePay(null);
            void loadData();
          }}
        />
      )}

      {/* Next Payout */}
      {nextPayout && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Next Payout
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {user && nextPayout.recipientId === user.id ? (
                  <>
                    You are the designated recipient for{" "}
                    <span className="font-semibold text-foreground">{nextPayout.committeeName}</span>
                  </>
                ) : (
                  <>
                    Next scheduled payout in{" "}
                    <span className="font-semibold text-foreground">{nextPayout.committeeName}</span>
                  </>
                )}
              </p>
              <h3 className="tabular mt-1 text-3xl font-bold sm:text-4xl">
                {formatPKR(nextPayout.amount)}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Cycle #{nextPayout.cycleNumber} · Recorded{" "}
                {new Date(nextPayout.expectedDate).toLocaleDateString("en-PK", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <Button
              variant="outline"
              className="border-primary/40 bg-card/40"
              onClick={() =>
                navigate({
                  to: "/committees/$committeeId",
                  params: { committeeId: nextPayout.committeeId },
                })
              }
            >
              View Committee
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

      {/* Active Kametis */}
      <section className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Active Kametis</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {committees.length} committee{committees.length === 1 ? "" : "s"} in progress
            </p>
          </div>
        </div>

        {loadingData ? (
          <div className="mt-5 flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : committees.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {committees.map((c) => {
              const progress = (c.currentCycle / c.cycleLength) * 100;
              const totalPool = c.contributionAmount * c.cycleLength;
              return (
                <Link
                  key={c.id}
                  to="/committees/$committeeId"
                  params={{ committeeId: c.id }}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-emerald"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold leading-tight">{c.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Total pool ·{" "}
                        <span className="tabular font-semibold text-foreground">{formatPKR(totalPool)}</span>
                      </p>
                    </div>
                    <span className="rounded-full border border-border/60 bg-secondary/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {c.frequency === "WEEKLY" ? "Weekly" : "Monthly"}
                    </span>
                  </div>

                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="tabular text-2xl font-bold">{formatPKR(c.contributionAmount)}</span>
                    <span className="text-xs text-muted-foreground">/ member</span>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Cycle <span className="tabular font-semibold text-foreground">{c.currentCycle}</span> of{" "}
                        <span className="tabular font-semibold text-foreground">{c.cycleLength}</span>
                      </span>
                      <span className="tabular font-semibold text-primary">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="mt-2 h-1.5" />
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {c.totalMembers}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(c.startDate).toLocaleDateString("en-PK", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function JoinDialog({ onJoined }: { onJoined: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCode("");
      setPreview(null);
      setError(null);
    }
  }, [open]);

  const handleValidate = async () => {
    if (code.trim().length < 5) {
      setError("Code must be at least 5 characters");
      return;
    }
    setValidating(true);
    setError(null);
    try {
      const res = await getCommitteeByInvite(code.trim());
      const c = res.data;
      setPreview({ id: c.id, name: c.name });
      toast.success("Invite valid", { description: c.name });
    } catch {
      setError("Invalid or expired invite code");
    } finally {
      setValidating(false);
    }
  };

  const handleJoin = async () => {
    if (!preview || !user) return;
    setSubmitting(true);
    try {
      await joinCommittee(preview.id, { userId: user.id, inviteCode: code.trim() });
      toast.success("Joined Kameti", { description: `Welcome to ${preview.name}` });
      setOpen(false);
      onJoined();
    } catch {
      // global toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="h-14 border-border/80 bg-card/40 font-semibold backdrop-blur">
          <KeyRound className="h-5 w-5" />
          Join via Invite Code
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Kameti</DialogTitle>
          <DialogDescription>Enter the invite code shared by the committee admin.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="invite">Invite Code</Label>
            <div className="flex gap-2">
              <Input
                id="invite"
                placeholder="KMT-XXX-0000"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setPreview(null);
                  setError(null);
                }}
                className="tabular uppercase"
                maxLength={20}
              />
              <Button type="button" variant="outline" disabled={validating || !code} onClick={handleValidate}>
                {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          {preview && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Verified Invite</p>
              <p className="mt-1 text-sm font-bold">{preview.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                After joining you will see the full committee details and contribution amount.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={!preview || submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Join Kameti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState() {
  return (
    <Card className="mt-5 border-dashed bg-card/40">
      <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-full bg-primary/20 blur-2xl" />
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-glow text-primary-foreground shadow-emerald">
            <Wallet className="h-10 w-10" />
          </div>
        </div>
        <h3 className="mt-6 text-lg font-bold">Start your first Kameti</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Pool savings with people you trust. Set the amount, frequency and members — Kameti handles the
          rest with secure, transparent payouts.
        </p>
        <Button asChild size="lg" className="mt-6 shadow-emerald">
          <Link to="/create">
            <Plus className="h-5 w-5" />
            Create your first Kameti
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
