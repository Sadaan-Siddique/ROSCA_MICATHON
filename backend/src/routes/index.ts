import { Router } from "express";
import { z } from "zod";
import dayjs from "dayjs";
import { Frequency, PayoutStatus, PayoutType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../middlewares/errorHandler.js";
import { notify } from "../services/notificationService.js";

export const router = Router();

const otpRequestSchema = z.object({ phone: z.string().min(10) });
const otpVerifySchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(4),
  name: z.string().min(2)
});
const createCommitteeSchema = z.object({
  name: z.string().min(3),
  contributionAmount: z.number().positive(),
  cycleLength: z.number().int().positive(),
  frequency: z.enum(["WEEKLY", "MONTHLY"]),
  adminId: z.string(),
  startDate: z.string().datetime(),
  payoutType: z.enum(["FIXED", "RANDOM"])
});
const joinSchema = z.object({
  userId: z.string(),
  inviteCode: z.string().min(5)
});
const payoutOrderSchema = z.object({
  members: z.array(z.object({ userId: z.string(), payoutOrder: z.number().int().positive() }))
});

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.post("/auth/request-otp", (req, res) => {
  const parsed = otpRequestSchema.parse(req.body);
  notify(`OTP requested for ${parsed.phone}`);
  res.json({ message: `OTP sent on ${parsed.phone}`, otp: "1234" });
});

router.post("/auth/verify-otp", async (req, res) => {
  const parsed = otpVerifySchema.parse(req.body);
  if (parsed.otp !== "1234") {
    throw new ApiError(400, "Invalid OTP");
  }

  const user = await prisma.user.upsert({
    where: { phone: parsed.phone },
    update: { name: parsed.name },
    create: { phone: parsed.phone, name: parsed.name }
  });

  res.json(user);
});

router.post("/committees", async (req, res) => {
  const parsed = createCommitteeSchema.parse(req.body);
  const admin = await prisma.user.findUnique({ where: { id: parsed.adminId } });
  if (!admin) {
    throw new ApiError(404, "Admin user not found");
  }

  const committee = await prisma.committee.create({
    data: {
      ...parsed,
      contributionAmount: new Prisma.Decimal(parsed.contributionAmount),
      frequency: parsed.frequency as Frequency,
      payoutType: parsed.payoutType as PayoutType,
      inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
      members: {
        create: {
          userId: parsed.adminId,
          payoutOrder: 1
        }
      }
    }
  });

  res.status(201).json(committee);
});

router.post("/committees/:committeeId/join", async (req, res) => {
  const { committeeId } = req.params;
  const parsed = joinSchema.parse(req.body);
  const committee = await prisma.committee.findUnique({ where: { id: committeeId } });

  if (!committee || committee.inviteCode !== parsed.inviteCode) {
    throw new ApiError(404, "Committee not found or invite code invalid");
  }

  const existingCount = await prisma.committeeMember.count({ where: { committeeId } });
  if (existingCount >= committee.cycleLength) {
    throw new ApiError(400, "Committee is full");
  }

  const member = await prisma.committeeMember.create({
    data: {
      userId: parsed.userId,
      committeeId,
      payoutOrder: existingCount + 1
    }
  });
  res.status(201).json(member);
});

router.get("/committees/:committeeId", async (req, res) => {
  const { committeeId } = req.params;
  const committee = await prisma.committee.findUnique({
    where: { id: committeeId },
    include: {
      members: { include: { user: true }, orderBy: { payoutOrder: "asc" } },
      payouts: { orderBy: { cycleNumber: "desc" }, take: 1 }
    }
  });

  if (!committee) {
    throw new ApiError(404, "Committee not found");
  }

  res.json(committee);
});

router.get("/committees/:committeeId/members", async (req, res) => {
  const members = await prisma.committeeMember.findMany({
    where: { committeeId: req.params.committeeId },
    include: { user: true },
    orderBy: { payoutOrder: "asc" }
  });
  res.json(members);
});

router.patch("/committees/:committeeId/payout-order", async (req, res) => {
  const { committeeId } = req.params;
  const parsed = payoutOrderSchema.parse(req.body);

  await prisma.$transaction(
    parsed.members.map((member) =>
      prisma.committeeMember.update({
        where: { userId_committeeId: { userId: member.userId, committeeId } },
        data: { payoutOrder: member.payoutOrder }
      })
    )
  );

  res.json({ message: "Payout order updated" });
});

router.post("/committees/:committeeId/cycles/:cycleNumber/contributions/generate", async (req, res) => {
  const { committeeId, cycleNumber } = req.params;
  const cycle = Number(cycleNumber);
  const committee = await prisma.committee.findUnique({
    where: { id: committeeId },
    include: { members: true }
  });

  if (!committee) {
    throw new ApiError(404, "Committee not found");
  }

  const dueDate = dayjs(committee.startDate)
    .add(cycle - 1, committee.frequency === Frequency.WEEKLY ? "week" : "month")
    .toDate();

  await prisma.$transaction(
    committee.members.map((member) =>
      prisma.contribution.upsert({
        where: {
          userId_committeeId_cycleNumber: {
            userId: member.userId,
            committeeId,
            cycleNumber: cycle
          }
        },
        update: { dueDate, isOverdue: dueDate < new Date() },
        create: {
          userId: member.userId,
          committeeId,
          cycleNumber: cycle,
          dueDate,
          isOverdue: dueDate < new Date()
        }
      })
    )
  );

  res.status(201).json({ message: "Contributions generated", cycle });
});

router.patch("/contributions/:contributionId/pay", async (req, res) => {
  const contribution = await prisma.contribution.update({
    where: { id: req.params.contributionId },
    data: {
      paid: true,
      paidAt: new Date(),
      isOverdue: false
    }
  });

  notify(`Contribution paid by user ${contribution.userId} for committee ${contribution.committeeId}`);
  res.json(contribution);
});

router.post("/committees/:committeeId/cycles/:cycleNumber/payouts/assign", async (req, res) => {
  const { committeeId, cycleNumber } = req.params;
  const cycle = Number(cycleNumber);
  const committee = await prisma.committee.findUnique({
    where: { id: committeeId },
    include: { members: { orderBy: { payoutOrder: "asc" } } }
  });

  if (!committee) {
    throw new ApiError(404, "Committee not found");
  }

  let recipientId: string | undefined = committee.members[0]?.userId;
  if (committee.payoutType === PayoutType.FIXED) {
    const recipient = committee.members.find((m) => m.payoutOrder === cycle);
    recipientId = recipient?.userId;
  } else {
    const randomIndex = Math.floor(Math.random() * committee.members.length);
    recipientId = committee.members[randomIndex]?.userId;
  }

  if (!recipientId) {
    throw new ApiError(400, "No recipient available");
  }

  const payout = await prisma.payout.upsert({
    where: { committeeId_cycleNumber: { committeeId, cycleNumber: cycle } },
    update: { recipientId, status: PayoutStatus.PENDING },
    create: { committeeId, cycleNumber: cycle, recipientId, status: PayoutStatus.PENDING }
  });

  notify(`Cycle ${cycle} payout assigned to ${recipientId}`);
  res.status(201).json(payout);
});

router.get("/committees/:committeeId/current-cycle", async (req, res) => {
  const { committeeId } = req.params;
  const committee = await prisma.committee.findUnique({ where: { id: committeeId } });
  if (!committee) {
    throw new ApiError(404, "Committee not found");
  }

  const currentCycle = Math.max(
    1,
    dayjs().diff(committee.startDate, committee.frequency === Frequency.WEEKLY ? "week" : "month") + 1
  );
  const payout = await prisma.payout.findUnique({
    where: { committeeId_cycleNumber: { committeeId, cycleNumber: currentCycle } }
  });

  res.json({ currentCycle, payout });
});

router.get("/dashboard/:userId", async (req, res) => {
  const { userId } = req.params;
  const memberships = await prisma.committeeMember.findMany({
    where: { userId },
    include: {
      committee: true
    }
  });

  const committeeIds = memberships.map((m) => m.committeeId);
  const pendingContributions = await prisma.contribution.count({
    where: { userId, paid: false, committeeId: { in: committeeIds } }
  });

  const nextPayout = await prisma.payout.findFirst({
    where: { committeeId: { in: committeeIds }, status: PayoutStatus.PENDING },
    orderBy: [{ cycleNumber: "asc" }, { createdAt: "asc" }],
    include: { committee: true }
  });

  res.json({
    committees: memberships,
    pendingContributions,
    nextPayout
  });
});
