/**
 * Types aligned with backend Prisma models as returned by Express JSON.
 * Prisma `Decimal` serializes as string in JSON.
 */

export type Frequency = "WEEKLY" | "MONTHLY";
export type PayoutType = "FIXED" | "RANDOM";
export type PayoutStatus = "PENDING" | "PAID";

/** JSON-serialized Prisma.Decimal */
export type DecimalString = string;

export interface ApiUser {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export interface ApiCommittee {
  id: string;
  name: string;
  contributionAmount: DecimalString;
  cycleLength: number;
  frequency: Frequency;
  adminId: string;
  startDate: string;
  payoutType: PayoutType;
  inviteCode: string;
  createdAt: string;
}

export interface ApiCommitteeMember {
  id: string;
  userId: string;
  committeeId: string;
  payoutOrder: number | null;
  hasReceivedPayout: boolean;
  joinedAt: string;
  user: ApiUser;
}

export interface ApiContribution {
  id: string;
  userId: string;
  committeeId: string;
  cycleNumber: number;
  paid: boolean;
  paidAt: string | null;
  dueDate: string;
  isOverdue: boolean;
  committee: ApiCommittee;
}

export interface ApiPayout {
  id: string;
  committeeId: string;
  cycleNumber: number;
  recipientId: string;
  status: PayoutStatus;
  paidAt: string | null;
  createdAt: string;
  committee?: ApiCommittee;
}

/** `GET /committees/:id` — includes relations */
export interface ApiCommitteeDetail extends ApiCommittee {
  members: ApiCommitteeMember[];
  payouts: ApiPayout[];
}

/** Membership row with nested committee (dashboard list) */
export interface ApiDashboardMembership {
  id: string;
  userId: string;
  committeeId: string;
  payoutOrder: number | null;
  hasReceivedPayout: boolean;
  joinedAt: string;
  committee: ApiCommittee;
}

export interface ApiDashboardResponse {
  committees: ApiDashboardMembership[];
  pendingContributions: number;
  nextPayout: ApiPayout | null;
}

/** `GET /committees/by-invite/:inviteCode` — minimal payload */
export interface ApiCommitteeInvitePreview {
  id: string;
  name: string;
  inviteCode: string;
}

export function parseDecimal(value: DecimalString | number): number {
  if (typeof value === "number") return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
