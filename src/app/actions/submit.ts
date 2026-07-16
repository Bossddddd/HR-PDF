'use server';

import prisma from '@/lib/prisma';

export async function getFormTemplateById(id: string) {
  try {
    const form = await prisma.formTemplate.findUnique({
      where: { id }
    });
    return { success: true, form };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitFormResponse(formTemplateId: string, submitterName: string, dataJson: string) {
  try {
    const response = await prisma.formResponse.create({
      data: {
        formTemplateId,
        submitterName,
        dataJson,
        status: 'รอตรวจสอบ',
      }
    });

    const template = await prisma.formTemplate.findUnique({ where: { id: formTemplateId } });

    await prisma.auditLog.create({
      data: {
        action: 'SUBMIT_FORM',
        details: `${submitterName} ส่งเอกสาร: ${template?.title}`,
        user: submitterName,
      }
    });

    return { success: true, response };
  } catch (error: any) {
    console.error('Submit error:', error);
    return { success: false, error: error.message };
  }
}
