export type Frequency = "WEEKLY" | "MONTHLY";
export type PayoutType = "FIXED" | "RANDOM";

export interface User {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export interface Committee {
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

export interface CommitteeMember {
  id: string;
  userId: string;
  committeeId: string;
  payoutOrder: number;
  hasReceivedPayout: boolean;
  user: User;
}

export interface DashboardData {
  committees: Array<{ committee: Committee }>;
  pendingContributions: number;
  nextPayout: { cycleNumber: number; committee: Committee } | null;
}

export interface Payout {
  id: string;
  committeeId: string;
  cycleNumber: number;
  recipientId: string;
  status: "PENDING" | "PAID";
}
