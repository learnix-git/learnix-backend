import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import { generateAlias } from './src/utils/alias';
dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function migrateAliases() {
  console.log("Migrating missing aliases...");
  
  const users = await prisma.user.findMany({
    where: {
      alias: null,
    },
  });

  console.log(`Found ${users.length} users without alias.`);

  for (const user of users) {
    const alias = generateAlias(user.name);
    await prisma.user.update({
      where: { id: user.id },
      data: { alias },
    });
    console.log(`Updated user ${user.id} -> ${alias}`);
  }

  console.log("Migration completed.");
  process.exit(0);
}

migrateAliases().catch(console.error);
