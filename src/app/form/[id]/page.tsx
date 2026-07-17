'use client';

import { useState, useEffect, use, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getWorkflowForFilling, submitWorkflowResponse } from '@/app/actions/submit';
import { useRole } from '@/app/context/RoleContext';
import { createSignatureSession, checkSignatureSession } from '@/app/actions/signature';
import { QRCodeSVG } from 'qrcode.react';
import SignatureCanvas from 'react-signature-canvas';

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

  // Signature Modal State
  const [activeSignField, setActiveSignField] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [signMethod, setSignMethod] = useState<'qr' | 'draw'>('qr');
  const sigCanvas = useRef<any>(null);
  const [consent, setConsent] = useState(false);
  


  // Polling for signature completion
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionId && activeSignField) {
      interval = setInterval(async () => {
        const res = await checkSignatureSession(sessionId);
        if (res.success && res.isCompleted && res.imageUrl) {
          handleChange(activeSignField, res.imageUrl);
          closeSignatureModal();
          toast.success('รับลายเซ็นจากมือถือสำเร็จ!');
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [sessionId, activeSignField]);

  const openSignatureModal = async (fieldId: string) => {
    setActiveSignField(fieldId);
    setConsent(false);
    
    // Always pre-generate session for QR code
    const res = await createSignatureSession();
    if (res.success) {
      setSessionId(res.sessionId);
    } else {
      toast.error('ไม่สามารถสร้างเซสชันสำหรับเซ็นชื่อได้');
    }
  };

  const closeSignatureModal = () => {
    setActiveSignField(null);
    setSessionId(null);
  };

  const saveInPlaceSignature = () => {
    if (!consent) {
      toast.error('กรุณากดยินยอมก่อนบันทึกลายเซ็น');
      return;
    }
    if (sigCanvas.current && sigCanvas.current.isEmpty()) {
      toast.error('กรุณาเซ็นลายเซ็นของคุณ');
      return;
    }
    const dataURL = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    handleChange(activeSignField!, dataURL);
    closeSignatureModal();
    toast.success('บันทึกลายเซ็นเรียบร้อยแล้ว');
  };

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

    // Validate all required fields
    for (const field of allFields) {
      const isMyRole = !field.assignedRole || field.assignedRole === 'ผู้ใช้ทั่วไป (User)' || field.stepRole === 'ผู้ใช้ทั่วไป (User)';
      if (isMyRole && (field.type === 'input' || field.type === 'date' || field.type === 'signature' || field.type === 'textarea')) {
        if (!formData[field.id] || formData[field.id].trim() === '') {
          toast.error(`กรุณากรอก/เซ็นข้อมูล: ${field.label || field.id}`);
          return;
        }
      }
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

  // Extract fields from all documents in the workflow
  const { allFields, attachedFiles } = useMemo(() => {
    const fields: any[] = [];
    const files: any[] = [];
    if (!workflow) return { allFields: fields, attachedFiles: files };
    
    const fieldKeys = new Set<string>();
    workflow.steps?.forEach((step: any) => {
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
  }, [workflow]);

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

  return (
    <div className="min-h-screen bg-[#F0EBF8] py-8 px-4 font-sans text-slate-800">
      <div className="max-w-3xl mx-auto space-y-4">
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="h-3 bg-purple-600 w-full"></div>
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-3">{workflow.title}</h1>
            <p className="text-slate-600 text-sm whitespace-pre-wrap">{workflow.description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* User Auto-fill Card */}
          {user?.role?.name !== 'Admin' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <label className="block font-bold mb-3">ชื่อ-นามสกุล ของคุณ (ผู้ส่งเอกสาร) <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={user?.name || ''} 
                disabled 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                ดึงข้อมูลอัตโนมัติจากบัญชีของคุณ
              </p>
            </div>
          )}

          {/* Reference Files Card */}
          {attachedFiles.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">📎</span> ไฟล์เอกสารอ้างอิง
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachedFiles.map(file => (
                  <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group">
                    <div className="text-2xl">📄</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-blue-600 group-hover:underline truncate text-sm">{file.title}</div>
                      <div className="text-xs text-slate-500">ขั้นตอน: {file.stepRole}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Form Fields */}
          {allFields.length === 0 && attachedFiles.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center text-slate-500">
              ไม่มีฟิลด์ข้อมูลที่ต้องกรอกในขั้นตอนนี้
            </div>
          ) : (
            <>
              {allFields.map((field) => {
                const isMyRole = !field.assignedRole || field.assignedRole === 'ผู้ใช้ทั่วไป (User)' || field.stepRole === 'ผู้ใช้ทั่วไป (User)';
                
                return (
                  <div key={field.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all focus-within:border-l-4 focus-within:border-l-purple-500 focus-within:-ml-[3px]">
                    {field.type === 'heading' && <h2 className="text-xl font-bold">{field.content}</h2>}
                    {field.type === 'paragraph' && <p className="text-slate-600">{field.content}</p>}
                    
                    {(field.type === 'input' || field.type === 'date' || field.type === 'signature') && (
                      <label className={`block text-base font-medium mb-3 ${isMyRole ? 'text-slate-800' : 'text-slate-400'}`}>
                        {field.label} {isMyRole && <span className="text-red-500">*</span>}
                        {(!isMyRole) && <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full text-slate-400 bg-slate-100">สำหรับ {field.stepRole}</span>}
                      </label>
                    )}

                    {field.type === 'input' && (
                      <input 
                        type="text" 
                        value={formData[field.id] || ''} 
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        disabled={!isMyRole}
                        className="w-full border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all disabled:bg-slate-50 disabled:text-slate-400"
                        placeholder="กรอกข้อความ..."
                      />
                    )}
                    
                    {field.type === 'textarea' && (
                      <textarea 
                        disabled={!isMyRole}
                        value={formData[field.id] || ''}
                        onChange={e => handleChange(field.id, e.target.value)}
                        placeholder={isMyRole ? "คำตอบของคุณ" : "สงวนไว้สำหรับเจ้าหน้าที่"}
                        rows={3}
                        className={`w-full border-b border-slate-300 px-0 py-2 focus:border-purple-600 focus:outline-none transition-colors bg-transparent resize-none ${isMyRole ? 'text-slate-900 placeholder-slate-400' : 'text-slate-400 cursor-not-allowed border-dashed'}`}
                      />
                    )}
                    
                    {field.type === 'date' && (
                      <input 
                        type="date" 
                        disabled={!isMyRole}
                        value={formData[field.id] || ''}
                        onChange={e => handleChange(field.id, e.target.value)}
                        className={`border-b border-slate-300 px-0 py-2 focus:border-purple-600 focus:outline-none transition-colors bg-transparent ${isMyRole ? 'text-slate-900' : 'text-slate-400 cursor-not-allowed border-dashed'}`}
                      />
                    )}
                    
                    {field.type === 'signature' && (
                      <div className="border border-slate-200 rounded-lg p-6 bg-slate-50 text-center flex flex-col items-center justify-center">
                        {formData[field.id] ? (
                          <div className="relative group cursor-pointer" onClick={() => isMyRole && openSignatureModal(field.id)}>
                            <img src={formData[field.id]} alt="Signature" className="max-h-24 mx-auto mix-blend-multiply" />
                            {isMyRole && (
                              <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md font-medium text-sm">
                                กดเพื่อแก้ไขลายเซ็น
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="text-4xl mb-4 text-slate-300">✍️</div>
                            <button 
                              type="button"
                              onClick={() => openSignatureModal(field.id)}
                              disabled={!isMyRole}
                              className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all"
                            >
                              กดเพื่อเซ็นลายเซ็น
                            </button>
                            <p className="text-xs text-slate-400 mt-3">พื้นที่สำหรับ {field.assignedRole || field.stepRole}</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          <div className="pt-6 flex justify-between items-center">
            <button type="button" onClick={() => router.push('/')} className="text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-md font-medium transition-colors">
              ล้างฟอร์ม (ยกเลิก)
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || (workflow.isLoginRequired && !user)}
              className="bg-purple-600 text-white px-8 py-2.5 rounded-md font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-md"
            >
              {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่ง'}
            </button>
          </div>

        </form>
      </div>

      {/* Signature Modal */}
      {activeSignField && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg text-slate-800">เซ็นลายเซ็นอิเล็กทรอนิกส์</h2>
              <button onClick={closeSignatureModal} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="flex border-b border-slate-200">
              <button 
                onClick={() => setSignMethod('qr')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${signMethod === 'qr' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                📱 สแกน QR Code
              </button>
              <button 
                onClick={() => setSignMethod('draw')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${signMethod === 'draw' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                ✍️ วาดบนหน้าจอนี้
              </button>
            </div>

            <div className="p-6 flex flex-col items-center">
              {signMethod === 'draw' ? (
                // Draw directly in modal
                <div className="w-full">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 relative h-48 mb-4">
                    <SignatureCanvas 
                      ref={sigCanvas}
                      canvasProps={{ className: 'w-full h-full absolute top-0 left-0' }}
                    />
                    <button 
                      onClick={() => sigCanvas.current?.clear()}
                      className="absolute top-2 right-2 text-xs bg-white text-slate-500 px-2 py-1 rounded shadow-sm border border-slate-200"
                    >
                      ล้าง
                    </button>
                  </div>
                  <label className="flex items-start gap-2 mb-4 cursor-pointer">
                    <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1" />
                    <span className="text-xs text-slate-600">ข้าพเจ้ายินยอมให้ใช้ลายเซ็นอิเล็กทรอนิกส์นี้ในการลงนามเอกสารของบริษัท และยืนยันว่าลายเซ็นนี้เป็นของข้าพเจ้าจริง</span>
                  </label>
                  <button onClick={saveInPlaceSignature} disabled={!consent} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50">
                    บันทึกลายเซ็น
                  </button>
                </div>
              ) : (
                // QR Code
                <div className="text-center w-full">
                  <p className="text-slate-600 text-sm mb-6">สแกน QR Code ด้านล่างด้วยโทรศัพท์มือถือ<br/>เพื่อใช้นิ้ววาดลายเซ็นของคุณ (สะดวกและสวยงามกว่า)</p>
                  
                  {sessionId ? (
                    <div className="flex flex-col items-center gap-4 mb-6">
                      <div className="bg-white p-4 inline-block rounded-xl border border-slate-200 shadow-sm">
                        <QRCodeSVG value={`${window.location.origin}/sign-mobile/${sessionId}`} size={200} />
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/sign-mobile/${sessionId}`);
                          toast.success('คัดลอกลิงก์เรียบร้อยแล้ว!');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        🔗 คัดลอกลิงก์สำหรับเปิดในมือถือ
                      </button>
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-slate-400">กำลังสร้าง QR Code...</div>
                  )}

                  <div className="flex items-center justify-center gap-2 text-blue-600 animate-pulse bg-blue-50 py-2 rounded-lg">
                    <span className="text-xl">🔄</span>
                    <span className="text-sm font-bold">กำลังรอรับลายเซ็นจากมือถือ...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
