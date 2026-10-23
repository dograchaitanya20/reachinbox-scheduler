import nodemailer from 'nodemailer';
import { existsSync, readFileSync } from 'node:fs';
import { prisma } from './db';
(async () => {
  if (process.env.LOCAL_SMTP) {
    for (let i = 1; i <= 3; i++) {
      const user = `sender${i}@local.test`;
      if (!(await prisma.sender.findFirst({ where: { user } })))
        await prisma.sender.create({ data: { user, pass: 'x', host: 'localhost', port: 1025 } });
    }
  } else {
    const local = existsSync('senders.json') ? JSON.parse(readFileSync('senders.json', 'utf8')) : null;
    const list = local ?? await Promise.all(Array.from({ length: 3 }, () => nodemailer.createTestAccount()));
    for (const a of list)
      if (!(await prisma.sender.findFirst({ where: { user: a.user } })))
        await prisma.sender.create({ data: { user: a.user, pass: a.pass, host: 'smtp.ethereal.email', port: 587 } });
  }
  console.log(await prisma.sender.findMany());
  process.exit(0);
})();
