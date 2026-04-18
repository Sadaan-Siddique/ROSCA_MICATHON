export type Frequency = "WEEKLY" | "MONTHLY";
export type PayoutType = "FIXED" | "RANDOM";

export interface User {
  id: string;
  name: string;
  avatarColor: string;
}

export interface CommitteeMember {
  id: string;
  user: User;
  payoutOrder: number;
  hasReceivedPayout: boolean;
}

export interface Committee {
  id: string;
  name: string;
  inviteCode: string;
  contributionAmount: number;
  totalMembers: number;
  cycleLength: number;
  currentCycle: number;
  frequency: Frequency;
  payoutType: PayoutType;
  startDate: string;
  members: CommitteeMember[];
  adminId: string;
}

export interface PendingContribution {
  committeeId: string;
  committeeName: string;
  amount: number;
  dueDate: string;
  cycleNumber: number;
}

export interface NextPayout {
  committeeId: string;
  committeeName: string;
  amount: number;
  expectedDate: string;
  cycleNumber: number;
}

export interface DemoUser extends User {
  role: "ADMIN" | "MEMBER";
  initials: string;
}

export const DEMO_USERS: DemoUser[] = [
  { id: "u_1", name: "Admin Sadaan", initials: "AS", role: "ADMIN", avatarColor: "oklch(0.74 0.17 158)" },
  { id: "u_4", name: "Member Ali", initials: "MA", role: "MEMBER", avatarColor: "oklch(0.62 0.22 25)" },
  { id: "u_3", name: "Member Zara", initials: "MZ", role: "MEMBER", avatarColor: "oklch(0.78 0.16 78)" },
];

// Simple global mutable current user with subscriber pattern (mock auth)
let _currentUserId = DEMO_USERS[0].id;
const _listeners = new Set<() => void>();

export const userStore = {
  get: () => DEMO_USERS.find((u) => u.id === _currentUserId)!,
  set: (id: string) => {
    if (DEMO_USERS.some((u) => u.id === id)) {
      _currentUserId = id;
      _listeners.forEach((l) => l());
    }
  },
  subscribe: (l: () => void) => {
    _listeners.add(l);
    return () => _listeners.delete(l);
  },
  getSnapshot: () => _currentUserId,
};

// Backward compat — still exported but should be considered the default admin
export const CURRENT_USER: User = DEMO_USERS[0];

const mkUser = (id: string, name: string, color: string): User => ({
  id,
  name,
  avatarColor: color,
});

const team = [
  CURRENT_USER,
  mkUser("u_2", "Bilal Ahmed", "oklch(0.7 0.14 200)"),
  mkUser("u_3", "Zara Malik", "oklch(0.78 0.16 78)"),
  mkUser("u_4", "Hassan Raza", "oklch(0.62 0.22 25)"),
  mkUser("u_5", "Maryam Iqbal", "oklch(0.6 0.15 290)"),
  mkUser("u_6", "Faisal Sheikh", "oklch(0.7 0.14 160)"),
  mkUser("u_7", "Sana Tariq", "oklch(0.7 0.14 320)"),
  mkUser("u_8", "Omar Javed", "oklch(0.7 0.14 50)"),
];

export const COMMITTEES: Committee[] = [
  {
    id: "c_1",
    name: "Family Gold Pool",
    inviteCode: "KMT-GOLD-7421",
    contributionAmount: 25000,
    totalMembers: 8,
    cycleLength: 8,
    currentCycle: 3,
    frequency: "MONTHLY",
    payoutType: "FIXED",
    startDate: "2025-02-01",
    adminId: "u_1",
    members: team.slice(0, 8).map((u, i) => ({
      id: `m_1_${i}`,
      user: u,
      payoutOrder: i + 1,
      hasReceivedPayout: i < 2,
    })),
  },
  {
    id: "c_2",
    name: "Office Weekly Saving",
    inviteCode: "KMT-OFC-3318",
    contributionAmount: 5000,
    totalMembers: 6,
    cycleLength: 6,
    currentCycle: 2,
    frequency: "WEEKLY",
    payoutType: "RANDOM",
    startDate: "2025-03-15",
    adminId: "u_2",
    members: team.slice(0, 6).map((u, i) => ({
      id: `m_2_${i}`,
      user: u,
      payoutOrder: i + 1,
      hasReceivedPayout: i < 1,
    })),
  },
  {
    id: "c_3",
    name: "Eid Celebration Fund",
    inviteCode: "KMT-EID-9902",
    contributionAmount: 15000,
    totalMembers: 10,
    cycleLength: 10,
    currentCycle: 5,
    frequency: "MONTHLY",
    payoutType: "FIXED",
    startDate: "2024-12-01",
    adminId: "u_3",
    members: team.concat(team.slice(0, 2)).slice(0, 10).map((u, i) => ({
      id: `m_3_${i}`,
      user: { ...u, id: `${u.id}_b${i}` },
      payoutOrder: i + 1,
      hasReceivedPayout: i < 4,
    })),
  },
];

export const WALLET_BALANCE = 142500;

export const PENDING_CONTRIBUTIONS: PendingContribution[] = [
  {
    committeeId: "c_1",
    committeeName: "Family Gold Pool",
    amount: 25000,
    dueDate: "2025-04-22",
    cycleNumber: 3,
  },
  {
    committeeId: "c_2",
    committeeName: "Office Weekly Saving",
    amount: 5000,
    dueDate: "2025-04-19",
    cycleNumber: 2,
  },
];

export const NEXT_PAYOUT: NextPayout = {
  committeeId: "c_1",
  committeeName: "Family Gold Pool",
  amount: 200000,
  expectedDate: "2025-09-01",
  cycleNumber: 8,
};

export const formatPKR = (n: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n);

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(n);

export const getCommittee = (id: string) => COMMITTEES.find((c) => c.id === id);
