import { useEffect, useState } from "react";
import {
  ArrowDown,
  CheckCircle2,
  Loader2,
  Users,
  Building2,
  Wallet,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  totalPool: number;
  platformFee: number;
  netPayout: number;
  totalMembers: number;
  recipientName: string;
  cycleNumber: number;
  committeeName: string;
}

const STEP_DURATION = 1100;

export function PayoutFlowDialog({
  open,
  onOpenChange,
  totalPool,
  platformFee,
  netPayout,
  totalMembers,
  recipientName,
  cycleNumber,
  committeeName,
}: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    const t1 = setTimeout(() => setStep(1), STEP_DURATION);
    const t2 = setTimeout(() => setStep(2), STEP_DURATION * 2);
    const t3 = setTimeout(() => setStep(3), STEP_DURATION * 3);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Processing Cycle #{cycleNumber}
          </DialogTitle>
          <DialogDescription>{committeeName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <FlowStep
            active={step >= 0}
            done={step >= 1}
            icon={<Users className="h-4 w-4" />}
            title={`Collecting from ${totalMembers} members`}
            value={`− ${formatPKR(totalPool)}`}
            tone="negative"
          />
          <Connector active={step >= 1} />
          <FlowStep
            active={step >= 1}
            done={step >= 2}
            icon={<Building2 className="h-4 w-4" />}
            title="Kameti platform fee (1%)"
            value={`− ${formatPKR(platformFee)}`}
            tone="muted"
          />
          <Connector active={step >= 2} />
          <FlowStep
            active={step >= 2}
            done={step >= 3}
            icon={<Wallet className="h-4 w-4" />}
            title={`Routed to ${recipientName}`}
            value={`+ ${formatPKR(netPayout)}`}
            tone="positive"
          />
        </div>

        {step >= 3 ? (
          <div className="mt-2 flex flex-col items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4 animate-fade-in">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-emerald">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold">Payout complete</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatPKR(netPayout)} delivered to {recipientName}'s wallet
              </p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="mt-1 w-full">
              Done
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/60 p-3 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            Settling on Kameti Vault…
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FlowStep({
  active,
  done,
  icon,
  title,
  value,
  tone,
}: {
  active: boolean;
  done: boolean;
  icon: React.ReactNode;
  title: string;
  value: string;
  tone: "negative" | "positive" | "muted";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all",
        active
          ? "border-primary/40 bg-card/80 opacity-100"
          : "border-border/40 bg-card/30 opacity-40",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
          done
            ? "bg-primary text-primary-foreground"
            : active
              ? "bg-primary/15 text-primary"
              : "bg-secondary text-muted-foreground",
        )}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : icon}
      </div>
      <span className="flex-1 text-sm">{title}</span>
      <span
        className={cn(
          "tabular text-sm font-bold",
          tone === "positive" && "text-primary",
          tone === "negative" && "text-destructive",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Connector({ active }: { active: boolean }) {
  return (
    <div className="flex justify-center">
      <ArrowDown
        className={cn(
          "h-4 w-4 transition-all",
          active ? "text-primary" : "text-muted-foreground/40",
        )}
      />
    </div>
  );
}
