'use server';
import { put } from '@vercel/blob';
import { PDFDocument } from 'pdf-lib';
import PizZip from 'pizzip';

export async function parseDocument(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');
    
    const buffer = await file.arrayBuffer();
    const fileName = file.name.toLowerCase();
    
    let extractedFields: string[] = [];

    // Parse PDF
    if (fileName.endsWith('.pdf')) {
      try {
        const pdfDoc = await PDFDocument.load(buffer);
        const form = pdfDoc.getForm();
        const fields = form.getFields();
        extractedFields = fields.map(f => f.getName());
      } catch (err) {
        console.error('Error parsing PDF:', err);
      }
    } 
    // Parse Word (DOCX)
    else if (fileName.endsWith('.docx')) {
      try {
        const zip = new PizZip(buffer);
        const docXml = zip.file("word/document.xml")?.asText();
        if (docXml) {
          // Strip all XML tags to reconstruct the raw text (solves Word splitting { and name })
          const rawText = docXml.replace(/<[^>]+>/g, '');
          // Find all {variable} patterns
          const matches = rawText.match(/\{([^}]+)\}/g);
          if (matches) {
            // Extract the variable names inside { } and remove duplicates
            const rawVars = matches.map(m => m.replace(/[{}]/g, '').trim());
            extractedFields = Array.from(new Set(rawVars));
          }
        }
      } catch (err) {
        console.error('Error parsing DOCX:', err);
      }
    }

    // Upload file to Vercel Blob
    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const blob = await put(uniqueName, file, { access: 'public' });
    
    return { 
      success: true, 
      url: blob.url, 
      extractedFields 
    };
  } catch (error: any) {
    console.error('Parse document error:', error);
    return { success: false, error: error.message };
  }
}
