'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getWorkflows, createWorkflow, deleteWorkflow } from '@/app/actions/workflows';
import { getDocuments } from '@/app/actions/documents';
import { getRoles } from '@/app/actions/roles';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoginRequired, setIsLoginRequired] = useState(false);
  const [steps, setSteps] = useState([{ id: Date.now(), roleName: 'ผู้ใช้ทั่วไป (User)', documentId: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [availableDocs, setAvailableDocs] = useState<any[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, title: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [wfRes, docRes, roleRes] = await Promise.all([
      getWorkflows(),
      getDocuments(),
      getRoles()
    ]);
    if (wfRes.success) setWorkflows(wfRes.workflows || []);
    if (docRes.success) setAvailableDocs(docRes.documents || []);
    if (roleRes.success) setAvailableRoles(roleRes.roles || []);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate steps
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].documentId) {
        toast.error(`กรุณาเลือกเอกสารในด่านที่ ${i + 1}`);
        return;
      }
    }

    setIsSubmitting(true);
    const formattedSteps = steps.map((s, index) => ({
      orderIndex: index + 1,
      roleName: s.roleName,
      documentId: s.documentId
    }));

    const res = await createWorkflow({ title, description, isLoginRequired, steps: formattedSteps });
    
    if (res.success) {
      toast.success('สร้างสายอนุมัติสำเร็จ');
      loadData();
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setIsLoginRequired(false);
      setSteps([{ id: Date.now(), roleName: 'ผู้ใช้ทั่วไป (User)', documentId: '' }]);
    } else {
      toast.error(res.error || 'เกิดข้อผิดพลาด');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteWorkflow(deleteTarget.id);
    if (res.success) {
      toast.success('ลบสายอนุมัติสำเร็จ');
      setWorkflows(workflows.filter(w => w.id !== deleteTarget.id));
    } else {
      toast.error('เกิดข้อผิดพลาดในการลบ');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">จัดการสายอนุมัติ (Workflows)</h1>
          <p className="text-slate-500 mt-2">ผูกแม่แบบเอกสารเข้ากับลำดับขั้นการอนุมัติ</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all"
        >
          + สร้างสายอนุมัติใหม่
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400">กำลังโหลดข้อมูล...</div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-4xl mb-4">📄</div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">ยังไม่มีสายอนุมัติ</h2>
          <p className="text-slate-500">คลิก "สร้างสายอนุมัติใหม่" เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map(wf => (
            <div key={wf.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${wf.isLoginRequired ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                  {wf.isLoginRequired ? 'บังคับล็อกอิน' : 'กรอกได้ทุกคน'}
                </span>
                <button 
                  className="text-slate-400 hover:text-red-600 transition-colors p-1" 
                  onClick={() => setDeleteTarget({ id: wf.id, title: wf.title })}
                >
                  ✕
                </button>
              </div>
              
              <h2 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2" title={wf.title}>{wf.title}</h2>
              <div className="text-sm text-slate-500 mb-4 flex-1">
                {wf.description || 'ไม่มีคำอธิบาย'}
              </div>

              <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ลำดับเอกสาร</div>
                {wf.steps.map((step: any, idx: number) => (
                  <div key={step.id} className="flex items-center gap-2 text-sm bg-white border border-slate-200 p-2 rounded-lg">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">{idx + 1}</span>
                    <span className="font-semibold text-slate-700 truncate w-24">{step.roleName}</span>
                    <span className="text-slate-400 text-xs truncate">&rarr; {step.document?.title || 'Unknown Doc'}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 mt-auto">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`http://localhost:3000/form/${wf.id}`);
                    toast.success('คัดลอกลิงก์สำเร็จ', { description: `http://localhost:3000/form/${wf.id}` });
                  }}
                  className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors flex justify-center items-center gap-2 text-sm"
                >
                  🔗 คัดลอกลิงก์ให้พนักงาน
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">ยืนยันการลบ</h3>
            <p className="text-slate-500 mb-6 text-sm">คุณต้องการลบสายอนุมัติ <b>{deleteTarget.title}</b> ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">ยกเลิก</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors">ลบทิ้ง</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
              <h3 className="font-bold text-xl text-slate-800">สร้างสายอนุมัติใหม่</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-8">
              {/* ข้อมูลพื้นฐาน */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">1. ข้อมูลพื้นฐาน</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">ชื่อสายอนุมัติ <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors"
                      placeholder="เช่น ใบเบิกค่าเดินทาง"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">คำอธิบาย</label>
                    <input 
                      type="text" 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors"
                      placeholder="เช่น แบบฟอร์มสำหรับเบิกค่าเดินทางไปปฏิบัติงาน"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input 
                    type="checkbox" 
                    checked={isLoginRequired}
                    onChange={e => setIsLoginRequired(e.target.checked)}
                    className="w-5 h-5 border-slate-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-slate-700">บังคับพนักงานล็อกอินก่อนกรอก (ห้ามคนนอกเข้า)</span>
                </label>
              </div>

              {/* ลำดับขั้น */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">2. กำหนดเอกสารแต่ละด่านอนุมัติ</h4>
                <p className="text-sm text-slate-500 mb-4">
                  ผู้กรอกในด่านที่ 1 จะต้องเป็นคนกรอกฟอร์มหลักเสมอ ส่วนด่านถัดไปคือผู้อนุมัติที่จะเซ็นลงในเอกสาร
                </p>

                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={step.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">ผู้รับผิดชอบ (Role)</label>
                          <select 
                            value={step.roleName}
                            onChange={(e) => {
                              const newSteps = [...steps];
                              newSteps[index].roleName = e.target.value;
                              setSteps(newSteps);
                            }}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 bg-white font-semibold text-slate-700"
                          >
                            {availableRoles.map(r => (
                              <option key={r.id} value={r.name}>{r.name}</option>
                            ))}
                            {availableRoles.length === 0 && (
                              <>
                                <option value="ผู้ใช้ทั่วไป (User)">ผู้ใช้ทั่วไป (User)</option>
                                <option value="หัวหน้างาน (Manager)">หัวหน้างาน (Manager)</option>
                              </>
                            )}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">ใช้เอกสาร (Document)</label>
                          <select 
                            value={step.documentId}
                            onChange={(e) => {
                              const newSteps = [...steps];
                              newSteps[index].documentId = e.target.value;
                              setSteps(newSteps);
                            }}
                            className={`w-full border rounded-lg px-3 py-2 outline-none focus:border-blue-500 bg-white ${!step.documentId ? 'border-red-300 text-red-500' : 'border-slate-300 text-slate-700 font-semibold'}`}
                            required
                          >
                            <option value="">-- เลือกเอกสารจากคลัง --</option>
                            {availableDocs.map(doc => (
                              <option key={doc.id} value={doc.id}>{doc.title} ({doc.type})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {index > 0 && (
                        <button 
                          type="button"
                          onClick={() => setSteps(steps.filter(s => s.id !== step.id))}
                          className="mt-6 text-red-400 hover:text-red-600 p-2 bg-white rounded-lg border border-slate-200 shadow-sm"
                          title="ลบด่านนี้"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button 
                  type="button"
                  onClick={() => setSteps([...steps, { id: Date.now(), roleName: availableRoles.length > 0 ? availableRoles[0].name : 'หัวหน้างาน (Manager)', documentId: '' }])}
                  className="mt-4 w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  + เพิ่มด่านอนุมัติใหม่
                </button>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white pb-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกสายอนุมัติ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
