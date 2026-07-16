'use server';

import prisma from '@/lib/prisma';

export async function getAuditLogs() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent 100 logs
    });
    return { success: true, logs };
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    return { success: false, logs: [] };
  }
}
