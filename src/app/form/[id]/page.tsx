'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getWorkflowForFilling, submitWorkflowResponse } from '@/app/actions/submit';
import { useRole } from '@/app/context/RoleContext';

export default function FillFormPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const workflowId = resolvedParams.id;
  
  const { user } = useRole();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitterName, setSubmitterName] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadForm() {
      const res = await getWorkflowForFilling(workflowId);
      if (res.success && res.workflow) {
        setWorkflow(res.workflow);
        if (user) {
          setSubmitterName(user.name);
        }
      } else {
        toast.error('ไม่พบสายอนุมัติในระบบ');
      }
      setLoading(false);
    }
    loadForm();
  }, [workflowId, user]);

  const handleChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitterName.trim()) {
      toast.error('กรุณากรอกชื่อ-นามสกุลของคุณ');
      return;
    }

    if (workflow.isLoginRequired && !user) {
      toast.error('ฟอร์มนี้สงวนสิทธิ์สำหรับพนักงานที่เข้าสู่ระบบเท่านั้น');
      return;
    }

    setIsSubmitting(true);
    const dataJson = JSON.stringify(formData);
    const res = await submitWorkflowResponse(workflowId, submitterName, dataJson);
    
    if (res.success) {
      toast.success('ส่งเอกสารเรียบร้อยแล้ว!');
      router.push('/?success=true');
    } else {
      toast.error('เกิดข้อผิดพลาดในการส่งข้อมูล');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">กำลังโหลดเอกสาร...</div>;
  }

  if (!workflow) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <h1 className="text-3xl mb-2">📄 404</h1>
        <p className="text-slate-500">ไม่พบเอกสารที่คุณต้องการ</p>
      </div>
    );
  }

  // Extract fields from all documents in the workflow
  const allFields: any[] = [];
  const fieldKeys = new Set<string>();
  const attachedFiles: any[] = [];

  workflow.steps?.forEach((step: any) => {
    if (step.document) {
      if (step.document.type === 'canvas' && step.document.contentJson) {
        try {
          const blocks = JSON.parse(step.document.contentJson);
          blocks.forEach((block: any) => {
            const key = block.type === 'heading' || block.type === 'paragraph' || block.type === 'image' ? block.id : (block.label || block.id);
            if (!fieldKeys.has(key)) {
              fieldKeys.add(key);
              allFields.push({ ...block, stepRole: step.roleName, docTitle: step.document.title });
            }
          });
        } catch (e) {
          console.error('Error parsing document content', e);
        }
      } else if (step.document.type === 'file' && step.document.fileUrl) {
        // Collect reference files
        attachedFiles.push({
          id: step.document.id,
          title: step.document.title,
          url: step.document.fileUrl,
          stepRole: step.roleName
        });
      }
    }
  });

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="text-blue-600 font-bold mb-6 hover:underline flex items-center gap-2">
          &larr; กลับไปหน้าหลัก
        </button>

        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-xl p-8 md:p-12 border border-slate-200 min-h-[1123px] relative flex flex-col gap-6">
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-xl"></div>
          
          <div className="mb-8 border-b border-slate-200 pb-8">
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">{workflow.title}</h1>
            <p className="text-slate-500">{workflow.description}</p>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-6">
            <label className="block text-sm font-bold text-blue-900 mb-2">ชื่อ-นามสกุล ของคุณ (ผู้ส่งเอกสาร) <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              placeholder="กรอกชื่อของคุณเพื่อใช้เป็นลายเซ็นเบื้องต้น"
              disabled={!!user} // Auto-filled if logged in
              className={`w-full border rounded-lg px-4 py-3 outline-none focus:border-blue-500 shadow-sm ${user ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white border-blue-200'}`}
            />
            {user && <p className="text-xs text-blue-600 mt-2">ดึงข้อมูลอัตโนมัติจากบัญชีของคุณ</p>}
          </div>

          <div className="flex-1 flex flex-wrap gap-y-6 -mx-2">
            
            {attachedFiles.length > 0 && (
              <div className="w-full px-2 mb-4">
                <h3 className="font-bold text-slate-700 mb-3 text-lg border-b border-slate-200 pb-2">📎 ไฟล์เอกสารอ้างอิง</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attachedFiles.map(file => (
                    <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all bg-slate-50 group">
                      <div className="text-3xl group-hover:scale-110 transition-transform">📄</div>
                      <div>
                        <div className="font-bold text-blue-700 group-hover:underline">{file.title}</div>
                        <div className="text-xs text-slate-500">ขั้นตอน: {file.stepRole}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {allFields.length === 0 && attachedFiles.length === 0 ? (
              <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl w-full">
                ยังไม่มีการออกแบบฟิลด์ข้อมูลในแม่แบบเอกสาร
              </div>
            ) : (
              allFields.map((field: any) => {
                const isMyRole = !field.assignedRole || field.assignedRole === 'ผู้ใช้ทั่วไป (User)' || field.stepRole === 'ผู้ใช้ทั่วไป (User)';
                
                return (
                  <div key={field.id} className="px-2" style={{ width: field.width || '100%' }}>
                    
                    {field.type === 'heading' && (
                      <h2 className="text-2xl font-bold text-slate-800 mt-4 border-b border-slate-200 pb-2">{field.content}</h2>
                    )}
                    
                    {field.type === 'paragraph' && (
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{field.content}</p>
                    )}

                    {field.type === 'image' && field.content && (
                      <div className="flex justify-center mb-4">
                        <img src={field.content} alt="Document Image" className="max-h-32 object-contain" />
                      </div>
                    )}

                    {(field.type === 'input' || field.type === 'date') && (
                      <>
                        <label className={`block text-sm font-bold mb-2 ${isMyRole ? 'text-slate-700' : 'text-slate-400'}`}>
                          {field.label} {isMyRole && field.required && <span className="text-red-500">*</span>}
                          {(!isMyRole) && <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full text-slate-400 bg-slate-100">สำหรับ {field.stepRole}</span>}
                        </label>
                        <input 
                          type={field.type === 'date' ? 'date' : 'text'} 
                          required={isMyRole && field.required}
                          disabled={!isMyRole}
                          placeholder={isMyRole ? (field.placeholder || 'กรอกข้อมูล...') : 'สงวนไว้สำหรับเจ้าหน้าที่...'}
                          value={formData[field.id] || ''}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                          className={`w-full border rounded-lg px-4 py-3 outline-none transition-colors ${isMyRole ? 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white text-slate-800' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
                        />
                      </>
                    )}

                    {field.type === 'signature' && (
                      <div className="mt-4 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-center flex flex-col items-center justify-center min-h-[120px]">
                        <span className="text-2xl mb-2 opacity-50">✍️</span>
                        <p className="text-sm font-bold text-slate-700">{field.label}</p>
                        <p className="text-xs text-slate-400 mt-1">พื้นที่สำหรับลายเซ็น ({field.assignedRole || field.stepRole})</p>
                      </div>
                    )}

                    {(field.type === 'input' || field.type === 'date' || field.type === 'signature') && (
                      <p className="text-xs text-slate-400 mt-1">อ้างอิง: {field.docTitle}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting || (workflow.isLoginRequired && !user)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:shadow-lg disabled:hover:translate-y-0"
            >
              {isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'ส่งเอกสารเพื่อขออนุมัติ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
