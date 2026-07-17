'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getResponses, updateResponseStatus, deleteResponse } from '@/app/actions/responses';

export default function ResponsesPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, user: string } | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    setLoading(true);
    const res = await getResponses();
    if (res.success) {
      setResponses(res.responses || []);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: string, userName: string) => {
    const res = await updateResponseStatus(id, newStatus);
    if (res.success) {
      toast.success(`เปลี่ยนสถานะเอกสารของ ${userName} เป็น: ${newStatus}`);
      loadResponses(); // Reload to reflect changes
    } else {
      toast.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'รอตรวจสอบ': return 'bg-yellow-100 text-yellow-700';
      case 'รอสัมภาษณ์': return 'bg-purple-100 text-purple-700';
      case 'รอผู้บริหารเซ็น': return 'bg-orange-100 text-orange-700';
      case 'อนุมัติแล้ว': return 'bg-green-100 text-green-700';
      case 'ตีกลับ': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // Group responses by status for Kanban view
  const columns = ['รอตรวจสอบ', 'รอสัมภาษณ์', 'รอผู้บริหารเซ็น', 'อนุมัติแล้ว', 'ตีกลับ'];
  const kanbanData: Record<string, any[]> = {};
  columns.forEach(col => kanbanData[col] = []);
  responses.forEach(res => {
    if (kanbanData[res.status]) {
      kanbanData[res.status].push(res);
    } else {
      // If status is not in columns, put it in the first column or a misc column
      kanbanData['รอตรวจสอบ'].push(res); 
    }
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">จัดการคำตอบและเอกสาร</h1>
        <div className="flex gap-2 items-center">
          <div className="bg-slate-200 p-1 rounded-lg flex gap-1 mr-4">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
            >
              รายการ (List)
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
            >
              กระดาน (Kanban)
            </button>
          </div>
          <button className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Print List
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            Export to Excel
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-4 items-center">
        <input 
          type="text" 
          placeholder="ค้นหาชื่อผู้ส่ง หรือชื่อฟอร์ม..." 
          className="flex-1 min-w-[200px] border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
        />
        <select className="border border-slate-200 rounded-lg px-4 py-2 outline-none">
          <option>ทุกสถานะ</option>
          <option>รอตรวจสอบ</option>
          <option>อนุมัติแล้ว</option>
          <option>ตีกลับ</option>
        </select>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          ค้นหา
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400">กำลังโหลดข้อมูล...</div>
      ) : responses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="text-4xl mb-4">📥</div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">ยังไม่มีคนส่งเอกสาร</h2>
          <p className="text-slate-500">เอกสารที่มีคนตอบกลับจะแสดงที่นี่</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {responses.map(res => (
            <div key={res.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <select 
                  value={res.status}
                  className={`px-3 py-1 rounded-full text-xs font-bold appearance-none cursor-pointer outline-none shadow-sm border border-transparent hover:border-slate-300 transition-colors ${getStatusStyle(res.status)}`}
                  onChange={(e) => handleStatusChange(res.id, e.target.value, res.submitterName)}
                >
                  <option value="รอตรวจสอบ">รอตรวจสอบ</option>
                  <option value="รอสัมภาษณ์">รอสัมภาษณ์</option>
                  <option value="รอผู้บริหารเซ็น">รอผู้บริหารเซ็น</option>
                  <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
                  <option value="ตีกลับ">ตีกลับ</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center px-1 text-slate-500 opacity-50">
                  <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>

              <div className="mb-4 pt-2">
                <span className="text-xs font-semibold text-slate-400 block mb-1">ชื่อผู้ส่ง (Submitter)</span>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {res.submitterName.charAt(0)}
                  </div>
                  {res.submitterName}
                </h2>
              </div>
              
              <div className="flex-1 bg-slate-50 rounded-xl p-4 mb-4">
                <div className="text-sm font-semibold text-slate-700 mb-1 line-clamp-1">{res.workflow?.title}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  📅 {new Date(res.createdAt).toLocaleString('th-TH')}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => router.push(`/form/response/${res.id}`)} className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors text-sm border border-blue-200">
                  📄 ดูข้อมูล / ปรินต์
                </button>
                <button 
                  onClick={() => setDeleteTarget({ id: res.id, user: res.submitterName })}
                  className="px-3 py-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors border border-slate-200 hover:border-red-200"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Kanban View */
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
          {columns.map(status => (
            <div key={status} className="bg-slate-100/50 rounded-2xl p-4 min-w-[320px] max-w-[320px] shrink-0 snap-start border border-slate-200/60 flex flex-col h-[calc(100vh-280px)]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${getStatusStyle(status).split(' ')[0]}`}></span>
                  {status}
                </h3>
                <span className="bg-white text-slate-500 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                  {kanbanData[status].length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {kanbanData[status].map(res => (
                  <div key={res.id} onClick={() => router.push(`/form/response/${res.id}`)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm font-bold text-slate-800 line-clamp-2">{res.workflow?.title}</div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {res.submitterName.charAt(0)}
                      </div>
                      <div className="text-xs font-medium text-slate-600 truncate">{res.submitterName}</div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                      <div className="text-[10px] text-slate-400">
                        {new Date(res.createdAt).toLocaleDateString('th-TH')}
                      </div>
                      <select 
                        onClick={(e) => e.stopPropagation()}
                        value={res.status}
                        className="opacity-0 group-hover:opacity-100 text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 outline-none cursor-pointer transition-opacity"
                        onChange={(e) => handleStatusChange(res.id, e.target.value, res.submitterName)}
                      >
                        {columns.map(c => (
                          <option key={c} value={c}>ย้ายไป: {c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {kanbanData[status].length === 0 && (
                  <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-sm font-medium text-slate-400">
                    วางเอกสารที่นี่
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">ยืนยันการลบเอกสาร</h3>
            <p className="text-slate-500 mb-6 text-sm">คุณต้องการลบเอกสารของ <b>{deleteTarget.user}</b> ใช่หรือไม่? (การกระทำนี้ลบจากฐานข้อมูลถาวร)</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">ยกเลิก</button>
              <button 
                onClick={async () => {
                  const res = await deleteResponse(deleteTarget.id);
                  if (res.success) {
                    toast.success('ลบเอกสารสำเร็จ');
                    loadResponses();
                  } else {
                    toast.error('เกิดข้อผิดพลาดในการลบเอกสาร');
                  }
                  setDeleteTarget(null);
                }} 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
