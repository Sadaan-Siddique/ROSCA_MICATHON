export type Frequency = "WEEKLY" | "MONTHLY";
export type PayoutType = "FIXED" | "RANDOM";
export type PayoutStatus = "PENDING" | "PAID";

export interface ApiUser {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export interface ApiCommittee {
  id: string;
  name: string;
  contributionAmount: string;
  cycleLength: number;
  frequency: Frequency;
  adminId: string;
  startDate: string;
  payoutType: PayoutType;
  inviteCode: string;
}

export interface ApiCommitteeMember {
  id: string;
  userId: string;
  committeeId: string;
  payoutOrder: number | null;
  hasReceivedPayout: boolean;
  user: ApiUser;
}

export interface ApiPayout {
  id: string;
  committeeId: string;
  cycleNumber: number;
  recipientId: string;
  status: PayoutStatus;
  createdAt?: string;
  committee?: ApiCommittee;
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

export interface ApiCommitteeDetail extends ApiCommittee {
  members: ApiCommitteeMember[];
  payouts: ApiPayout[];
}

export interface ApiDashboardResponse {
  committees: Array<{
    id: string;
    userId: string;
    committeeId: string;
    payoutOrder: number | null;
    hasReceivedPayout: boolean;
    committee: ApiCommittee;
  }>;
  pendingContributions: number;
  nextPayout: ApiPayout | null;
}

export interface UiCommitteeCard {
  id: string;
  name: string;
  contributionAmount: number;
  cycleLength: number;
  currentCycle: number;
  totalMembers: number;
  frequency: Frequency;
  payoutType: PayoutType;
  startDate: string;
  inviteCode: string;
  adminId: string;
}

export function parseMoney(value: string | number) {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
