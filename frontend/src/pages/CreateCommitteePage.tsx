import { useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { TOAST_MESSAGES } from "../utils/toastMessages";

function validateCommitteeName(name: string) {
  if (!name.trim()) return "Committee name is required.";
  if (name.trim().length < 3) return "Use at least 3 characters.";
  return "";
}

function validateContributionAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return "Contribution amount must be greater than 0.";
  return "";
}

function validateCycleLength(cycleLength: number) {
  if (!Number.isInteger(cycleLength) || cycleLength < 2) return "Cycle length must be at least 2.";
  return "";
}

function validateStartDate(startDate: string) {
  if (!startDate) return "Start date is required.";
  return "";
}

export function CreateCommitteePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [contributionAmount, setContributionAmount] = useState(5000);
  const [cycleLength, setCycleLength] = useState(5);
  const [frequency, setFrequency] = useState<"WEEKLY" | "MONTHLY">("MONTHLY");
  const [payoutType, setPayoutType] = useState<"FIXED" | "RANDOM">("FIXED");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [touched, setTouched] = useState({
    name: false,
    contributionAmount: false,
    cycleLength: false,
    startDate: false
  });
  const [error, setError] = useState<string | null>(null);

  const nameError = validateCommitteeName(name);
  const amountError = validateContributionAmount(contributionAmount);
  const cycleError = validateCycleLength(cycleLength);
  const startDateError = validateStartDate(startDate);
  const isFormInvalid = Boolean(nameError || amountError || cycleError || startDateError || !user?.id);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setTouched({
      name: true,
      contributionAmount: true,
      cycleLength: true,
      startDate: true
    });
    if (!user?.id) {
      setError("Please sign in first.");
      return;
    }
    if (isFormInvalid) {
      return;
    }

    try {
      const response = await toast.promise(
        api.post("/committees", {
          adminId: user?.id,
          name,
          contributionAmount,
          cycleLength,
          frequency,
          payoutType,
          startDate: new Date(startDate).toISOString()
        }),
        TOAST_MESSAGES.committee.create
      );
      navigate(`/committees/${response.data.id}`);
    } catch {
      setError("Failed to create committee. Please check admin user ID.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="stack card">
      <h2>Create Committee</h2>
      <p className="muted">Admin: {user?.name}</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
        placeholder="Committee name"
        className={touched.name && nameError ? "input-error" : ""}
      />
      {touched.name && nameError ? <p className="field-error">{nameError}</p> : null}
      <input
        type="number"
        min={1}
        value={contributionAmount}
        onChange={(e) => setContributionAmount(Number(e.target.value))}
        onBlur={() => setTouched((prev) => ({ ...prev, contributionAmount: true }))}
        placeholder="Contribution amount"
        className={touched.contributionAmount && amountError ? "input-error" : ""}
      />
      {touched.contributionAmount && amountError ? <p className="field-error">{amountError}</p> : null}
      <input
        type="number"
        min={2}
        value={cycleLength}
        onChange={(e) => setCycleLength(Number(e.target.value))}
        onBlur={() => setTouched((prev) => ({ ...prev, cycleLength: true }))}
        placeholder="Cycle length"
        className={touched.cycleLength && cycleError ? "input-error" : ""}
      />
      {touched.cycleLength && cycleError ? <p className="field-error">{cycleError}</p> : null}
      <select value={frequency} onChange={(e) => setFrequency(e.target.value as "WEEKLY" | "MONTHLY")}>
        <option value="WEEKLY">Weekly</option>
        <option value="MONTHLY">Monthly</option>
      </select>
      <select value={payoutType} onChange={(e) => setPayoutType(e.target.value as "FIXED" | "RANDOM")}>
        <option value="FIXED">Fixed</option>
        <option value="RANDOM">Random</option>
      </select>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        onBlur={() => setTouched((prev) => ({ ...prev, startDate: true }))}
        className={touched.startDate && startDateError ? "input-error" : ""}
      />
      {touched.startDate && startDateError ? <p className="field-error">{startDateError}</p> : null}
      <button type="submit" disabled={isFormInvalid}>
        Create
      </button>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
