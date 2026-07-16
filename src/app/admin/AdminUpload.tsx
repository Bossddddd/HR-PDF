'use client';

import { useState, useRef } from 'react';

export default function AdminUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return alert('กรุณากรอกชื่อฟอร์มและเลือกไฟล์ PDF');

    setLoading(true);
    // Simulate upload delay
    setTimeout(() => {
      setLoading(false);
      alert('ยังไม่ได้เชื่อมต่อฐานข้อมูล (Mock UI)\nเพิ่มฟอร์มเข้าสู่ระบบสำเร็จ!');
      setTitle('');
      setFile(null);
    }, 1500);
  };

  return (
    <form onSubmit={handleUpload} className="flex flex-col gap-6 w-full">
      <div>
        <label className="block mb-2 font-semibold text-slate-700">
          ชื่อฟอร์ม / รหัสเอกสาร <span className="text-red-500">*</span>
        </label>
        <input 
          type="text" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          required 
          placeholder="เช่น แบบฟอร์มขอลาหยุด (FM_01)"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
        />
      </div>

      <div>
        <label className="block mb-2 font-semibold text-slate-700">
          ไฟล์ PDF (Fillable AcroForm) <span className="text-red-500">*</span>
        </label>
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            file ? 'border-green-400 bg-green-50 hover:bg-green-100' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          {file ? (
            <div className="text-slate-800 font-medium flex flex-col items-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-green-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              {file.name}
              <p className="text-sm text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="text-slate-500 flex flex-col items-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              </div>
              <span className="font-medium text-slate-600">คลิกเพื่อเลือกไฟล์ PDF</span>
              <p className="text-sm mt-1">หรือลากไฟล์มาวางที่นี่</p>
            </div>
          )}
        </div>
        <input 
          type="file" 
          accept="application/pdf" 
          ref={fileInputRef}
          onChange={e => setFile(e.target.files?.[0] || null)} 
          required 
          className="hidden"
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className={`mt-4 w-full py-4 rounded-xl font-bold text-white text-lg transition-all shadow-sm ${
          loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            กำลังประมวลผล...
          </span>
        ) : 'อัปโหลดฟอร์มและวิเคราะห์ช่องกรอก'}
      </button>
    </form>
  );
}
