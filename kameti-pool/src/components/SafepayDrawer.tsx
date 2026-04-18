import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/mock-data";

type Step = "select" | "processing" | "success";

interface Card {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  gradient: string;
}

const CARDS: Card[] = [
  {
    id: "v1",
    brand: "VISA",
    last4: "4242",
    expiry: "08/27",
    gradient: "linear-gradient(135deg, oklch(0.45 0.18 260), oklch(0.6 0.2 220))",
  },
  {
    id: "m1",
    brand: "Mastercard",
    last4: "8801",
    expiry: "11/26",
    gradient: "linear-gradient(135deg, oklch(0.35 0.05 280), oklch(0.5 0.15 320))",
  },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  amount: number;
  committeeName: string;
  cycleNumber: number;
  onComplete?: () => void;
}

export function SafepayDrawer({
  open,
  onOpenChange,
  amount,
  committeeName,
  cycleNumber,
  onComplete,
}: Props) {
  const [step, setStep] = useState<Step>("select");
  const [cardId, setCardId] = useState(CARDS[0].id);

  useEffect(() => {
    if (open) {
      setStep("select");
      setCardId(CARDS[0].id);
    }
  }, [open]);

  const card = CARDS.find((c) => c.id === cardId)!;
  const platformFee = Math.round(amount * 0.01);

  const handleConfirm = () => {
    setStep("processing");
    setTimeout(() => {
      setStep("success");
      toast.success(`Payment verified for Cycle ${cycleNumber}`, {
        description: `${formatPKR(amount)} secured via Safepay · ${card.brand} ••${card.last4}`,
      });
      onComplete?.();
    }, 1800);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg">
        <DrawerHeader className="text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-emerald">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <DrawerTitle className="text-base">Safepay Checkout</DrawerTitle>
              <DrawerDescription className="text-xs">
                Encrypted · PCI-DSS · 3D Secure
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-6">
          {/* Amount summary card */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Paying contribution
            </p>
            <p className="mt-1 text-sm font-medium">{committeeName}</p>
            <p className="text-xs text-muted-foreground">Cycle #{cycleNumber}</p>
            <p className="tabular mt-3 text-3xl font-bold">{formatPKR(amount)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Includes platform processing fee {formatPKR(platformFee)}
            </p>
          </div>

          {step === "select" && (
            <>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Select payment method
              </p>
              <div className="mt-2 space-y-2">
                {CARDS.map((c) => {
                  const active = c.id === cardId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCardId(c.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                        active
                          ? "border-primary/60 bg-primary/5 shadow-emerald"
                          : "border-border/60 bg-card/40 hover:border-border",
                      )}
                    >
                      <div
                        className="flex h-11 w-16 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
                        style={{ background: c.gradient }}
                      >
                        {c.brand}
                      </div>
                      <div className="flex-1">
                        <p className="tabular text-sm font-semibold">
                          •••• •••• •••• {c.last4}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Exp {c.expiry}</p>
                      </div>
                      <div
                        className={cn(
                          "h-4 w-4 rounded-full border-2",
                          active ? "border-primary bg-primary" : "border-border",
                        )}
                      />
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={handleConfirm}
                size="lg"
                className="mt-5 h-12 w-full shadow-emerald font-semibold"
              >
                <Lock className="h-4 w-4" />
                Confirm Payment · {formatPKR(amount)}
              </Button>
              <p className="mt-3 text-center text-[10px] text-muted-foreground">
                By confirming, you authorize Safepay to charge your card via Kameti Vault.
              </p>
            </>
          )}

          {step === "processing" && (
            <div className="mt-8 flex flex-col items-center justify-center py-10">
              <div className="relative">
                <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/30 blur-2xl" />
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <p className="mt-6 text-sm font-semibold">Processing securely…</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Authorising {card.brand} ••{card.last4} via Safepay
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-primary" />
                256-bit TLS encryption
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="mt-6 animate-fade-in">
              <div className="flex flex-col items-center py-6">
                <div className="relative">
                  <div className="absolute inset-0 -z-10 rounded-full bg-primary/30 blur-2xl" />
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-emerald">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                </div>
                <p className="mt-5 text-lg font-bold">Payment Successful</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your contribution is locked in the vault.
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-border/60 bg-card/60 p-4">
                <Row label="Amount" value={formatPKR(amount)} bold />
                <Row label="Method" value={`${card.brand} ••${card.last4}`} />
                <Row label="Committee" value={committeeName} />
                <Row label="Cycle" value={`#${cycleNumber}`} />
                <Row
                  label="Reference"
                  value={`SP-${Date.now().toString().slice(-8)}`}
                  mono
                />
                <div className="my-1 border-t border-dashed border-border/60" />
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                  <Sparkles className="h-3 w-3" />
                  10% Safepay Advance Secured
                </div>
              </div>

              <Button
                onClick={() => onOpenChange(false)}
                size="lg"
                className="mt-4 h-12 w-full"
              >
                Done
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 border-t border-border/60 bg-secondary/30 py-2.5 text-[10px] text-muted-foreground">
          <Lock className="h-3 w-3" />
          Secured by <span className="font-bold text-foreground">Safepay</span>
          <span className="mx-1">·</span>
          <CreditCard className="h-3 w-3" />
          PCI-DSS Level 1
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function Row({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(bold && "text-base font-bold", mono && "tabular", !bold && "font-semibold")}>
        {value}
      </span>
    </div>
  );
}
