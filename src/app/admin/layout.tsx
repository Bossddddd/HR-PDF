import Link from 'next/link';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-1">Admin Panel</h2>
          <p className="text-xs text-slate-400">ระบบจัดการเอกสาร HR-PDF</p>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          <Link href="/admin" className="block px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            📊 หน้าแรก (Dashboard)
          </Link>
          <Link href="/admin/forms" className="block px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            📄 จัดการแม่แบบฟอร์ม
          </Link>
          <Link href="/admin/responses" className="block px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            📥 คำตอบและเอกสาร
          </Link>
          <Link href="/admin/logs" className="block px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            🕒 บันทึกการใช้งาน (Logs)
          </Link>
          <Link href="/admin/settings" className="block px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            ⚙️ ตั้งค่าระบบ
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <Link href="/" className="block text-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm">
            &larr; กลับหน้าหลักผู้ใช้
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>

    </div>
  );
}
