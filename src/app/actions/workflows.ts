'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createWorkflow(data: {
  title: string;
  description?: string;
  isLoginRequired: boolean;
  steps: { roleName: string; documentId: string; orderIndex: number }[];
}) {
  try {
    const workflow = await prisma.workflow.create({
      data: {
        title: data.title,
        description: data.description,
        isLoginRequired: data.isLoginRequired,
        steps: {
          create: data.steps.map(step => ({
            orderIndex: step.orderIndex,
            roleName: step.roleName,
            documentId: step.documentId
          }))
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE_WORKFLOW',
        details: `Created workflow: ${data.title}`,
        user: 'Admin',
      }
    });

    revalidatePath('/admin/forms');
    revalidatePath('/');
    return { success: true, workflow };
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    return { success: false, error: error.message };
  }
}

export async function updateWorkflow(id: string, data: {
  title: string;
  description?: string;
  isLoginRequired: boolean;
  steps: { roleName: string; documentId: string; orderIndex: number }[];
}) {
  try {
    const workflow = await prisma.$transaction(async (tx) => {
      await tx.workflowStep.deleteMany({ where: { workflowId: id } });
      return tx.workflow.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          isLoginRequired: data.isLoginRequired,
          steps: {
            create: data.steps.map(step => ({
              orderIndex: step.orderIndex,
              roleName: step.roleName,
              documentId: step.documentId
            }))
          }
        }
      });
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_WORKFLOW',
        details: `Updated workflow: ${data.title}`,
        user: 'Admin',
      }
    });

    revalidatePath('/admin/forms');
    revalidatePath('/');
    return { success: true, workflow };
  } catch (error: any) {
    console.error('Error updating workflow:', error);
    return { success: false, error: error.message };
  }
}

export async function getWorkflows() {
  try {
    const workflows = await prisma.workflow.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        steps: {
          include: { document: true },
          orderBy: { orderIndex: 'asc' }
        },
        _count: {
          select: { responses: true }
        }
      }
    });
    return { success: true, workflows };
  } catch (error: any) {
    console.error('Error fetching workflows:', error);
    return { success: false, workflows: [] };
  }
}

export async function deleteWorkflow(id: string) {
  try {
    const workflow = await prisma.workflow.delete({
      where: { id }
    });
    
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_WORKFLOW',
        details: `Deleted workflow: ${workflow.title}`,
        user: 'Admin',
      }
    });

    revalidatePath('/admin/forms');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
