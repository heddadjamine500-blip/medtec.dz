const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const adapter = new PrismaBetterSqlite3({ url: 'file:' + path.resolve(__dirname, 'dev.db') });
const prisma = new PrismaClient({ adapter });

async function clean() {
  await prisma.user.deleteMany({ where: { email: { contains: 'medtec-test.com' } } });
  console.log('Old E2E test records deleted.');
}

clean().finally(() => prisma.$disconnect());
