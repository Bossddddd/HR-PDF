'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getFormTemplates, deleteFormTemplate } from '@/app/actions/forms';

export default function FormsPage() {
  const [createStep, setCreateStep] = useState(0);
  const [workflowStages, setWorkflowStages] = useState([{ id: 1, role: 'ผู้ใช้ทั่วไป (User)' }]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, title: string } | null>(null);
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    setLoading(true);
    const res = await getFormTemplates();
    if (res.success) setForms(res.forms || []);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteFormTemplate(deleteTarget.id);
    if (res.success) {
      toast.success('ลบแม่แบบฟอร์มสำเร็จ');
      setForms(forms.filter(f => f.id !== deleteTarget.id));
    } else {
      toast.error('เกิดข้อผิดพลาดในการลบ');
    }
    setDeleteTarget(null);
  };

  const handleExportBlank = (form: any) => {
    toast.success(`กำลังเตรียมดาวน์โหลดแบบฟอร์มเปล่า: ${form.title}`, { icon: '🖨️' });
    // TODO: Implement actual PDF generation logic
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">จัดการแม่แบบฟอร์ม</h1>
        <button 
          onClick={() => setCreateStep(1)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          + สร้างฟอร์มชุดใหม่
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400">กำลังโหลดข้อมูล...</div>
      ) : forms.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="text-4xl mb-4">📄</div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">ยังไม่มีแม่แบบฟอร์ม</h2>
          <p className="text-slate-500">คลิก "สร้างฟอร์มชุดใหม่" เพื่อเริ่มต้นสร้างเอกสารของคุณ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map(form => {
            const blocksCount = form.blocksJson ? JSON.parse(form.blocksJson).length : 0;
            return (
              <div key={form.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                    Web Builder
                  </span>
                  <div className="flex gap-2">
                    <button className="text-slate-400 hover:text-blue-600 transition-colors" title="แก้ไข">✏️</button>
                    <button 
                      className="text-slate-400 hover:text-red-600 transition-colors" 
                      title="ลบ"
                      onClick={() => setDeleteTarget({ id: form.id, title: form.title })}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <h2 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2" title={form.title}>{form.title}</h2>
                <div className="text-sm text-slate-500 mb-4 flex-1">
                  จำนวน {blocksCount} ส่วนประกอบ <br/>
                  <span className="text-xs text-slate-400">ถูกตอบกลับ {form._count?.responses || 0} ครั้ง</span>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">บังคับล็อกอิน</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={form.isLoginRequired} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleExportBlank(form)}
                      className="flex-1 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-medium border border-slate-200 transition-colors flex justify-center items-center gap-2 text-sm"
                      title="ดาวน์โหลดแบบฟอร์มเปล่า (PDF)"
                    >
                      🖨️ พิมพ์/โหลด
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`http://localhost:3000/form/${form.id}`);
                        toast.success('คัดลอกลิงก์สำเร็จ', { description: `http://localhost:3000/form/${form.id}` });
                      }}
                      className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium border border-blue-200 transition-colors flex justify-center items-center gap-2 text-sm"
                    >
                      🔗 คัดลอกลิงก์
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">ยืนยันการลบแม่แบบ</h3>
            <p className="text-slate-500 mb-6 text-sm">คุณต้องการลบแบบฟอร์ม <b>{deleteTarget.title}</b> ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้ และอาจส่งผลต่อเอกสารที่ผู้ใช้กำลังกรอกอยู่</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">ยกเลิก</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors">ยืนยันการลบ</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Flow Modal */}
      {createStep > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-3xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setCreateStep(0); setWorkflowStages([{ id: 1, role: 'ผู้ใช้ทั่วไป (User)' }]); }} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
              ✕
            </button>
            
            {createStep === 1 && (
              <>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">1. เลือกวิธีสร้างฟอร์ม</h2>
                <p className="text-slate-500 mb-8">คุณต้องการสร้างแม่แบบฟอร์มด้วยวิธีไหน?</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button onClick={() => { toast.info('ระบบนี้อยู่ใน Phase ถัดไป (PDF Upload)'); }} className="border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 rounded-2xl p-6 text-left transition-all group">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">📄</div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">อัปโหลดไฟล์ PDF</h3>
                    <p className="text-sm text-slate-500">สำหรับไฟล์ PDF (AcroForm) ที่มีช่องกรอกสำเร็จรูปจากภายนอก</p>
                  </button>
                  
                  <button onClick={() => setCreateStep(2)} className="border-2 border-slate-200 hover:border-purple-500 hover:bg-purple-50 rounded-2xl p-6 text-left transition-all group">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">✨</div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">สร้างบนเว็บ (Web Builder)</h3>
                    <p className="text-sm text-slate-500">พิมพ์เอกสาร ตีเส้น แทรกรูป และใส่ตัวแปรด้วยตัวเองบนระบบ</p>
                  </button>
                </div>
              </>
            )}

            {createStep === 2 && (
              <>
                <button onClick={() => setCreateStep(1)} className="text-blue-600 mb-4 hover:underline text-sm font-semibold">&larr; ย้อนกลับ</button>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">2. กำหนดสายอนุมัติ (Workflow)</h2>
                <p className="text-slate-500 mb-8">ตั้งค่าลำดับผู้ที่มีสิทธิ์กรอกและเซ็นเอกสารในแต่ละขั้นตอน (ยืดหยุ่นได้ไม่จำกัด)</p>

                <div className="space-y-4 mb-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {workflowStages.map((stage, index) => (
                    <div key={stage.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 font-bold z-10">
                        {index + 1}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl shadow border border-slate-100 bg-white">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ด่านที่ {index + 1}</span>
                          {index > 0 && (
                            <button onClick={() => setWorkflowStages(workflowStages.filter(s => s.id !== stage.id))} className="text-red-400 hover:text-red-600 text-xs font-semibold">✕ ลบ</button>
                          )}
                        </div>
                        <select 
                          value={stage.role} 
                          onChange={(e) => {
                            const newStages = [...workflowStages];
                            newStages[index].role = e.target.value;
                            setWorkflowStages(newStages);
                          }}
                          disabled={index === 0}
                          className="w-full font-bold text-slate-800 bg-transparent outline-none border-b border-transparent focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                        >
                          <option value="ผู้ใช้ทั่วไป (User)">ผู้ใช้ทั่วไป (User)</option>
                          <option value="หัวหน้างาน / HR">หัวหน้างาน / HR</option>
                          <option value="ผู้จัดการ (Manager)">ผู้จัดการ (Manager)</option>
                          <option value="ผู้บริหาร (Executive)">ผู้บริหาร (Executive)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center mb-8">
                  <button 
                    onClick={() => setWorkflowStages([...workflowStages, { id: Date.now(), role: 'หัวหน้างาน / HR' }])}
                    className="bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm z-10"
                  >
                    + เพิ่มด่านอนุมัติ
                  </button>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-100 mt-8">
                  <button 
                    onClick={() => {
                      localStorage.setItem('tempWorkflow', JSON.stringify(workflowStages));
                      window.location.href = '/admin/forms/builder';
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-2"
                  >
                    บันทึกและไปหน้าออกแบบฟอร์ม <span>&rarr;</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
