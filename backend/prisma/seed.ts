import { Frequency, PrismaClient, PayoutType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.payout.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.committeeMember.deleteMany();
  await prisma.committee.deleteMany();
  await prisma.user.deleteMany();

  const [ali, sara, ahmed] = await Promise.all([
    prisma.user.create({ data: { name: "Ali Khan", phone: "+923001111111" } }),
    prisma.user.create({ data: { name: "Sara Iqbal", phone: "+923002222222" } }),
    prisma.user.create({ data: { name: "Ahmed Raza", phone: "+923003333333" } })
  ]);

  const committee = await prisma.committee.create({
    data: {
      name: "Karachi Family Committee",
      contributionAmount: 5000,
      cycleLength: 3,
      frequency: Frequency.MONTHLY,
      adminId: ali.id,
      startDate: new Date(),
      payoutType: PayoutType.FIXED,
      inviteCode: "KHI123",
      members: {
        create: [
          { userId: ali.id, payoutOrder: 1 },
          { userId: sara.id, payoutOrder: 2 },
          { userId: ahmed.id, payoutOrder: 3 }
        ]
      }
    }
  });

  await prisma.contribution.createMany({
    data: [
      { userId: ali.id, committeeId: committee.id, cycleNumber: 1, paid: true, paidAt: new Date(), dueDate: new Date() },
      { userId: sara.id, committeeId: committee.id, cycleNumber: 1, paid: false, dueDate: new Date() },
      { userId: ahmed.id, committeeId: committee.id, cycleNumber: 1, paid: false, dueDate: new Date() }
    ]
  });

  await prisma.payout.create({
    data: {
      committeeId: committee.id,
      cycleNumber: 1,
      recipientId: ali.id
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
