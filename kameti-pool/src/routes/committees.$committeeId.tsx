import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
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
  ChevronUp,
  ChevronDown,
  Loader2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatPKR } from "@/lib/format";
import { avatarColorFromId } from "@/lib/avatar-color";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  getCommittee as apiGetCommittee,
  getCurrentCycle,
  generateNextCycle,
  assignPayout,
  updatePayoutOrder,
  parseDecimal,
} from "@/lib/api";

export const Route = createFileRoute("/committees/$committeeId")({
  head: () => ({
    meta: [
      { title: "Committee — Kameti" },
      { name: "description", content: "Manage your Kameti committee." },
    ],
  }),
  component: CommitteeDetailsPage,
});

type Member = {
  id: string;
  user: { id: string; name: string; avatarColor?: string };
  payoutOrder: number;
  hasReceivedPayout: boolean;
  isOverdue?: boolean;
  paid?: boolean;
};

type Committee = {
  id: string;
  name: string;
  inviteCode: string;
  contributionAmount: number;
  cycleLength: number;
  totalMembers: number;
  currentCycle: number;
  frequency: "WEEKLY" | "MONTHLY";
  payoutType: "FIXED" | "RANDOM";
  startDate: string;
  adminId: string;
};

function CommitteeDetailsPage() {
  const { committeeId } = Route.useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [busyAction, setBusyAction] = useState<"generate" | "assign" | "order" | null>(null);
  const [orderEdit, setOrderEdit] = useState<Member[] | null>(null);
  const [missing, setMissing] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setMissing(false);
    try {
      const [detail, cycle] = await Promise.all([
        apiGetCommittee(committeeId),
        getCurrentCycle(committeeId),
      ]);
      const cData = detail.data;
      setCommittee({
        id: cData.id,
        name: cData.name,
        inviteCode: cData.inviteCode,
        contributionAmount: parseDecimal(cData.contributionAmount),
        cycleLength: cData.cycleLength,
        totalMembers: cData.members.length,
        currentCycle: cycle.data.currentCycle,
        frequency: cData.frequency,
        payoutType: cData.payoutType,
        startDate: cData.startDate,
        adminId: cData.adminId,
      });
      setMembers(
        [...cData.members]
          .sort((a, b) => (a.payoutOrder ?? 999) - (b.payoutOrder ?? 999))
          .map((m) => ({
            id: m.id,
            user: {
              id: m.user.id,
              name: m.user.name,
              avatarColor: avatarColorFromId(m.user.id),
            },
            payoutOrder: m.payoutOrder ?? 0,
            hasReceivedPayout: m.hasReceivedPayout,
          })),
      );
    } catch {
      setMissing(true);
    } finally {
      setLoading(false);
    }
  }, [committeeId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  if (!loading && missing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-semibold">Committee not found</p>
        <p className="mt-2 text-sm text-muted-foreground">It may have been removed or the link is invalid.</p>
        <Button asChild className="mt-6">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  if (loading || !committee) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalPool = committee.contributionAmount * committee.cycleLength;
  const platformFee = totalPool * 0.01;
  const netPayout = totalPool - platformFee;
  const progress = (committee.currentCycle / committee.cycleLength) * 100;
  const sortedMembers = [...members].sort((a, b) => a.payoutOrder - b.payoutOrder);
  const currentRecipient = sortedMembers.find((m) => m.payoutOrder === committee.currentCycle);
  const isAdmin = !!user && committee.adminId === user.id;

  const copyInvite = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(committee.inviteCode);
    }
    setCopied(true);
    toast.success("Invite Link Copied", {
      description: `${committee.inviteCode} ready to share`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateCycle = async () => {
    setBusyAction("generate");
    try {
      const nextCycle = committee.currentCycle + 1;
      await generateNextCycle(committee.id, nextCycle);
      toast.success(`Cycle ${nextCycle} generated`, {
        description: `${committee.totalMembers} contribution slots · ${formatPKR(committee.contributionAmount)} due per member`,
      });
      await fetchAll();
    } finally {
      setBusyAction(null);
    }
  };

  const handleAssignPayout = async () => {
    setBusyAction("assign");
    try {
      const res = await assignPayout(committee.id, committee.currentCycle);
      const recipient = members.find((m) => m.user.id === res.data.recipientId);
      toast.success(`Payout assigned for cycle ${committee.currentCycle}`, {
        description: recipient ? `${recipient.user.name} · pool ${formatPKR(netPayout)}` : undefined,
      });
      await fetchAll();
    } finally {
      setBusyAction(null);
    }
  };

  const startReorder = () => setOrderEdit(sortedMembers);
  const cancelReorder = () => setOrderEdit(null);
  const moveMember = (idx: number, dir: -1 | 1) => {
    if (!orderEdit) return;
    const next = [...orderEdit];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setOrderEdit(next);
  };

  const saveOrder = async () => {
    if (!orderEdit) return;
    setBusyAction("order");
    try {
      await updatePayoutOrder(
        committee.id,
        orderEdit.map((m, i) => ({ userId: m.user.id, payoutOrder: i + 1 })),
      );
      toast.success("Payout order updated", {
        description: `${orderEdit.length} positions reassigned`,
      });
      setOrderEdit(null);
      await fetchAll();
    } finally {
      setBusyAction(null);
    }
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
                copied
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary",
              )}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </div>
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Per member" value={formatPKR(committee.contributionAmount)} icon={<CircleDollarSign className="h-4 w-4" />} />
        <StatCard label="Members" value={String(committee.totalMembers ?? members.length)} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Frequency" value={committee.frequency === "WEEKLY" ? "Weekly" : "Monthly"} icon={<Repeat className="h-4 w-4" />} />
        <StatCard
          label="Started"
          value={new Date(committee.startDate).toLocaleDateString("en-PK", { month: "short", year: "numeric" })}
          icon={<Calendar className="h-4 w-4" />}
        />
      </section>

      {/* Current Cycle */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Current Cycle</p>
            <div className="tabular mt-1 flex items-baseline gap-2">
              <span className="text-5xl font-bold">{committee.currentCycle}</span>
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
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground tabular">
              {members.filter((m) => m.hasReceivedPayout).length} / {members.length} paid out
            </span>
            {isAdmin && !orderEdit && (
              <Button size="sm" variant="outline" onClick={startReorder}>
                Reorder payouts
              </Button>
            )}
            {orderEdit && (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={cancelReorder} disabled={busyAction === "order"}>
                  Cancel
                </Button>
                <Button size="sm" onClick={saveOrder} disabled={busyAction === "order"}>
                  {busyAction === "order" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Save order
                </Button>
              </div>
            )}
          </div>
        </div>
        <Card className="mt-4 border-border/60">
          <div className="divide-y divide-border/60">
            {(orderEdit ?? sortedMembers).map((m, idx) => {
              const isCurrent = !orderEdit && m.payoutOrder === committee.currentCycle;
              const order = orderEdit ? idx + 1 : m.payoutOrder;
              return (
                <div
                  key={m.id ?? m.user.id}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 transition-colors",
                    isCurrent && "bg-primary/5",
                  )}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground"
                    style={{ background: m.user.avatarColor ?? "oklch(0.74 0.17 158)" }}
                  >
                    {m.user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{m.user.name}</p>
                      {user && m.user.id === user.id && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          You
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Payout order · <span className="tabular font-semibold text-foreground">#{order}</span>
                    </p>
                  </div>
                  {orderEdit ? (
                    <div className="flex flex-col gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => moveMember(idx, -1)} disabled={idx === 0}>
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => moveMember(idx, 1)} disabled={idx === orderEdit.length - 1}>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {m.isOverdue && !m.paid && !m.hasReceivedPayout && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
                          Overdue
                        </span>
                      )}
                      {m.paid && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                          Paid
                        </span>
                      )}
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
                  )}
                </div>
              );
            })}
            {members.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">No members yet.</div>
            )}
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
              <h3 className="font-bold">Admin / Demo Actions</h3>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Trigger backend cycle + payout endpoints" : "Only the committee admin can run these"}
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
            disabled={!isAdmin || busyAction !== null}
            className="h-14 justify-start border-border/80 bg-card/60 text-left"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground">
              {busyAction === "generate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat className="h-4 w-4" />}
            </div>
            <div className="ml-1 flex flex-col items-start leading-tight">
              <span className="text-sm font-bold">Generate Next Cycle</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                POST /cycles/{committee.currentCycle + 1}/contributions/generate
              </span>
            </div>
          </Button>

          <Button
            size="lg"
            onClick={handleAssignPayout}
            disabled={!isAdmin || busyAction !== null}
            className="h-14 justify-start shadow-emerald"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/20">
              {busyAction === "assign" ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            </div>
            <div className="ml-1 flex flex-col items-start leading-tight">
              <span className="text-sm font-bold">Process Month / Assign Payout</span>
              <span className="text-[11px] font-normal text-primary-foreground/80">
                POST /cycles/{committee.currentCycle}/payouts/assign
              </span>
            </div>
          </Button>
        </div>
      </section>

      <div className="mt-10">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to all committees
        </Link>
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
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("tabular mt-0.5 text-sm font-bold", accent ? "text-primary" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}
