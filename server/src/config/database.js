const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  // Do not log SQL queries to console. Keep errors and warnings only.
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
