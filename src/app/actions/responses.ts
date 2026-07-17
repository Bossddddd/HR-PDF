'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getResponses() {
  try {
    const responses = await prisma.workflowResponse.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        workflow: {
          select: { title: true }
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
    const response = await prisma.workflowResponse.findUnique({
      where: { id },
      include: {
        workflow: {
          include: {
            steps: {
              include: {
                document: true
              },
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
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
    const response = await prisma.workflowResponse.update({
      where: { id },
      data: { status: newStatus },
      include: { workflow: true }
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_STATUS',
        details: `Updated document status to [${newStatus}] for ${response.workflow.title} (by ${response.submitterName})`,
        user: 'System',
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
    const updated = await prisma.workflowResponse.update({
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
    const deleted = await prisma.workflowResponse.delete({
      where: { id },
      include: { workflow: true }
    });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE_RESPONSE',
        details: `Deleted response ${deleted.workflow.title} from ${deleted.submitterName}`,
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
