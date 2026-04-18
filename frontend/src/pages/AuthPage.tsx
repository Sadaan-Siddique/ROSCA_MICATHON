import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { TOAST_MESSAGES } from "../utils/toastMessages";

const PHONE_REGEX = /^03\d{9}$/;
const OTP_LENGTH = 4;

function validatePhone(phone: string) {
  if (!phone.trim()) return "Phone number is required.";
  if (!PHONE_REGEX.test(phone)) return "Use Pakistani format: 03XXXXXXXXX";
  return "";
}

function validateName(name: string) {
  if (!name.trim()) return "Full name is required.";
  if (name.trim().length < 2) return "Name must be at least 2 characters.";
  return "";
}

function validateOtp(otp: string) {
  if (!otp.trim()) return "OTP is required.";
  if (!/^\d+$/.test(otp)) return "OTP must be numeric.";
  if (otp.length !== OTP_LENGTH) return `OTP must be ${OTP_LENGTH} digits.`;
  return "";
}

export function AuthPage() {
  const { requestOtp, verifyOtp } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [touched, setTouched] = useState({
    phone: false,
    name: false,
    otp: false
  });
  const [step, setStep] = useState<"request" | "verify">("request");
  const [loading, setLoading] = useState(false);

  const phoneError = validatePhone(phone);
  const nameError = validateName(name);
  const otpError = validateOtp(otp);
  const canRequestOtp = !phoneError && !loading;
  const canVerify = !phoneError && !nameError && !otpError && !loading;

  async function handleRequestOtp() {
    setTouched((prev) => ({ ...prev, phone: true }));
    if (phoneError) return;

    try {
      setLoading(true);
      await toast.promise(requestOtp(phone), TOAST_MESSAGES.auth.requestOtp);
      toast("For MVP testing, use OTP: 1234", { icon: "ℹ️" });
      setStep("verify");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setTouched((prev) => ({ ...prev, phone: true, name: true, otp: true }));
    if (phoneError || nameError || otpError) return;

    try {
      setLoading(true);
      await toast.promise(verifyOtp({ phone, otp, name }), TOAST_MESSAGES.auth.verifyOtp);
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header-row">
          <h1>Committee Digital</h1>
          <button type="button" className="ghost-button compact-button" onClick={toggleTheme}>
            {resolvedTheme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
        <p className="muted">Manage ROSCA contributions, members, and payouts in one place.</p>
        <div className="stack">
          <label className="field-label">Phone Number</label>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value.replace(/\s/g, ""))}
            onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
            placeholder="03XXXXXXXXX"
            className={touched.phone && phoneError ? "input-error" : ""}
          />
          {touched.phone && phoneError ? <p className="field-error">{phoneError}</p> : null}

          <label className="field-label">Full Name</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            placeholder="Your name"
            className={touched.name && nameError ? "input-error" : ""}
          />
          {step === "verify" && touched.name && nameError ? <p className="field-error">{nameError}</p> : null}

          {step === "verify" ? (
            <>
              <label className="field-label">OTP</label>
              <input
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                onBlur={() => setTouched((prev) => ({ ...prev, otp: true }))}
                placeholder="1234"
                className={touched.otp && otpError ? "input-error" : ""}
              />
              {touched.otp && otpError ? <p className="field-error">{otpError}</p> : null}

              <button disabled={!canVerify} onClick={handleVerifyOtp}>
                {loading ? "Verifying..." : "Sign in / Sign up"}
              </button>
              <button className="ghost-button" onClick={() => setStep("request")} disabled={loading}>
                Back
              </button>
            </>
          ) : (
            <button disabled={!canRequestOtp} onClick={handleRequestOtp}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
