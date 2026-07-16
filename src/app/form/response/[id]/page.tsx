'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getResponseById, updateResponseStatus, updateResponseData } from '@/app/actions/responses';
import { useRole } from '@/app/context/RoleContext';

export default function ReviewFormPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const responseId = resolvedParams.id;
  const { role } = useRole();
  
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    await updateResponseData(responseId, dataStr, role, `ลงนามโดย ${role}`);

    // Advance workflow status based on current role
    let nextStatus = 'อนุมัติแล้ว';
    if (response.status === 'รอตรวจสอบ' && role === 'หัวหน้างาน / HR') {
      nextStatus = 'รอผู้จัดการอนุมัติ';
    } else if (response.status === 'รอผู้จัดการอนุมัติ' && role === 'ผู้จัดการ (Manager)') {
      nextStatus = 'รอผู้บริหารเซ็น';
    } else if (response.status === 'รอผู้บริหารเซ็น' && role === 'ผู้บริหาร (Executive)') {
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">กำลังโหลดเอกสาร...</div>;
  if (!response || !response.formTemplate) return <div className="min-h-screen flex items-center justify-center bg-slate-50">ไม่พบเอกสาร 404</div>;

  const form = response.formTemplate;
  const blocks = form.blocksJson ? JSON.parse(form.blocksJson) : [];
  const isReadOnly = response.status === 'อนุมัติแล้ว' || response.status === 'ตีกลับ';

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="text-slate-600 font-bold mb-6 hover:underline flex items-center gap-2">
          &larr; กลับ
        </button>

        <div className="bg-white shadow-xl rounded-xl p-8 md:p-12 border border-slate-200 min-h-[1123px] relative flex flex-col gap-6">
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-xl"></div>
          
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
            {blocks.map((block: any) => {
              if (block.type === 'heading') return <h2 key={block.id} className="text-2xl font-bold text-slate-800 mt-4">{block.content}</h2>;
              if (block.type === 'paragraph') return <p key={block.id} className="text-slate-600 leading-relaxed whitespace-pre-wrap">{block.content}</p>;
              
              const isMyRole = block.assignedRole === role && !isReadOnly;
              const hasData = !!formData[block.id];

              if (block.type === 'input') {
                return (
                  <div key={block.id} className="w-full">
                    <label className={`block text-sm font-bold mb-2 ${isMyRole ? 'text-indigo-700' : 'text-slate-500'}`}>
                      {block.label}
                      {block.assignedRole && <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${isMyRole ? 'text-indigo-600 bg-indigo-100' : 'text-slate-500 bg-slate-100'}`}>({block.assignedRole})</span>}
                    </label>
                    <input 
                      type="text" 
                      disabled={!isMyRole}
                      value={formData[block.id] || ''}
                      onChange={(e) => handleChange(block.id, e.target.value)}
                      placeholder={isMyRole ? "กรุณากรอกข้อมูลเพื่อประเมิน..." : ""}
                      className={`w-full border rounded-lg px-4 py-3 outline-none transition-colors ${isMyRole ? 'bg-indigo-50 border-indigo-200 focus:border-indigo-500 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                    />
                  </div>
                );
              }

              if (block.type === 'date') {
                return (
                  <div key={block.id} className="w-full sm:w-1/2">
                    <label className={`block text-sm font-bold mb-2 ${isMyRole ? 'text-indigo-700' : 'text-slate-500'}`}>
                      {block.label}
                      {block.assignedRole && <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${isMyRole ? 'text-indigo-600 bg-indigo-100' : 'text-slate-500 bg-slate-100'}`}>({block.assignedRole})</span>}
                    </label>
                    <input 
                      type="date" 
                      disabled={!isMyRole}
                      value={formData[block.id] || ''}
                      onChange={(e) => handleChange(block.id, e.target.value)}
                      className={`w-full border rounded-lg px-4 py-3 outline-none transition-colors ${isMyRole ? 'bg-indigo-50 border-indigo-200 focus:border-indigo-500 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                    />
                  </div>
                );
              }

              if (block.type === 'signature') {
                return (
                  <div key={block.id} className="mt-8 mb-4">
                    <div className="w-full sm:w-64 flex flex-col">
                      <label className={`block text-sm font-bold mb-2 ${isMyRole ? 'text-indigo-700' : 'text-slate-500'}`}>
                        {block.label}
                        {block.assignedRole && <span className="ml-2 text-xs font-normal">สำหรับ: {block.assignedRole}</span>}
                      </label>
                      <input 
                        type="text" 
                        disabled={!isMyRole}
                        placeholder={isMyRole ? "พิมพ์ชื่อเพื่อเซ็นอนุมัติ" : hasData ? "" : "รอการลงนาม..."}
                        value={formData[block.id] || ''}
                        onChange={(e) => handleChange(block.id, e.target.value)}
                        className={`w-full border rounded-lg px-4 py-3 outline-none text-center italic font-semibold transition-colors ${isMyRole ? 'bg-indigo-50 border-indigo-300 text-indigo-700 focus:border-indigo-600 shadow-inner' : hasData ? 'bg-white border-transparent text-slate-800 text-xl' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                      />
                    </div>
                  </div>
                );
              }
              
              return null;
            })}
          </div>

          {!isReadOnly && (
            <div className="mt-12 pt-8 border-t border-slate-200 flex gap-4 justify-end">
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
