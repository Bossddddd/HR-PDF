'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getFormTemplates } from "@/app/actions/forms";

export default function Home() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchForms() {
      const res = await getFormTemplates();
      if (res.success) {
        setForms(res.forms || []);
      }
      setLoading(false);
    }
    fetchForms();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-12 lg:p-24 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              HR<span className="text-blue-600">Forms</span>
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              เลือกระบบฟอร์มที่คุณต้องการกรอกข้อมูล
            </p>
          </div>
          <Link 
            href="/admin" 
            className="bg-white text-slate-700 px-6 py-3 rounded-full font-semibold shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-200"
          >
            ผู้ดูแลระบบ
          </Link>
        </header>

        <main>
          {loading ? (
            <div className="text-center py-20 text-slate-400">
              กำลังโหลดข้อมูลแบบฟอร์ม...
            </div>
          ) : forms.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl text-center shadow-sm border border-slate-100">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <h2 className="text-xl text-slate-700 font-semibold mb-2">ยังไม่มีแม่แบบฟอร์มในระบบ</h2>
              <p className="text-slate-500">กรุณาติดต่อผู้ดูแลระบบเพื่อสร้างแม่แบบเอกสารก่อน</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map(f => {
                const blocksCount = f.blocksJson ? JSON.parse(f.blocksJson).length : 0;
                return (
                  <div 
                    key={f.id} 
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer"
                  >
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-sky-400"></div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <h2 className="text-xl font-bold text-slate-800 mb-2 leading-snug line-clamp-2">{f.title}</h2>
                      <p className="text-slate-500 text-sm mb-6">
                        {f.description || 'แบบฟอร์มอิเล็กทรอนิกส์'} • {blocksCount} ช่องข้อมูล
                      </p>
                      <div className="mt-auto flex flex-col gap-2">
                        <Link 
                          href={`/form/${f.id}`} 
                          className="block text-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white py-3 px-4 rounded-xl font-semibold transition-colors duration-200"
                        >
                          เริ่มกรอกฟอร์ม &rarr;
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(`http://localhost:3000/form/${f.id}`);
                            toast.success('คัดลอกลิงก์สำเร็จ', { description: `http://localhost:3000/form/${f.id}` });
                          }}
                          className="w-full text-center bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 py-2 px-4 rounded-xl font-medium border border-slate-200 transition-colors duration-200"
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
        </main>
        
      </div>
    </div>
  );
}
