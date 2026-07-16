require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const roles = [
    { name: 'ผู้ดูแลระบบ (Admin)', level: 100, isSystem: true, description: 'จัดการระบบทั้งหมด' },
    { name: 'ผู้บริหาร (Executive)', level: 80, isSystem: true, description: 'อนุมัติขั้นสุดท้าย' },
    { name: 'ผู้จัดการ (Manager)', level: 60, isSystem: true, description: 'อนุมัติระดับแผนก' },
    { name: 'หัวหน้างาน / HR', level: 40, isSystem: true, description: 'ตรวจสอบความถูกต้อง' },
    { name: 'ผู้ใช้ทั่วไป (User)', level: 10, isSystem: true, description: 'พนักงานทั่วไป' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log('Roles seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
