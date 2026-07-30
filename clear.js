const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$executeRawUnsafe('DELETE FROM "SavedRequest"');
  console.log('deleted');
  await prisma.$disconnect();
}
main();
