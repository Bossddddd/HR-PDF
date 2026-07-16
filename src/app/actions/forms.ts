'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createFormTemplate(title: string, description: string, blocksJson: string, workflowJson: string) {
  try {
    const form = await prisma.formTemplate.create({
      data: {
        title,
        description,
        blocksJson,
        workflowJson,
      },
    });
    
    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_FORM',
        details: `Created form template: ${title}`,
        user: 'Admin',
      }
    });

    revalidatePath('/admin/forms');
    return { success: true, form };
  } catch (error: any) {
    console.error('Error creating form template:', error);
    return { success: false, error: error.message };
  }
}

export async function getFormTemplates() {
  try {
    const forms = await prisma.formTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { responses: true }
        }
      }
    });
    return { success: true, forms };
  } catch (error: any) {
    console.error('Error fetching forms:', error);
    return { success: false, forms: [] };
  }
}

export async function deleteFormTemplate(id: string) {
  try {
    const form = await prisma.formTemplate.delete({
      where: { id }
    });
    
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_FORM',
        details: `Deleted form template: ${form.title}`,
        user: 'Admin',
      }
    });

    revalidatePath('/admin/forms');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
