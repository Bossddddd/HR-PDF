import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
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
      return NextResponse.json({ success: true, message: 'Created Admin User: admin' });
    } else {
      return NextResponse.json({ success: true, message: 'Admin user already exists' });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
