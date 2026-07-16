'use server';
import { put } from '@vercel/blob';

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');
    
    // Ensure filename is safe and unique
    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const blob = await put(uniqueName, file, { access: 'public' });
    
    return { success: true, url: blob.url };
  } catch (error: any) {
    console.error('Upload error:', error);
    return { success: false, error: error.message };
  }
}

export async function uploadFile(formData: FormData) {
  return uploadImage(formData); // same logic
}
