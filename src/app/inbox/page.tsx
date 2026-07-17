'use client';

import { useState, useEffect } from 'react';
import { getResponses } from '@/app/actions/responses';
import { useRole } from '@/app/context/RoleContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function InboxPage() {
  const router = useRouter();
  const { role } = useRole();
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResponses() {
      const res = await getResponses();
      if (res.success) {
        setResponses(res.responses || []);
      }
      setLoading(false);
    }
    loadResponses();
  }, []);

  // Filter logic based on Mock Role
  const pendingItems = responses.filter(r => {
    if (['อนุมัติแล้ว', 'ตีกลับ'].includes(r.status)) return false;
    
    // Admin sees everything pending
    if (role?.name === 'ผู้ดูแลระบบ (Admin)') return true;
    
    // Filter by role responsibility
    if (role?.name === 'หัวหน้างาน / HR' && r.status === 'รอตรวจสอบ') return true;
    if (role?.name === 'ผู้จัดการ (Manager)' && r.status === 'รอผู้จัดการอนุมัติ') return true;
    if (role?.name === 'ผู้บริหาร (Executive)' && r.status === 'รอผู้บริหารเซ็น') return true;
    
    return false;
  });

  const completedItems = responses.filter(r => ['อนุมัติแล้ว', 'ตีกลับ'].includes(r.status));
  const displayItems = activeTab === 'pending' ? pendingItems : completedItems;

  const handleBack = () => {
    // If there's a history, go back. Otherwise go to appropriate dashboard.
    if (window.history.length > 1 && document.referrer) {
      router.back();
    } else {
      router.push(role && role.level >= 40 ? '/admin' : '/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 shrink-0 z-10 shadow-sm sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="mr-2 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
            Inbox
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">กล่องเอกสารของฉัน</h1>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">👤 {role?.name || 'Loading...'}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="flex border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-4 text-center font-bold text-sm transition-all relative ${activeTab === 'pending' ? 'text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              รอฉันดำเนินการ
              {pendingItems.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {pendingItems.length}
                </span>
              )}
              {activeTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-4 text-center font-bold text-sm transition-all relative ${activeTab === 'completed' ? 'text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              ดำเนินการแล้ว
              {activeTab === 'completed' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 rounded-t-full"></div>}
            </button>
          </div>

          <div className="p-4 md:p-6 bg-slate-50/50 min-h-[400px]">
            {loading ? (
              <div className="text-center py-20 text-slate-400">กำลังโหลดกล่องข้อความ...</div>
            ) : displayItems.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">กล่องเอกสารว่างเปล่า</h3>
                <p className="text-slate-500 text-sm">ไม่มีเอกสารที่รอให้คุณ (ตำแหน่ง: {role?.name}) ดำเนินการในขณะนี้</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {displayItems.map(item => (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all hover:border-blue-300 flex flex-col md:flex-row md:items-center gap-4 group">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'รอผู้บริหารเซ็น' ? 'bg-orange-100 text-orange-700' :
                          item.status === 'รอผู้จัดการอนุมัติ' ? 'bg-purple-100 text-purple-700' :
                          item.status === 'รอตรวจสอบ' ? 'bg-yellow-100 text-yellow-700' :
                          item.status === 'อนุมัติแล้ว' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString('th-TH')}</span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-base md:text-lg">
                        {item.workflow?.title || 'เอกสารไม่ระบุชื่อ'}
                      </h3>
                      <p className="text-sm text-slate-500">
                        ส่งโดย: <span className="font-semibold text-slate-700">{item.submitterName}</span>
                      </p>
                    </div>

                    <div className="shrink-0 mt-3 md:mt-0">
                      {activeTab === 'pending' ? (
                        <button onClick={() => router.push(`/form/response/${item.id}`)} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors">
                          เปิดตรวจสอบ & เซ็น
                        </button>
                      ) : (
                        <button onClick={() => router.push(`/form/response/${item.id}`)} className="w-full md:w-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors">
                          ดูประวัติ
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
