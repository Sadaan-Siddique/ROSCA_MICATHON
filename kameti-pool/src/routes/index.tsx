import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import {
  formatPKR,
} from "@/lib/mock-data";
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
import { useBackendUser } from "@/hooks/use-backend-user";
import { api } from "@/lib/api";
import type { ApiContribution, ApiDashboardResponse, ApiPayout, UiCommitteeCard } from "@/lib/api-types";
import { parseMoney } from "@/lib/api-types";

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
  component: DashboardPage,
});

function DashboardPage() {
  const [showBalance, setShowBalance] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joinOpen, setJoinOpen] = useState(false);
  const [committees, setCommittees] = useState<UiCommitteeCard[]>([]);
  const [pendingContributions, setPendingContributions] = useState<ApiContribution[]>([]);
  const [nextPayout, setNextPayout] = useState<ApiPayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePay, setActivePay] = useState<ApiContribution | null>(null);
  const navigate = useNavigate();
  const { backendUser } = useBackendUser();

  useEffect(() => {
    if (!backendUser?.id) return;
    setLoading(true);

    Promise.all([
      api.get<ApiDashboardResponse>(`/dashboard/${backendUser.id}`),
      api.get<ApiContribution[]>(`/dashboard/${backendUser.id}/pending-contributions`)
    ])
      .then(async ([dashboardResponse, pendingResponse]) => {
        const baseCommittees = dashboardResponse.data.committees.map((membership) => ({
          id: membership.committee.id,
          name: membership.committee.name,
          contributionAmount: parseMoney(membership.committee.contributionAmount),
          cycleLength: membership.committee.cycleLength,
          currentCycle: 1,
          totalMembers: 0,
          frequency: membership.committee.frequency,
          payoutType: membership.committee.payoutType,
          startDate: membership.committee.startDate,
          inviteCode: membership.committee.inviteCode,
          adminId: membership.committee.adminId
        }));

        const committeeWithCycles = await Promise.all(
          baseCommittees.map(async (committee) => {
            const [cycleResponse, membersResponse] = await Promise.all([
              api.get<{ currentCycle: number }>(`/committees/${committee.id}/current-cycle`),
              api.get<Array<{ id: string }>>(`/committees/${committee.id}/members`)
            ]);
            return {
              ...committee,
              currentCycle: cycleResponse.data.currentCycle ?? 1,
              totalMembers: membersResponse.data.length
            };
          })
        );

        setCommittees(committeeWithCycles);
        setPendingContributions(pendingResponse.data);
        setNextPayout(dashboardResponse.data.nextPayout);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [backendUser?.id]);

  const walletBalance = useMemo(
    () =>
      pendingContributions.reduce((sum, contribution) => {
        const amount = parseMoney(contribution.committee.contributionAmount);
        return sum + amount;
      }, 0),
    [pendingContributions]
  );

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      toast.error("Please enter an invite code");
      return;
    }

    if (!backendUser?.id) {
      toast.error("User is not ready yet, please retry in a moment");
      return;
    }

    try {
      const committeeResponse = await api.get<{ id: string; inviteCode: string }>(
        `/committees/by-invite/${joinCode.toUpperCase()}`
      );
      await api.post(`/committees/${committeeResponse.data.id}/join`, {
        userId: backendUser.id,
        inviteCode: committeeResponse.data.inviteCode
      });
      toast.success("Joined committee successfully");
      setJoinCode("");
      setJoinOpen(false);
    } catch {
      // handled by interceptor
    }
  };

  const handlePaid = async (contributionId: string) => {
    try {
      await api.patch(`/contributions/${contributionId}/pay`);
      setPendingContributions((prev) => prev.filter((item) => item.id !== contributionId));
      setActivePay(null);
      toast.success("Payment marked successfully");
    } catch {
      // handled by interceptor
    }
  };

  const isOverdue = (dueDate: string) => new Date(dueDate).getTime() < Date.now();

  const pending = pendingContributions;
  const nextPayoutCommittee = committees.find((committee) => committee.id === nextPayout?.committeeId);
  const nextPayoutAmount = nextPayoutCommittee
    ? nextPayoutCommittee.contributionAmount * nextPayoutCommittee.cycleLength
    : 0;
  const nextPayoutDate = nextPayout?.createdAt ?? new Date().toISOString();

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
            <p className="mt-4 text-sm text-muted-foreground">Available balance</p>
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
              <span className="tabular">+12.4%</span> this cycle
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto">
            <Button asChild size="lg" className="h-14 shadow-emerald font-semibold">
              <Link to="/create">
                <Plus className="h-5 w-5" />
                Create New Kameti
              </Link>
            </Button>

            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 border-border/80 bg-card/40 font-semibold backdrop-blur"
                >
                  <KeyRound className="h-5 w-5" />
                  Join via Invite Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join a Kameti</DialogTitle>
                  <DialogDescription>
                    Enter the invite code shared by the committee admin.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="invite">Invite Code</Label>
                  <Input
                    id="invite"
                    placeholder="KMT-XXX-0000"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="tabular uppercase"
                  />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setJoinOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleJoin}>Join Kameti</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                      <p className="font-semibold text-foreground">{p.committee.name}</p>
                      {overdue && (
                        <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
                          Overdue
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Cycle #{p.cycleNumber} · Due {new Date(p.dueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:gap-6">
                    <span className="tabular text-lg font-bold text-foreground">
                      {formatPKR(parseMoney(p.committee.contributionAmount))}
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
          amount={parseMoney(activePay.committee.contributionAmount)}
          committeeName={activePay.committee.name}
          cycleNumber={activePay.cycleNumber}
          onComplete={() => handlePaid(activePay.id)}
        />
      )}

      {/* Next Payout Banner */}
      {nextPayout ? (
      <section className="mt-6 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Next Payout
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              You're receiving from <span className="font-semibold text-foreground">{nextPayoutCommittee?.name ?? "Your committee"}</span>
            </p>
            <h3 className="tabular mt-1 text-3xl font-bold sm:text-4xl">
              {formatPKR(nextPayoutAmount)}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Cycle #{nextPayout.cycleNumber} · Expected{" "}
              {new Date(nextPayoutDate).toLocaleDateString("en-PK", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <Button
            variant="outline"
            className="border-primary/40 bg-card/40"
            onClick={() => navigate({ to: "/committees/$committeeId", params: { committeeId: nextPayout.committeeId } })}
          >
            View Committee
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
      ) : null}

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

        {loading ? (
          <Card className="mt-5 border-dashed bg-card/40">
            <CardContent className="px-6 py-10 text-center text-sm text-muted-foreground">Loading committees...</CardContent>
          </Card>
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
                        Total pool · <span className="tabular font-semibold text-foreground">{formatPKR(totalPool)}</span>
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
          Pool savings with people you trust. Set the amount, frequency and members — Kameti
          handles the rest with secure, transparent payouts.
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
