'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getRoles() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { level: 'desc' },
    });
    return { success: true, roles };
  } catch (error) {
    console.error('Error fetching roles:', error);
    return { success: false, error: 'Failed to fetch roles' };
  }
}

export async function createRole(name: string, description: string, level: number, permissions: string = "[]") {
  try {
    const role = await prisma.role.create({
      data: { name, description, level, permissions },
    });
    revalidatePath('/admin/roles');
    return { success: true, role };
  } catch (error) {
    console.error('Error creating role:', error);
    return { success: false, error: 'Failed to create role' };
  }
}

export async function updateRole(id: string, name: string, description: string, level: number, permissions: string = "[]") {
  try {
    const role = await prisma.role.update({
      where: { id },
      data: { name, description, level, permissions },
    });
    revalidatePath('/admin/roles');
    return { success: true, role };
  } catch (error) {
    console.error('Error updating role:', error);
    return { success: false, error: 'Failed to update role' };
  }
}

export async function deleteRole(id: string) {
  try {
    const role = await prisma.role.findUnique({ where: { id } });
    if (role?.isSystem) {
      return { success: false, error: 'Cannot delete a system role' };
    }
    await prisma.role.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error('Error deleting role:', error);
    return { success: false, error: 'Failed to delete role' };
  }
}
