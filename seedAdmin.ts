import { config } from 'dotenv';
config({ path: '.env' });
import prisma from './src/lib/prisma';

async function main() {
  let role = await prisma.role.findFirst({ where: { level: 100 } });
  if (!role) {
    role = await prisma.role.create({
      data: {
        name: 'ผู้ดูแลระบบ (Admin)',
        description: 'ผู้ดูแลระบบสูงสุด',
        level: 100,
        isSystem: true,
        permissions: '[]'
      }
    });
    console.log('Created Admin Role:', role.name);
  }

  const user = await prisma.user.findFirst({ where: { username: 'admin' } });
  if (!user) {
    await prisma.user.create({
      data: {
        name: 'คุณบอส (Admin)',
        username: 'admin',
        password: 'admin',
        roleId: role.id
      }
    });
    console.log('Created Admin User: admin');
  } else {
    console.log('Admin user already exists');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
