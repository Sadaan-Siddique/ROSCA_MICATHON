import axios from "axios";
import { toast } from "sonner";
import type {
  ApiCommittee,
  ApiCommitteeDetail,
  ApiCommitteeInvitePreview,
  ApiCommitteeMember,
  ApiContribution,
  ApiDashboardResponse,
  ApiPayout,
  ApiUser,
} from "@/lib/api-types";

export type {
  ApiCommittee,
  ApiCommitteeDetail,
  ApiCommitteeInvitePreview,
  ApiCommitteeMember,
  ApiContribution,
  ApiDashboardResponse,
  ApiPayout,
  ApiUser,
  DecimalString,
  Frequency,
  PayoutStatus,
  PayoutType,
} from "@/lib/api-types";
export { parseDecimal } from "@/lib/api-types";

/** When `VITE_API_URL` is unset, we use the backend origin only; `/api` is appended below to match `app.use("/api", router)`. */
const DEFAULT_DEV_API_ORIGIN = "http://localhost:4000";

const rawBase =
  typeof import.meta.env.VITE_API_URL === "string" && import.meta.env.VITE_API_URL.trim().length > 0
    ? import.meta.env.VITE_API_URL.trim()
    : DEFAULT_DEV_API_ORIGIN;

/** Backend mounts the router at `/api` (see `backend/src/app.ts`). Bare origins get `/api` appended. */
function normalizeApiBaseUrl(input: string): string {
  let s = input.trim().replace(/\/+$/, "");
  while (s.endsWith("/api/api")) s = s.slice(0, -4);
  try {
    const u = new URL(s);
    if (u.pathname === "" || u.pathname === "/") s = `${s}/api`;
  } catch {
    /* leave s as-is if not a valid URL */
  }
  return s.replace(/\/+$/, "");
}

const BASE_URL = normalizeApiBaseUrl(rawBase);

function safeClientMessage(status?: number): string {
  if (status === 400) return "Please check your input and try again.";
  if (status === 401) return "You need to sign in again.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "That resource was not found.";
  if (status === 409) return "That action conflicts with the current state.";
  if (status === 422) return "We could not process that request.";
  if (status && status >= 500) return "Something went wrong on our side. Please try again later.";
  return "Something went wrong. Please try again.";
}

function looksLikeSensitiveLeak(text: string): boolean {
  return /prisma|sql|stack|trace|constraint|internal server|ECONNREFUSED/i.test(text);
}

/** Prefer backend `message` or `error`, then first Zod issue (Express error handler uses `error` + `details`). */
function extractBackendErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;

  const pick = (v: unknown): string | null => {
    if (typeof v !== "string") return null;
    const t = v.trim();
    if (!t || t.length > 400) return null;
    if (looksLikeSensitiveLeak(t)) return null;
    return t;
  };

  const fromMessage = pick(o.message);
  if (fromMessage) return fromMessage;

  const fromError = pick(o.error);
  if (fromError) return fromError;

  const details = o.details;
  if (Array.isArray(details) && details[0] && typeof details[0] === "object") {
    const issue = details[0] as { message?: unknown; path?: unknown };
    const m = pick(issue.message);
    if (m) {
      const path = Array.isArray(issue.path) ? issue.path.join(".") : "";
      return path ? `${path}: ${m}` : m;
    }
  }

  return null;
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const cfg = error.config as { silent?: boolean } | undefined;
    if (!cfg?.silent) {
      const status = error.response?.status as number | undefined;
      const data = error.response?.data;
      const backendMsg = extractBackendErrorMessage(data);
      const networkHint =
        !error.response && typeof error.message === "string" && error.message === "Network Error"
          ? `Cannot reach the API at ${BASE_URL}. Is the backend running on port 4000? (Default base is ${DEFAULT_DEV_API_ORIGIN} + /api; override with VITE_API_URL.)`
          : null;
      const description = backendMsg ?? networkHint ?? safeClientMessage(status);
      toast.error("Request failed", { description });
    }
    return Promise.reject(error);
  },
);

export const API_BASE_URL = BASE_URL;

export const requestOtp = (phone: string) => api.post("/auth/request-otp", { phone });

/** Backend returns the user object directly (not wrapped). */
export const verifyOtp = (phone: string, otp: string, name: string) =>
  api.post<ApiUser>("/auth/verify-otp", { phone, otp, name });

export const getDashboard = (userId: string) => api.get<ApiDashboardResponse>(`/dashboard/${userId}`);

export const getPendingContributions = (userId: string) =>
  api.get<ApiContribution[]>(`/dashboard/${userId}/pending-contributions`);

export const getCurrentCycle = (committeeId: string) =>
  api.get<{ currentCycle: number; payout: ApiPayout | null }>(`/committees/${committeeId}/current-cycle`);

export const getCommittee = (committeeId: string) => api.get<ApiCommitteeDetail>(`/committees/${committeeId}`);

export const getCommitteeMembers = (committeeId: string) =>
  api.get<ApiCommitteeMember[]>(`/committees/${committeeId}/members`);

export const getCommitteeByInvite = (inviteCode: string) =>
  api.get<ApiCommitteeInvitePreview>(`/committees/by-invite/${encodeURIComponent(inviteCode)}`);

export const createCommittee = (payload: {
  name: string;
  contributionAmount: number;
  cycleLength: number;
  frequency: "WEEKLY" | "MONTHLY";
  adminId: string;
  startDate: string;
  payoutType: "FIXED" | "RANDOM";
}) => api.post("/committees", payload);

export const joinCommittee = (committeeId: string, body: { userId: string; inviteCode: string }) =>
  api.post(`/committees/${committeeId}/join`, body);

export const payContribution = (contributionId: string) =>
  api.patch<ApiContribution>(`/contributions/${contributionId}/pay`, {}, { silent: true });

export const generateNextCycle = (committeeId: string, cycleNumber: number) =>
  api.post(`/committees/${committeeId}/cycles/${cycleNumber}/contributions/generate`);

export const assignPayout = (committeeId: string, cycleNumber: number) =>
  api.post<ApiPayout>(`/committees/${committeeId}/cycles/${cycleNumber}/payouts/assign`);

export const updatePayoutOrder = (
  committeeId: string,
  members: { userId: string; payoutOrder: number }[],
) => api.patch(`/committees/${committeeId}/payout-order`, { members });
