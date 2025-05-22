import { MemberType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const memberTypes: MemberType[] = [
  { id: 'BASIC', postsLimitPerMonth: 10, discount: 2.3 },
  { id: 'BUSINESS', postsLimitPerMonth: 100, discount: 7.7 },
];

for (const memberType of memberTypes) {
  await prisma.memberType.create({
    data: memberType,
  });
}

await prisma.$disconnect();
