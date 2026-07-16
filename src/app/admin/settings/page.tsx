'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [statuses, setStatuses] = useState(['รอตรวจสอบ', 'กำลังดำเนินการ', 'อนุมัติแล้ว', 'ตีกลับ']);
  const [newStatus, setNewStatus] = useState('');

  const handleAddStatus = () => {
    if (newStatus.trim() === '') return;
    if (statuses.includes(newStatus.trim())) {
      toast.error('มีสถานะนี้อยู่ในระบบแล้ว');
      return;
    }
    setStatuses([...statuses, newStatus.trim()]);
    setNewStatus('');
    toast.success('เพิ่มสถานะใหม่สำเร็จ');
  };

  const handleRemoveStatus = (statusToRemove: string) => {
    setStatuses(statuses.filter(s => s !== statusToRemove));
    toast.success(`ลบสถานะ "${statusToRemove}" สำเร็จ`);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 mb-2">
          ตั้งค่าระบบ (System Settings)
        </h1>
        <p className="text-slate-500">ปรับแต่งการทำงานและจัดการข้อมูลพื้นฐานของระบบ</p>
      </div>

      <div className="space-y-8">
        {/* Organization Section */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
              🏢
            </div>
            <h2 className="text-2xl font-bold text-slate-800">ข้อมูลองค์กร</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">ชื่อบริษัท / องค์กร</label>
              <input 
                type="text" 
                defaultValue="บริษัท ตัวอย่าง จำกัด" 
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">โลโก้เริ่มต้น (สำหรับหัวกระดาษ)</label>
              <div className="relative">
                <input 
                  type="file" 
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 opacity-50"></div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
              🔔
            </div>
            <h2 className="text-2xl font-bold text-slate-800">ระบบแจ้งเตือน (Notifications)</h2>
          </div>
          
          <div className="flex flex-col gap-5">
            <label className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50/50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" defaultChecked className="peer sr-only" />
                <div className="w-6 h-6 border-2 border-slate-300 rounded-md peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                  <svg className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                </div>
              </div>
              <div>
                <span className="text-slate-800 font-bold block group-hover:text-blue-600 transition-colors">แจ้งเตือนบนเว็บ (In-app Notification)</span>
                <span className="text-slate-500 text-sm">แสดงจุดแดงแจ้งเตือนเมื่อมีกิจกรรมใหม่ในระบบ</span>
              </div>
            </label>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50/30 rounded-2xl border border-green-100/50 shadow-sm">
              <label className="flex items-start md:items-center gap-4 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-1 md:mt-0">
                  <input type="checkbox" defaultChecked className="peer sr-only" />
                  <div className="w-6 h-6 border-2 border-slate-300 rounded-md peer-checked:bg-green-500 peer-checked:border-green-500 transition-all flex items-center justify-center">
                    <svg className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                  </div>
                </div>
                <div>
                  <span className="text-slate-800 font-bold block flex items-center gap-2">
                    แจ้งเตือนผ่าน LINE Messaging API (Mini App)
                    <span className="bg-green-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full tracking-wider">New</span>
                  </span>
                  <span className="text-slate-500 text-sm mt-0.5 block">ยิงแจ้งเตือนพร้อมลิงก์เปิดหน้าเซ็นเอกสารใน LINE ทันที (รองรับ Approval Workflow)</span>
                </div>
              </label>
              <button 
                onClick={() => toast.success('ส่งข้อความทดสอบเข้า LINE ผ่าน Messaging API สำเร็จ! 📱')}
                className="bg-white hover:bg-green-50 text-green-600 border border-green-200 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shrink-0 flex items-center gap-2 hover:shadow"
              >
                <span>📱</span> ทดสอบส่งแจ้งเตือน
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Admin Profile Section */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                👤
              </div>
              <h2 className="text-2xl font-bold text-slate-800">โปรไฟล์แอดมิน</h2>
            </div>
            <div className="grid gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">ชื่อผู้ดูแลระบบ</label>
                <input 
                  type="text" 
                  defaultValue="Admin User" 
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:bg-white transition-all shadow-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">รหัสผ่าน</label>
                <input 
                  type="password" 
                  placeholder="********" 
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:bg-white transition-all shadow-sm" 
                />
              </div>
            </div>
          </div>

          {/* Document Settings Section */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                📄
              </div>
              <h2 className="text-2xl font-bold text-slate-800">การแสดงผลเอกสาร</h2>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">ฟอนต์เริ่มต้นสำหรับสร้าง PDF</label>
              <div className="relative">
                <select className="w-full appearance-none bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:bg-white transition-all shadow-sm font-medium text-slate-700 cursor-pointer">
                  <option>TH Sarabun New (แนะนำ)</option>
                  <option>อิงจากฟอนต์ในเครื่องผู้ใช้งาน</option>
                  <option>Prompt</option>
                  <option>Sarabun</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">ระบบจะใช้ฟอนต์นี้ในการสร้างไฟล์ PDF ตอนส่งออกเพื่อความสวยงามและเป็นทางการ</p>
            </div>
          </div>
        </div>

        {/* Statuses Section */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2 opacity-50"></div>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
              🏷️
            </div>
            <h2 className="text-2xl font-bold text-slate-800">จัดการป้ายสถานะเอกสาร</h2>
          </div>
          <p className="text-slate-500 mb-6 pl-16">เพิ่ม หรือ ลบ สถานะของเอกสารที่ใช้ในระบบ</p>
          
          <div className="flex flex-wrap gap-3 mb-8 pl-16">
            {statuses.map(status => (
              <div key={status} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:border-indigo-300 hover:shadow transition-all group">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                {status}
                <button 
                  onClick={() => handleRemoveStatus(status)}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 group-hover:bg-red-100 group-hover:text-red-600 transition-colors ml-2"
                  title="ลบสถานะ"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pl-16">
            <input 
              type="text" 
              placeholder="พิมพ์ชื่อสถานะใหม่ที่นี่..." 
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
              className="flex-1 max-w-sm bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm font-medium" 
            />
            <button 
              onClick={handleAddStatus}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <span>+</span> เพิ่มสถานะ
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-12 flex justify-end sticky bottom-6 z-10">
        <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-white/50 flex">
          <button 
            onClick={() => toast.success('บันทึกการตั้งค่าทั้งหมดเรียบร้อยแล้ว')}
            className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
            บันทึกการตั้งค่าระบบ
          </button>
        </div>
      </div>
    </div>
  );
}
