try {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
} catch (e) {
  console.log("SYNC ERROR:", e.message);
}
