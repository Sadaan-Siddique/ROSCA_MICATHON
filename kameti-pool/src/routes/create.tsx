import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarIcon,
  Repeat,
  Shuffle,
  ListOrdered,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/mock-data";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create New Kameti — Kameti" },
      { name: "description", content: "Create a new digital committee with custom contribution, frequency and members." },
    ],
  }),
  component: CreatePage,
});

type Frequency = "WEEKLY" | "MONTHLY";
type PayoutType = "FIXED" | "RANDOM";

function CreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [members, setMembers] = useState<number | "">("");
  const [frequency, setFrequency] = useState<Frequency>("MONTHLY");
  const [payoutType, setPayoutType] = useState<PayoutType>("FIXED");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());

  const amt = typeof amount === "number" ? amount : 0;
  const mem = typeof members === "number" ? members : 0;
  const totalPool = amt * mem;
  const safepay = amt * 0.1;
  const platformFee = totalPool * 0.01;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amt || !mem || !startDate) {
      toast.error("Please complete all fields");
      return;
    }
    toast.success("Kameti created", {
      description: `${name} is live with ${mem} members.`,
    });
    setTimeout(() => navigate({ to: "/" }), 600);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mt-6 flex flex-col gap-2">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          New Committee
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Create New Kameti</h1>
        <p className="text-sm text-muted-foreground">
          Set up a secure rotating savings committee in under a minute.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="border-border/60">
          <CardContent className="space-y-7 p-6 sm:p-8">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">
                Committee Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Family Gold Pool"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-semibold">
                  Contribution per member
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    PKR
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="25,000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="tabular h-11 pl-14 text-base font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="members" className="text-sm font-semibold">
                  Total members / Cycle length
                </Label>
                <Input
                  id="members"
                  type="number"
                  inputMode="numeric"
                  min={2}
                  max={50}
                  placeholder="8"
                  value={members}
                  onChange={(e) => setMembers(e.target.value === "" ? "" : Number(e.target.value))}
                  className="tabular h-11 text-base font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Frequency</Label>
              <ToggleGroup
                value={frequency}
                onChange={(v) => setFrequency(v as Frequency)}
                options={[
                  { value: "WEEKLY", label: "Weekly", icon: <Repeat className="h-4 w-4" /> },
                  { value: "MONTHLY", label: "Monthly", icon: <CalendarIcon className="h-4 w-4" /> },
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-11 w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Payout Type</Label>
              <ToggleGroup
                value={payoutType}
                onChange={(v) => setPayoutType(v as PayoutType)}
                options={[
                  { value: "FIXED", label: "Fixed Order", icon: <ListOrdered className="h-4 w-4" /> },
                  { value: "RANDOM", label: "Random Draw", icon: <Shuffle className="h-4 w-4" /> },
                ]}
              />
              <p className="pt-1 text-xs text-muted-foreground">
                {payoutType === "FIXED"
                  ? "Members receive payouts in a predefined sequence."
                  : "A random member is selected at each cycle's payout."}
              </p>
            </div>

            <Button type="submit" size="lg" className="h-12 w-full shadow-emerald font-semibold">
              Launch Kameti
            </Button>
          </CardContent>
        </Card>

        {/* Live Financial Breakdown */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
            <CardContent className="p-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Financial Breakdown
              </div>

              <div className="mt-5 space-y-5">
                <BreakdownRow label="Total Pool" value={formatPKR(totalPool)} highlight />
                <BreakdownRow
                  label="Initial Safepay Advance"
                  sub="10% of contribution, held as collateral"
                  value={formatPKR(safepay)}
                />
                <BreakdownRow
                  label="Platform Fee"
                  sub="1% deducted on payout"
                  value={formatPKR(platformFee)}
                />
              </div>

              <div className="mt-6 rounded-xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Each member receives
                </p>
                <p className="tabular mt-1 text-2xl font-bold text-primary">
                  {formatPKR(totalPool - platformFee)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Net of 1% platform fee
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

function BreakdownRow({
  label,
  sub,
  value,
  highlight,
}: {
  label: string;
  sub?: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className={cn("text-sm font-medium", highlight ? "text-foreground" : "text-muted-foreground")}>
          {label}
        </p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      <p
        className={cn(
          "tabular text-right font-bold",
          highlight ? "text-2xl text-foreground" : "text-base text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-secondary/40 p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-emerald"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
