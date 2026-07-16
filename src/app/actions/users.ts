'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, users };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return { success: false, users: [] };
  }
}

export async function createUser(name: string, username: string, roleId: string) {
  try {
    const user = await prisma.user.create({
      data: { 
        name, 
        username, 
        password: 'default_password', // Mock password for now
        roleId 
      }
    });
    revalidatePath('/admin/users');
    return { success: true, user };
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === 'P2002') {
      return { success: false, error: 'Username already exists' };
    }
    return { success: false, error: error.message };
  }
}

export async function updateUser(id: string, name: string, username: string, roleId: string) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { name, username, roleId }
    });
    revalidatePath('/admin/users');
    return { success: true, user };
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.code === 'P2002') {
      return { success: false, error: 'Username already exists' };
    }
    return { success: false, error: error.message };
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message };
  }
}
