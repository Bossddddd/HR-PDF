'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getFormTemplateById, submitFormResponse } from '@/app/actions/submit';

export default function FillFormPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const formId = resolvedParams.id;
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitterName, setSubmitterName] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadForm() {
      const res = await getFormTemplateById(formId);
      if (res.success && res.form) {
        setForm(res.form);
      } else {
        toast.error('ไม่พบแบบฟอร์มในระบบ');
      }
      setLoading(false);
    }
    loadForm();
  }, [formId]);

  const handleChange = (blockId: string, value: string) => {
    setFormData(prev => ({ ...prev, [blockId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitterName.trim()) {
      toast.error('กรุณากรอกชื่อ-นามสกุลของคุณ');
      return;
    }

    setIsSubmitting(true);
    const dataJson = JSON.stringify(formData);
    const res = await submitFormResponse(formId, submitterName, dataJson);
    
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

  if (!form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <h1 className="text-3xl mb-2">📄 404</h1>
        <p className="text-slate-500">ไม่พบเอกสารที่คุณต้องการ</p>
      </div>
    );
  }

  const blocks = form.blocksJson ? JSON.parse(form.blocksJson) : [];

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="text-blue-600 font-bold mb-6 hover:underline flex items-center gap-2">
          &larr; กลับไปหน้าหลัก
        </button>

        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-xl p-8 md:p-12 border border-slate-200 min-h-[1123px] relative flex flex-col gap-6">
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-xl"></div>
          
          <div className="mb-8 border-b border-slate-200 pb-8">
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">{form.title}</h1>
            <p className="text-slate-500">{form.description}</p>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-6">
            <label className="block text-sm font-bold text-blue-900 mb-2">ชื่อ-นามสกุล ของคุณ (ผู้ส่งเอกสาร) <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              placeholder="กรอกชื่อของคุณเพื่อใช้เป็นลายเซ็นเบื้องต้น"
              className="w-full bg-white border border-blue-200 rounded-lg px-4 py-3 outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          <div className="flex-1 flex flex-col gap-6">
            {blocks.map((block: any) => {
              if (block.type === 'heading') return <h2 key={block.id} className="text-2xl font-bold text-slate-800 mt-4">{block.content}</h2>;
              if (block.type === 'paragraph') return <p key={block.id} className="text-slate-600 leading-relaxed whitespace-pre-wrap">{block.content}</p>;
              
              if (block.type === 'input') {
                const isMyRole = !block.assignedRole || block.assignedRole === 'ผู้ใช้ทั่วไป (User)';
                return (
                  <div key={block.id} className="w-full">
                    <label className={`block text-sm font-bold mb-2 ${isMyRole ? 'text-slate-700' : 'text-slate-400'}`}>
                      {block.label} {isMyRole && block.required && <span className="text-red-500">*</span>}
                      {block.assignedRole && <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${isMyRole ? 'text-indigo-500 bg-indigo-50' : 'text-slate-400 bg-slate-100'}`}>({block.assignedRole})</span>}
                    </label>
                    <input 
                      type="text" 
                      required={isMyRole && block.required}
                      disabled={!isMyRole}
                      placeholder={isMyRole ? (block.placeholder || 'กรอกข้อมูล...') : 'สงวนไว้สำหรับเจ้าหน้าที่...'}
                      value={formData[block.id] || ''}
                      onChange={(e) => handleChange(block.id, e.target.value)}
                      className={`w-full border rounded-lg px-4 py-3 outline-none transition-colors ${isMyRole ? 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white text-slate-800' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
                    />
                  </div>
                );
              }

              if (block.type === 'date') {
                const isMyRole = !block.assignedRole || block.assignedRole === 'ผู้ใช้ทั่วไป (User)';
                return (
                  <div key={block.id} className="w-full sm:w-1/2">
                    <label className={`block text-sm font-bold mb-2 ${isMyRole ? 'text-slate-700' : 'text-slate-400'}`}>
                      {block.label} {isMyRole && block.required && <span className="text-red-500">*</span>}
                      {block.assignedRole && <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${isMyRole ? 'text-indigo-500 bg-indigo-50' : 'text-slate-400 bg-slate-100'}`}>({block.assignedRole})</span>}
                    </label>
                    <input 
                      type="date" 
                      required={isMyRole && block.required}
                      disabled={!isMyRole}
                      value={formData[block.id] || ''}
                      onChange={(e) => handleChange(block.id, e.target.value)}
                      className={`w-full border rounded-lg px-4 py-3 outline-none transition-colors ${isMyRole ? 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white text-slate-800' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
                    />
                  </div>
                );
              }

              if (block.type === 'signature') {
                const isMyRole = !block.assignedRole || block.assignedRole === 'ผู้ใช้ทั่วไป (User)';
                return (
                  <div key={block.id} className="mt-8 mb-4">
                    <div className="w-full sm:w-64 flex flex-col">
                      <label className={`block text-sm font-bold mb-2 ${isMyRole ? 'text-slate-700' : 'text-slate-400'}`}>
                        {block.label} {isMyRole && block.required && <span className="text-red-500">*</span>}
                        {block.assignedRole && <span className="ml-2 text-xs font-normal">สำหรับ: {block.assignedRole}</span>}
                      </label>
                      <input 
                        type="text" 
                        required={isMyRole && block.required}
                        disabled={!isMyRole}
                        placeholder={isMyRole ? "พิมพ์ชื่อ-นามสกุลเพื่อเซ็น" : "รอการลงนาม..."}
                        value={formData[block.id] || ''}
                        onChange={(e) => handleChange(block.id, e.target.value)}
                        className={`w-full border rounded-lg px-4 py-3 outline-none text-center italic font-semibold transition-colors ${isMyRole ? 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white text-blue-700' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
                      />
                    </div>
                  </div>
                );
              }
              
              return null;
            })}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 flex justify-end">
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`${isSubmitting ? 'bg-slate-400' : 'bg-green-600 hover:bg-green-700'} text-white px-10 py-4 rounded-xl font-bold shadow-lg transition-all text-lg`}
            >
              {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ยื่นส่งเอกสาร'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
