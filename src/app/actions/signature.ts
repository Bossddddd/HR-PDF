'use server';

import prisma from '@/lib/prisma';

export async function createSignatureSession() {
  try {
    const session = await prisma.signatureSession.create({
      data: {
        expiresAt: new Date(Date.now() + 1000 * 60 * 15), // 15 minutes expiration
      }
    });
    return { success: true, sessionId: session.id };
  } catch (error: any) {
    console.error('Create signature session error:', error);
    return { success: false, error: error.message };
  }
}

export async function checkSignatureSession(sessionId: string) {
  try {
    const session = await prisma.signatureSession.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) {
      return { success: false, error: 'Session not found' };
    }
    
    if (session.status === 'COMPLETED' && session.imageUrl) {
      return { success: true, isCompleted: true, imageUrl: session.imageUrl };
    }
    
    return { success: true, isCompleted: false };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function completeSignatureSession(sessionId: string, base64Image: string) {
  try {
    await prisma.signatureSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        imageUrl: base64Image
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Complete signature session error:', error);
    return { success: false, error: error.message };
  }
}
