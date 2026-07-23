'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { getResponseById, updateResponseStatus, updateResponseData } from '@/app/actions/responses';
import { useRole } from '@/app/context/RoleContext';

export default function ReviewFormPage() {
  const router = useRouter();
  const params = useParams();
  const responseId = params.id as string;
  const { role } = useRole();
  
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Pre-warm DOC2PDF service เมื่อโหลดหน้า — ให้ container ตื่นก่อน user กดปุ่ม
  useEffect(() => {
    const converterUrl = process.env.NEXT_PUBLIC_PDF_CONVERTER_URL || '';
    if (converterUrl) {
      const healthUrl = converterUrl.replace('/api/convert-to-pdf', '/api/health');
      fetch(healthUrl).catch(() => {});
    }
  }, []);

  useEffect(() => {
    async function loadResponse() {
      const res = await getResponseById(responseId);
      if (res.success && res.response) {
        setResponse(res.response);
        setFormData(res.response.dataJson ? JSON.parse(res.response.dataJson) : {});
      } else {
        toast.error('ไม่พบเอกสารนี้');
      }
      setLoading(false);
    }
    loadResponse();
  }, [responseId]);

  const handleChange = (blockId: string, value: string) => {
    setFormData(prev => ({ ...prev, [blockId]: value }));
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    
    // Save updated data (signatures)
    const dataStr = JSON.stringify(formData);
    const actorRole = role ? String(role) : 'System';
    await updateResponseData(responseId, dataStr, actorRole, `ลงนามโดย ${actorRole}`);

    // Advance workflow status based on current role
    let nextStatus = 'อนุมัติแล้ว';
    if (response.status === 'รอตรวจสอบ' && actorRole === 'หัวหน้างาน / HR') {
      nextStatus = 'รอผู้จัดการอนุมัติ';
    } else if (response.status === 'รอผู้จัดการอนุมัติ' && actorRole === 'ผู้จัดการ (Manager)') {
      nextStatus = 'รอผู้บริหารเซ็น';
    } else if (response.status === 'รอผู้บริหารเซ็น' && actorRole === 'ผู้บริหาร (Executive)') {
      nextStatus = 'อนุมัติแล้ว';
    }

    const resStatus = await updateResponseStatus(responseId, nextStatus);
    
    if (resStatus.success) {
      toast.success('อนุมัติเอกสารและส่งต่อเรียบร้อยแล้ว!');
      router.push('/inbox');
    } else {
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    const resStatus = await updateResponseStatus(responseId, 'ตีกลับ');
    
    if (resStatus.success) {
      toast.error('เอกสารถูกตีกลับแล้ว');
      router.push('/inbox');
    } else {
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
      setIsSubmitting(false);
    }
  };

  const handlePrintPdf = async () => {
    setIsPrinting(true);
    try {
      toast.loading('กำลังเตรียมไฟล์ PDF สำหรับพิมพ์...', { id: 'print-loading' });
      
      const hasDocx = response.workflow?.steps?.some((s: any) => s.document?.type === 'file' && s.document?.fileUrl?.toLowerCase().includes('.docx'));
      const url = hasDocx ? `/api/export-document?responseId=${response.id}&format=pdf` : `/api/export-document?responseId=${response.id}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to generate PDF');
      
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = blobUrl;
      
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          toast.dismiss('print-loading');
          
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
              URL.revokeObjectURL(blobUrl);
            }
          }, 60000);
        }, 1000);
      };
      
      document.body.appendChild(iframe);
    } catch (err) {
      console.error(err);
      toast.dismiss('print-loading');
      toast.error('เกิดข้อผิดพลาดในการเตรียมเอกสารเพื่อพิมพ์');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = async (format: string, originalFileName?: string) => {
    setIsDownloading(format);
    const toastId = toast.loading(`กำลังเตรียมไฟล์ ${format.toUpperCase()}...`);
    try {
      const url = `/api/export-document?responseId=${response.id}&format=${format}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to download');
      
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      
      let filename = `document-${response.id}.${format}`;
      const disposition = res.headers.get('Content-Disposition');
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="(.+)"/);
        if (match && match[1]) filename = match[1];
      } else if (originalFileName) {
        filename = originalFileName.replace(/\.[^/.]+$/, "") + `.${format}`;
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 1000);
      
      toast.success(`ดาวน์โหลดไฟล์ ${format.toUpperCase()} สำเร็จ`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(`เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์ ${format.toUpperCase()}`, { id: toastId });
    } finally {
      setIsDownloading(null);
    }
  };

  // Extract fields from all documents in the workflow
  const { allFields, attachedFiles } = useMemo(() => {
    const fields: any[] = [];
    const files: any[] = [];
    const form = response?.workflow;
    if (!form) return { allFields: fields, attachedFiles: files };
    
    const fieldKeys = new Set<string>();
    form.steps?.forEach((step: any) => {
      if (step.document) {
        if (step.document.contentJson) {
          try {
            const blocks = JSON.parse(step.document.contentJson);
            blocks.forEach((block: any) => {
              const key = block.type === 'heading' || block.type === 'paragraph' || block.type === 'image' ? block.id : (block.label || block.id);
              if (!fieldKeys.has(key)) {
                fieldKeys.add(key);
                fields.push({ ...block, stepRole: step.roleName, docTitle: step.document.title });
              }
            });
          } catch (e) {
            console.error('Error parsing document content', e);
          }
        }
        
        if (step.document.type === 'file' && step.document.fileUrl) {
          files.push({
            id: step.document.id,
            title: step.document.title,
            url: step.document.fileUrl,
            stepRole: step.roleName
          });
        }
      }
    });
    return { allFields: fields, attachedFiles: files };
  }, [response]);

  // Auto-fill dates for current user's role
  useEffect(() => {
    if (allFields.length > 0 && role && response) {
      const isReadonly = response.status === 'อนุมัติแล้ว' || response.status === 'ตีกลับ';
      if (isReadonly) return;

      const now = new Date();
      const thaiMonths = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
      ];
      
      const day = now.getDate().toString();
      const monthStr = thaiMonths[now.getMonth()];
      const yearBE = (now.getFullYear() + 543).toString();
      
      const tzOffset = now.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
      const yyyyMmDd = localISOTime;

      setFormData(prev => {
        let updated = { ...prev };
        let changed = false;

        allFields.forEach(field => {
          const isMyRole = role === (field.assignedRole || field.stepRole);
          if (!isMyRole) return; 

          // If already filled, don't overwrite
          if (updated[field.id]) return;

          const label = field.label || field.id;
          const cleanLabel = label.startsWith('%') ? label.substring(1) : label;

          if (field.type === 'date' || cleanLabel.includes('วัน/เดือน/ปี ที่ลงนาม')) {
             updated[field.id] = yyyyMmDd;
             changed = true;
          } else if (field.type === 'input') {
             if (cleanLabel === 'วันที่') {
               updated[field.id] = day;
               changed = true;
             } else if (cleanLabel === 'เดือน') {
               updated[field.id] = monthStr;
               changed = true;
             } else if (cleanLabel === 'ปี' || cleanLabel === 'ปีพ.ศ.' || cleanLabel === 'ปี พ.ศ.') {
               updated[field.id] = yearBE;
               changed = true;
             }
          }
        });

        return changed ? updated : prev;
      });
    }
  }, [allFields, role, response]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">กำลังโหลดเอกสาร...</div>;
  if (!response || !response.workflow) return <div className="min-h-screen flex items-center justify-center bg-slate-50">ไม่พบเอกสาร 404</div>;

  const form = response.workflow;
  const isReadOnly = response.status === 'อนุมัติแล้ว' || response.status === 'ตีกลับ';

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <button onClick={() => router.back()} className="text-slate-600 font-bold hover:underline flex items-center gap-2">
            &larr; กลับ
          </button>
          <div className="flex gap-2">
            <button onClick={handlePrintPdf} disabled={isPrinting} className={`font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${isPrinting ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}>
              {isPrinting ? '⏳ กำลังเตรียม...' : '🖨️ พิมพ์ (Print)'}
            </button>
            {response.workflow?.steps?.some((s: any) => s.document?.type === 'file' && s.document?.fileUrl?.toLowerCase().includes('.pdf')) && (
              <button onClick={() => handleDownload('pdf', response.workflow?.steps?.find((s: any) => s.document?.type === 'file')?.document?.title)} disabled={isDownloading !== null} className={`font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${isDownloading === 'pdf' ? 'bg-indigo-400 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                {isDownloading === 'pdf' ? '⏳ กำลังเตรียม...' : '📥 ดาวน์โหลด (PDF)'}
              </button>
            )}
            
            {response.workflow?.steps?.some((s: any) => s.document?.type === 'file' && s.document?.fileUrl?.toLowerCase().includes('.docx')) && (
              <>
                <button onClick={() => handleDownload('docx', response.workflow?.steps?.find((s: any) => s.document?.type === 'file')?.document?.title)} disabled={isDownloading !== null} className={`font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm ${isDownloading === 'docx' ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                  {isDownloading === 'docx' ? '⏳ กำลังเตรียม...' : '📥 ดาวน์โหลด (Word)'}
                </button>
                <button onClick={() => handleDownload('pdf', response.workflow?.steps?.find((s: any) => s.document?.type === 'file')?.document?.title)} disabled={isDownloading !== null} className={`font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm ${isDownloading === 'pdf' ? 'bg-red-400 text-white cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`} title="⚠️ ฟีเจอร์แปลง PDF อาจจะไม่ทำงานบนระบบ Vercel">
                  {isDownloading === 'pdf' ? '⏳ กำลังเตรียม...' : '📥 ดาวน์โหลด (PDF)'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white shadow-xl rounded-xl p-8 md:p-12 border border-slate-200 min-h-[1123px] relative flex flex-col gap-6 print:shadow-none print:border-none print:p-0 print:min-h-0">
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-xl print:hidden"></div>
          
          <div className="mb-4 border-b border-slate-200 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 mb-2">{form.title}</h1>
              <p className="text-slate-500">ส่งโดย: {response.submitterName}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              response.status === 'อนุมัติแล้ว' ? 'bg-green-100 text-green-700' :
              response.status === 'ตีกลับ' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {response.status}
            </span>
          </div>

          <div className="flex-1 flex flex-col gap-6 pointer-events-auto">
            {allFields.map((block: any) => {
              if (block.type === 'heading') return <h2 key={block.id} className="text-2xl font-bold text-slate-800 mt-4">{block.content}</h2>;
              if (block.type === 'paragraph') return <p key={block.id} className="text-slate-600 leading-relaxed whitespace-pre-wrap">{block.content}</p>;
              
              const isMyRole = (!block.assignedRole || block.assignedRole === 'ผู้ใช้ทั่วไป (User)' || block.stepRole === role) && !isReadOnly;
              const hasData = !!formData[block.id];

              if (block.type === 'input') {
                return (
                  <div key={block.id} className="w-full">
                    <label className={`block text-sm font-bold mb-2 ${isMyRole ? 'text-indigo-700' : 'text-slate-500'}`}>
                      {(block.label || '').startsWith('%') ? block.label.substring(1) : block.label}
                      <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${isMyRole ? 'text-indigo-600 bg-indigo-100' : 'text-slate-500 bg-slate-100'} print:hidden`}>({block.assignedRole || block.stepRole})</span>
                    </label>
                    <input 
                      type="text" 
                      disabled={!isMyRole}
                      value={formData[block.id] || ''}
                      onChange={(e) => handleChange(block.id, e.target.value)}
                      placeholder={isMyRole ? "กรุณากรอกข้อมูลเพื่อประเมิน..." : ""}
                      className={`w-full border rounded-lg px-4 py-3 outline-none transition-colors ${isMyRole ? 'bg-indigo-50 border-indigo-200 focus:border-indigo-500 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-600'} print:border-none print:bg-transparent print:p-0 print:text-black print:font-normal`}
                    />
                  </div>
                );
              }

              if (block.type === 'textarea') {
                return (
                  <div key={block.id} className="w-full">
                    <label className={`block text-sm font-bold mb-2 ${isMyRole ? 'text-indigo-700' : 'text-slate-500'}`}>
                      {(block.label || '').startsWith('%') ? block.label.substring(1) : block.label}
                      <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${isMyRole ? 'text-indigo-600 bg-indigo-100' : 'text-slate-500 bg-slate-100'} print:hidden`}>({block.assignedRole || block.stepRole})</span>
                    </label>
                    <textarea 
                      disabled={!isMyRole}
                      value={formData[block.id] || ''}
                      onChange={(e) => handleChange(block.id, e.target.value)}
                      placeholder={isMyRole ? "กรุณากรอกข้อมูลเพื่อประเมิน..." : ""}
                      rows={3}
                      className={`w-full border rounded-lg px-4 py-3 outline-none transition-colors resize-none ${isMyRole ? 'bg-indigo-50 border-indigo-200 focus:border-indigo-500 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-600'} print:border-none print:bg-transparent print:p-0 print:text-black print:font-normal`}
                    />
                  </div>
                );
              }

              if (block.type === 'date') {
                return (
                  <div key={block.id} className="w-full sm:w-1/2">
                    <label className={`block text-sm font-bold mb-2 ${isMyRole ? 'text-indigo-700' : 'text-slate-500'}`}>
                      {(block.label || '').startsWith('%') ? block.label.substring(1) : block.label}
                      <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${isMyRole ? 'text-indigo-600 bg-indigo-100' : 'text-slate-500 bg-slate-100'} print:hidden`}>({block.assignedRole || block.stepRole})</span>
                    </label>
                    <input 
                      type="date" 
                      disabled={!isMyRole}
                      value={formData[block.id] || ''}
                      onChange={(e) => handleChange(block.id, e.target.value)}
                      className={`w-full border rounded-lg px-4 py-3 outline-none transition-colors ${isMyRole ? 'bg-indigo-50 border-indigo-200 focus:border-indigo-500 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-600'} print:border-none print:bg-transparent print:p-0 print:text-black print:font-normal`}
                    />
                  </div>
                );
              }

              if (block.type === 'signature') {
                return (
                  <div key={block.id} className="mt-8 mb-4">
                    <div className="w-full sm:w-64 flex flex-col">
                      <label className={`block text-sm font-bold mb-2 ${isMyRole ? 'text-indigo-700' : 'text-slate-500'}`}>
                        {(block.label || '').startsWith('%') ? block.label.substring(1) : block.label}
                        <span className="ml-2 text-xs font-normal print:hidden">สำหรับ: {block.assignedRole || block.stepRole}</span>
                      </label>
                      <input 
                        type="text" 
                        disabled={!isMyRole}
                        placeholder={isMyRole ? "พิมพ์ชื่อเพื่อเซ็นอนุมัติ" : hasData ? "" : "รอการลงนาม..."}
                        value={formData[block.id] || ''}
                        onChange={(e) => handleChange(block.id, e.target.value)}
                        className={`w-full border rounded-lg px-4 py-3 outline-none text-center italic font-semibold transition-colors ${isMyRole ? 'bg-indigo-50 border-indigo-300 text-indigo-700 focus:border-indigo-600 shadow-inner' : hasData ? 'bg-white border-transparent text-slate-800 text-xl' : 'bg-slate-50 border-slate-200 text-slate-400'} print:border-none print:bg-transparent print:p-0 print:text-black print:font-normal`}
                      />
                    </div>
                  </div>
                );
              }
              
              return null;
            })}
          </div>

          {!isReadOnly && (
            <div className="mt-12 pt-8 border-t border-slate-200 flex gap-4 justify-end print:hidden">
              <button 
                type="button"
                onClick={handleReject}
                disabled={isSubmitting}
                className="bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-6 py-3 rounded-xl font-bold shadow-sm transition-all"
              >
                ตีกลับ (Reject)
              </button>
              <button 
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting}
                className={`${isSubmitting ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-10 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2`}
              >
                {isSubmitting ? 'กำลังประมวลผล...' : 'บันทึกการประเมิน & อนุมัติ'} 
                {!isSubmitting && <span>&rarr;</span>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
