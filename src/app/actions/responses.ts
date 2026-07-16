'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getResponses() {
  try {
    const responses = await prisma.formResponse.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        formTemplate: {
          select: { title: true, workflowJson: true }
        }
      }
    });
    return { success: true, responses };
  } catch (error: any) {
    console.error('Error fetching responses:', error);
    return { success: false, responses: [] };
  }
}
export async function getResponseById(id: string) {
  try {
    const response = await prisma.formResponse.findUnique({
      where: { id },
      include: {
        formTemplate: true
      }
    });
    return { success: true, response };
  } catch (error: any) {
    console.error('Error fetching response:', error);
    return { success: false, response: null };
  }
}

export async function updateResponseStatus(id: string, newStatus: string) {
  try {
    const response = await prisma.formResponse.update({
      where: { id },
      data: { status: newStatus },
      include: { formTemplate: true }
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_STATUS',
        details: `Updated document status to [${newStatus}] for ${response.formTemplate.title} (by ${response.submitterName})`,
        user: 'Admin',
      }
    });

    revalidatePath('/admin/responses');
    revalidatePath('/inbox');
    return { success: true, response };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateResponseData(id: string, newDataJson: string, actorName: string, actionDesc: string) {
  try {
    const updated = await prisma.formResponse.update({
      where: { id },
      data: { dataJson: newDataJson }
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_RESPONSE_DATA',
        details: actionDesc,
        user: actorName,
      }
    });

    revalidatePath('/inbox');
    revalidatePath(`/form/response/${id}`);
    
    return { success: true, response: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteResponse(id: string) {
  try {
    const deleted = await prisma.formResponse.delete({
      where: { id },
      include: { formTemplate: true }
    });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE_RESPONSE',
        details: `ลบเอกสาร ${deleted.formTemplate.title} ของ ${deleted.submitterName}`,
        user: 'Admin',
      }
    });

    revalidatePath('/admin/responses');
    revalidatePath('/inbox');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
