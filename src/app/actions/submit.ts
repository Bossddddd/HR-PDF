'use server';

import prisma from '@/lib/prisma';

export async function getWorkflowForFilling(id: string) {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { orderIndex: 'asc' },
          include: { document: true }
        }
      }
    });
    return { success: true, workflow };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitWorkflowResponse(workflowId: string, submitterName: string, dataJson: string) {
  try {
    const response = await prisma.workflowResponse.create({
      data: {
        workflowId,
        submitterName,
        dataJson,
        status: 'รอตรวจสอบ',
        currentStep: 1, // Start at step 1
      }
    });

    const wf = await prisma.workflow.findUnique({ where: { id: workflowId } });

    await prisma.auditLog.create({
      data: {
        action: 'SUBMIT_WORKFLOW',
        details: `${submitterName} ส่งเอกสาร: ${wf?.title}`,
        user: submitterName,
      }
    });

    return { success: true, response };
  } catch (error: any) {
    console.error('Submit error:', error);
    return { success: false, error: error.message };
  }
}
