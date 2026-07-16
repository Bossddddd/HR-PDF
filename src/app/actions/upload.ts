'use server';
import { put } from '@vercel/blob';

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    if (file.size === 0) {
      return { success: false, error: 'ไม่สามารถอ่านไฟล์ได้ (ไฟล์อาจจะกำลังเปิดใช้งานอยู่ในโปรแกรมอื่น โปรดปิดไฟล์ก่อนอัปโหลด)' };
    }
    
    const buffer = await file.arrayBuffer();

    // Ensure filename is safe and unique
    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const blob = await put(uniqueName, buffer, { access: 'private', contentType: file.type });
    
    return { success: true, url: `/api/file?url=${encodeURIComponent(blob.url)}` };
  } catch (error: any) {
    console.error('Upload error:', error);
    return { success: false, error: error.message };
  }
}

export async function uploadFile(formData: FormData) {
  return uploadImage(formData); // same logic
}
