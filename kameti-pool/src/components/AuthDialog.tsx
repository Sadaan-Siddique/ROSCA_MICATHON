import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ArrowRight, Phone, KeyRound, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { requestOtp, verifyOtp } from "@/lib/api";

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, "Phone must be at least 10 characters")
    .max(20, "Phone must be at most 20 characters"),
});

const verifySchema = z.object({
  phone: z.string().min(10).max(20),
  otp: z.string().length(4, "OTP must be exactly 4 digits"),
  name: z.string().trim().min(2, "Name min 2 chars").max(80, "Name max 80 chars"),
});

type Step = "phone" | "verify";

export function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { setUser } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("phone");
      setPhone("");
    }
  }, [open]);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const verifyForm = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
    defaultValues: { phone: "", otp: "", name: "" },
  });

  const handleRequestOtp = phoneForm.handleSubmit(async ({ phone }) => {
    setSubmitting(true);
    try {
      await requestOtp(phone);
      setPhone(phone);
      verifyForm.reset({ phone, otp: "", name: "" });
      setStep("verify");
      toast.success("OTP sent", { description: `Code dispatched to ${phone}` });
    } catch {
      // global toast handles it
    } finally {
      setSubmitting(false);
    }
  });

  const handleVerify = verifyForm.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const { data } = await verifyOtp(values.phone, values.otp, values.name);
      setUser(data);
      toast.success(`Welcome, ${data.name}`, { description: "You're securely logged in." });
      onOpenChange(false);
    } catch {
      // global toast handles it
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-emerald">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <DialogTitle>{step === "phone" ? "Sign in to Kameti" : "Verify your number"}</DialogTitle>
          </div>
          <DialogDescription>
            {step === "phone"
              ? "We'll text you a 4-digit code to confirm it's you."
              : `Enter your name and the 4-digit code we sent to ${phone}.`}
          </DialogDescription>
        </DialogHeader>

        {step === "phone" ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold">
                Phone number
              </Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="+92 300 1234567"
                  className="tabular h-11 pl-10"
                  {...phoneForm.register("phone")}
                />
              </div>
              {phoneForm.formState.errors.phone && (
                <p className="text-xs text-destructive">{phoneForm.formState.errors.phone.message}</p>
              )}
            </div>
            <Button type="submit" size="lg" disabled={submitting} className="h-12 w-full shadow-emerald font-semibold">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Send OTP
            </Button>
            <p className="text-center text-[10px] text-muted-foreground">
              By continuing you agree to Kameti's Terms & Privacy.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vphone" className="text-sm font-semibold">Phone</Label>
              <Input id="vphone" className="tabular h-11" {...verifyForm.register("phone")} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">
                Full name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="e.g. Sadaan Khan"
                  className="h-11 pl-10"
                  autoComplete="name"
                  {...verifyForm.register("name")}
                />
              </div>
              {verifyForm.formState.errors.name && (
                <p className="text-xs text-destructive">{verifyForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-semibold">
                4-digit OTP <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="otp"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  className="tabular h-11 pl-10 text-lg tracking-[0.5em]"
                  {...verifyForm.register("otp")}
                />
              </div>
              {verifyForm.formState.errors.otp && (
                <p className="text-xs text-destructive">{verifyForm.formState.errors.otp.message}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("phone")} disabled={submitting}>
                Back
              </Button>
              <Button type="submit" size="lg" disabled={submitting} className="h-12 flex-1 shadow-emerald font-semibold">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Verify & Continue
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
