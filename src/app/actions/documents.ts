'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getDocuments() {
  try {
    const docs = await prisma.document.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, documents: docs };
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return { success: false, error: error.message };
  }
}

export async function createDocument(data: {
  title: string;
  description?: string;
  type: string;
  contentJson?: string;
  fileUrl?: string;
}) {
  try {
    const doc = await prisma.document.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        contentJson: data.contentJson,
        fileUrl: data.fileUrl,
      }
    });
    revalidatePath('/admin/documents');
    return { success: true, document: doc };
  } catch (error: any) {
    console.error('Error creating document:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteDocument(id: string) {
  try {
    await prisma.document.delete({ where: { id } });
    revalidatePath('/admin/documents');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return { success: false, error: error.message };
  }
}

export async function getDocumentById(id: string) {
  try {
    const doc = await prisma.document.findUnique({ where: { id } });
    return { success: true, document: doc };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDocumentContent(id: string, contentJson: string) {
  try {
    const doc = await prisma.document.update({
      where: { id },
      data: { contentJson }
    });
    revalidatePath(`/admin/documents/${id}`);
    revalidatePath('/admin/documents');
    return { success: true, document: doc };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
