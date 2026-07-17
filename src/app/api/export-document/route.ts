import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const responseId = searchParams.get('responseId');

    if (!responseId) {
      return NextResponse.json({ success: false, error: 'Missing responseId' }, { status: 400 });
    }

    const response = await prisma.workflowResponse.findUnique({
      where: { id: responseId },
      include: {
        workflow: {
          include: {
            steps: {
              include: {
                document: true
              }
            }
          }
        }
      }
    });

    if (!response || !response.workflow) {
      return NextResponse.json({ success: false, error: 'Response not found' }, { status: 404 });
    }

    // Find the first document in the steps (PDF or DOCX)
    let docRecord = null;
    let stepContent = null;
    let isDocx = false;
    for (const step of response.workflow.steps) {
      if (step.document?.type === 'file' && step.document.fileUrl) {
        if (step.document.fileUrl.toLowerCase().includes('.pdf')) {
          docRecord = step.document;
          stepContent = step.document.contentJson;
          isDocx = false;
          break;
        } else if (step.document.fileUrl.toLowerCase().includes('.docx')) {
          docRecord = step.document;
          stepContent = step.document.contentJson;
          isDocx = true;
          break;
        }
      }
    }

    if (!docRecord || !docRecord.fileUrl) {
      return NextResponse.json({ success: false, error: 'No PDF or DOCX document found in workflow' }, { status: 400 });
    }

    // Download the original document from fileUrl
    const absoluteFileUrl = docRecord.fileUrl.startsWith('/') 
      ? new URL(docRecord.fileUrl, request.nextUrl.origin).toString() 
      : docRecord.fileUrl;
    const fileBytesRes = await fetch(absoluteFileUrl);
    const fileBytes = await fileBytesRes.arrayBuffer();

    // Parse form data
    let formData: Record<string, string> = {};
    try {
      if ((response as any).dataJson) {
        formData = JSON.parse((response as any).dataJson);
      }
    } catch (e) {
      console.error(e);
    }

    if (isDocx) {
      // Import here to avoid loading if not needed
      const PizZip = (await import('pizzip')).default;
      const Docxtemplater = (await import('docxtemplater')).default;
      const ImageModule = (await import('docxtemplater-image-module-free')).default || require('docxtemplater-image-module-free');

      // docxtemplater uses {tag}, our formData keys might be 'วัน' if the field label is 'วัน'
      const zip = new PizZip(fileBytes);
      
      const imageOpts = {
        centered: false,
        getImage: function(tagValue: string, tagName: string) {
          if (tagValue && typeof tagValue === 'string' && tagValue.startsWith('data:image/')) {
            const base64str = tagValue.split(',')[1];
            return Buffer.from(base64str, 'base64');
          }
          return Buffer.from('');
        },
        getSize: function(img: any, tagValue: string, tagName: string) {
          return [120, 40]; // Width, Height in pixels
        }
      };
      const imageModule = new ImageModule(imageOpts);

      const doc = new Docxtemplater(zip, {
        modules: [imageModule],
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{', end: '}' },
        nullGetter: function(part) {
          if (!part.module) {
            return "";
          }
          if (part.module === "rawxml") {
            return "";
          }
          return "";
        }
      });

      // Map formData (keyed by block.id) to mappedData (keyed by block.label)
      const mappedData: Record<string, string> = {};
      
      let blocks: any[] = [];
      if (stepContent) {
        try {
          blocks = JSON.parse(stepContent);
        } catch (e) {
          console.error(e);
        }
      }

      for (const block of blocks) {
        if (formData[block.id] !== undefined && block.label) {
          // Strip % if the user accidentally included it in the label
          let label = block.label.trim();
          if (label.startsWith('%')) {
            label = label.substring(1).trim();
          }
          
          const val = formData[block.id];
          
          mappedData[label] = val;
          
          // Auto split Date fields into separate Day, Month, Year tags
          if (block.type === 'date' && val) {
            const parts = val.split('-');
            if (parts.length === 3) {
              const year = parseInt(parts[0]);
              const month = parseInt(parts[1]);
              const day = parseInt(parts[2]);
              
              const thaiYear = year > 2100 ? year : year + 543; // Handle if already BE
              const thaiMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
              const thaiMonth = thaiMonths[month] || parts[1];
              
              // Automatically provide {วัน}, {เดือน}, {ปีพ.ศ.}
              mappedData['วัน'] = day.toString();
              mappedData['เดือน'] = thaiMonth;
              mappedData['ปีพ.ศ.'] = thaiYear.toString();
              
              // Override the original label with a nicely formatted Thai date
              mappedData[label] = `${day} ${thaiMonth} ${thaiYear}`;
            }
          }
          
          // Fallbacks for common mismatches
          if (label === 'วันที่' && !mappedData['วัน']) mappedData['วัน'] = val;
          if ((label === 'เดือนที่' || label === 'เดือน') && !mappedData['เดือน']) mappedData['เดือน'] = val;
          if ((label === 'ปี พ.ศ.' || label === 'ปีพ.ศ.' || label === 'ปี') && !mappedData['ปีพ.ศ.']) mappedData['ปีพ.ศ.'] = val;
          if (label === 'ชื่อนามสกุล' || label === 'ชื่อ - นามสกุล') mappedData['ชื่อ-นามสกุล'] = val;
          if (label === 'รหัส') mappedData['รหัสพนักงาน'] = val;
          if (label === 'แผนก' || label === 'ฝ่าย') mappedData['แผนก/ฝ่าย'] = val;
        }
      }
      
      console.log("=== EXPORT DOCX MAPPED DATA ===");
      console.log(mappedData);

      doc.render(mappedData);

      const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      const format = searchParams.get('format') || 'docx';

      if (format === 'pdf') {
        try {
          console.log(`[Process] Sending DOCX to external PDF conversion service for response ${response.id}...`);
          
          const converterUrl = process.env.PDF_CONVERTER_URL || 'http://localhost:3001/api/convert-to-pdf';
          
          const formData = new FormData();
          formData.append('document', new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), `document-${response.id}.docx`);

          const convertRes = await fetch(converterUrl, {
            method: 'POST',
            body: formData,
          });

          if (!convertRes.ok) {
            throw new Error(`Conversion API returned ${convertRes.status}`);
          }

          const pdfBuf = await convertRes.arrayBuffer();
          
          return new NextResponse(pdfBuf, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="document-${response.id}.pdf"`,
            },
          });
        } catch (err) {
          console.error('[Error] Document conversion failed:', err);
          return NextResponse.json({ success: false, error: 'An error occurred during document conversion to PDF. Is the converter service running?' }, { status: 500 });
        }
      }

      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="document-${response.id}.docx"`,
        },
      });

    } else {
      // PDF Processing
      const pdfDoc = await PDFDocument.load(fileBytes);
      
      pdfDoc.registerFontkit(fontkit);

      const fontUrl = new URL('/fonts/NotoSansThai-Regular.ttf', request.nextUrl.origin).toString();
      const fontRes = await fetch(fontUrl);
      if (!fontRes.ok) throw new Error('Failed to load font');
      const fontBytes = await fontRes.arrayBuffer();
      const customFont = await pdfDoc.embedFont(fontBytes);

      let blocks: any[] = [];
      if (stepContent) {
        try {
          blocks = JSON.parse(stepContent);
        } catch (e) {
          console.error(e);
        }
      }

      const pages = pdfDoc.getPages();
      const page = pages[0];
      const { width, height } = page.getSize();

      for (const block of blocks) {
        const value = formData[block.id];
        if (value) {
          if (block.type === 'input' || block.type === 'textarea' || block.type === 'date' || block.type === 'signature') {
            const x = block.x ? (block.x / 100) * width : 50;
            let yPercentage = block.y || 0;
            const y = height - ((yPercentage / 100) * height);

            page.drawText(value, {
              x: x,
              y: y - 12,
              size: 14,
              font: customFont,
              color: rgb(0, 0, 0.8),
            });
          }
        }
      }

      const finalPdfBytes = await pdfDoc.save();

      return new NextResponse(finalPdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="document-${response.id}.pdf"`,
        },
      });
    }

  } catch (error: any) {
    console.error('Export Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
