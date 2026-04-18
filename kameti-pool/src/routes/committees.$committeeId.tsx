import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Check,
  Users,
  Calendar,
  Repeat,
  Crown,
  CircleDollarSign,
  Zap,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatPKR } from "@/lib/mock-data";
import { useBackendUser } from "@/hooks/use-backend-user";
import { PayoutFlowDialog } from "@/components/PayoutFlowDialog";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { ApiCommitteeDetail, ApiDashboardResponse } from "@/lib/api-types";
import { parseMoney } from "@/lib/api-types";

export const Route = createFileRoute("/committees/$committeeId")({
  head: () => ({
    meta: [
      { title: "Committee — Kameti" },
      { name: "description", content: "Manage your committee on Kameti." },
    ],
  }),
  component: CommitteeDetailsPage,
});

function avatarFromName(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360} 60% 45%)`;
}

function CommitteeDetailsPage() {
  const { committeeId } = Route.useParams();
  const router = useRouter();
  const { backendUser, loading: userLoading } = useBackendUser();
  const [copied, setCopied] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutMember, setPayoutMember] = useState<string>("");
  const [committee, setCommittee] = useState<ApiCommitteeDetail | null>(null);
  const [siblingCommittees, setSiblingCommittees] = useState<Array<{ id: string; name: string }>>([]);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!committeeId || !backendUser?.id) return;
    setLoading(true);
    Promise.all([
      api.get<ApiCommitteeDetail>(`/committees/${committeeId}`),
      api.get<{ currentCycle: number }>(`/committees/${committeeId}/current-cycle`),
      api.get<ApiDashboardResponse>(`/dashboard/${backendUser.id}`)
    ])
      .then(([committeeResponse, cycleResponse, dashboardResponse]) => {
        setCommittee(committeeResponse.data);
        setCurrentCycle(cycleResponse.data.currentCycle);
        const siblings = dashboardResponse.data.committees
          .map((membership) => membership.committee)
          .filter((item) => item.id !== committeeId)
          .map((item) => ({ id: item.id, name: item.name }));
        setSiblingCommittees(siblings);
      })
      .finally(() => setLoading(false));
  }, [committeeId, backendUser?.id]);

  if (loading || userLoading) {
    return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 text-sm text-muted-foreground">Loading committee...</div>;
  }

  if (!committee || !backendUser) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Committee not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const contributionAmount = parseMoney(committee.contributionAmount);
  const totalMembers = committee.members.length;
  const totalPool = contributionAmount * committee.cycleLength;
  const platformFee = totalPool * 0.01;
  const netPayout = totalPool - platformFee;
  const progress = (currentCycle / committee.cycleLength) * 100;
  const currentRecipient = useMemo(() => {
    const byOrder = committee.members.find((member) => member.payoutOrder === currentCycle);
    if (byOrder) return byOrder;
    return committee.members.find((member) => member.userId === committee.payouts?.[0]?.recipientId);
  }, [committee.members, committee.payouts, currentCycle]);
  const isAdmin = committee.adminId === backendUser.id;

  const copyInvite = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(committee.inviteCode);
    }
    setCopied(true);
    toast.success("Invite code copied", {
      description: `${committee.inviteCode} ready to share`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateCycle = () => {
    const nextCycle = currentCycle + 1;
    api
      .post(`/committees/${committee.id}/cycles/${nextCycle}/contributions/generate`)
      .then(() => {
        toast.success(`Cycle ${nextCycle} generated`, {
          description: `${totalMembers} contribution requests sent · ${formatPKR(contributionAmount)} due per member`,
        });
      });
  };

  const handleAssignPayout = () => {
    api
      .post(`/committees/${committee.id}/cycles/${currentCycle}/payouts/assign`)
      .then(async () => {
        const [updatedCommittee, updatedCycle] = await Promise.all([
          api.get<ApiCommitteeDetail>(`/committees/${committee.id}`),
          api.get<{ currentCycle: number }>(`/committees/${committee.id}/current-cycle`)
        ]);
        setCommittee(updatedCommittee.data);
        setCurrentCycle(updatedCycle.data.currentCycle);
        const next = updatedCommittee.data.members.find((member) => !member.hasReceivedPayout);
        setPayoutMember(next?.user.name ?? "next member");
        setPayoutOpen(true);
        toast.success(`Payout verified for Cycle ${currentCycle}`, {
          description: `${formatPKR(netPayout)} routed to ${next?.user.name ?? "member"} · 1% fee deducted`,
        });
      });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <button
        onClick={() => router.history.back()}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <section className="mt-6 overflow-hidden rounded-3xl border border-border/60 bg-card bg-grid-emerald p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                {committee.frequency}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {committee.payoutType === "FIXED" ? "Fixed order" : "Random draw"}
              </span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">
                  <Crown className="h-3 w-3" /> Admin
                </span>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{committee.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Total pool · <span className="tabular font-bold text-foreground">{formatPKR(totalPool)}</span>
            </p>
          </div>

          <button
            onClick={copyInvite}
            className="group flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/60 px-4 py-3 backdrop-blur transition-colors hover:border-primary/40"
          >
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Invite Code
              </p>
              <p className="tabular text-base font-bold tracking-wider">{committee.inviteCode}</p>
            </div>
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                copied ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary",
              )}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </div>
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Per member" value={formatPKR(contributionAmount)} icon={<CircleDollarSign className="h-4 w-4" />} />
        <StatCard label="Members" value={String(totalMembers)} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Frequency" value={committee.frequency === "WEEKLY" ? "Weekly" : "Monthly"} icon={<Repeat className="h-4 w-4" />} />
        <StatCard label="Started" value={new Date(committee.startDate).toLocaleDateString("en-PK", { month: "short", year: "numeric" })} icon={<Calendar className="h-4 w-4" />} />
      </section>

      {/* Current Cycle */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Current Cycle</p>
            <div className="tabular mt-1 flex items-baseline gap-2">
              <span className="text-5xl font-bold">{currentCycle}</span>
              <span className="text-base text-muted-foreground">/ {committee.cycleLength}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Receiving this cycle:{" "}
              <span className="font-semibold text-foreground">
                {currentRecipient?.user.name ?? "Pending assignment"}
              </span>
            </p>
          </div>

          <div className="lg:w-1/2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Cycle progress</span>
              <span className="tabular font-bold text-primary">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="mt-2 h-2" />
            <div className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
              <MiniStat label="Total Pool" value={formatPKR(totalPool)} />
              <MiniStat label="Platform Fee" value={formatPKR(platformFee)} />
              <MiniStat label="Net Payout" value={formatPKR(netPayout)} accent />
            </div>
          </div>
        </div>
      </section>

      {/* Members */}
      <section className="mt-6">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold tracking-tight">Members</h2>
          <span className="text-xs text-muted-foreground tabular">
            {committee.members.filter((m) => m.hasReceivedPayout).length} / {committee.members.length} paid out
          </span>
        </div>
        <Card className="mt-4 border-border/60">
          <div className="divide-y divide-border/60">
            {committee.members
              .slice()
              .sort((a, b) => (a.payoutOrder ?? 999) - (b.payoutOrder ?? 999))
              .map((m) => {
                const safeOrder = m.payoutOrder ?? 0;
                const isCurrent = safeOrder === currentCycle;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex items-center gap-4 px-5 py-4 transition-colors",
                      isCurrent && "bg-primary/5",
                    )}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground"
                      style={{ background: avatarFromName(m.user.name) }}
                    >
                      {m.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold">{m.user.name}</p>
                        {m.user.id === backendUser.id && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            You
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Payout order · <span className="tabular font-semibold text-foreground">#{safeOrder}</span>
                      </p>
                    </div>
                    <div>
                      {m.hasReceivedPayout ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Paid out
                        </span>
                      ) : isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning">
                          <Sparkles className="h-3.5 w-3.5" />
                          Receiving
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          Waiting
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      </section>

      {/* Demo Actions */}
      <section className="mt-8 rounded-2xl border border-dashed border-warning/40 bg-warning/5 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/15 text-warning">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold">Hackathon Demo Actions</h3>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Admin-only debug controls for live demos" : "Switch to an admin user to enable these controls"}
              </p>
            </div>
          </div>
          {!isAdmin && (
            <span className="hidden rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:inline-flex">
              Locked
            </span>
          )}
        </div>
        <div className={cn("mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2", !isAdmin && "pointer-events-none opacity-50")}>
          <Button
            variant="outline"
            size="lg"
            onClick={handleGenerateCycle}
            disabled={!isAdmin}
            className="h-14 justify-start border-border/80 bg-card/60 text-left"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground">
              <Repeat className="h-4 w-4" />
            </div>
            <div className="ml-1 flex flex-col items-start leading-tight">
              <span className="text-sm font-bold">Generate Next Cycle</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                POST /cycles/{currentCycle + 1}/contributions/generate
              </span>
            </div>
          </Button>

          <Button
            size="lg"
            onClick={handleAssignPayout}
            disabled={!isAdmin}
            className="h-14 justify-start shadow-emerald"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/20">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="ml-1 flex flex-col items-start leading-tight">
              <span className="text-sm font-bold">Process Month / Assign Payout</span>
              <span className="text-[11px] font-normal text-primary-foreground/80">
                POST /cycles/{currentCycle}/payouts/assign
              </span>
            </div>
          </Button>
        </div>
      </section>

      {/* Multi-step Payout Visualization */}
      <PayoutFlowDialog
        open={payoutOpen}
        onOpenChange={setPayoutOpen}
        totalPool={totalPool}
        platformFee={platformFee}
        netPayout={netPayout}
        totalMembers={totalMembers}
        recipientName={payoutMember}
        cycleNumber={currentCycle}
        committeeName={committee.name}
      />

      {/* Sibling committees nav */}
      <div className="mt-10 flex flex-wrap gap-2">
        {siblingCommittees.map((c) => (
          <Link
            key={c.id}
            to="/committees/$committeeId"
            params={{ committeeId: c.id }}
            className="rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="tabular mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("tabular mt-0.5 text-sm font-bold", accent ? "text-primary" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}
