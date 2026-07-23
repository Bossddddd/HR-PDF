'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { useRole } from '@/app/context/RoleContext';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { role } = useRole();
  const level = role?.level || 0;
  
  let perms: string[] = [];
  try {
    perms = typeof role?.permissions === 'string' ? JSON.parse(role.permissions) : (role?.permissions || []);
  } catch (e) {
    perms = [];
  }

  const hasPerm = (p: string) => level >= 100 || perms.includes(p);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <RoleGuard requiredLevel={40}>
      <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 relative">
        
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar Navigation */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white mb-1">Admin Panel</h2>
            <p className="text-xs text-slate-400 mb-4">ระบบจัดการเอกสาร HR-PDF</p>
            <Link href="/" className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-semibold border border-slate-700">
              <span>←</span> กลับหน้าหลักผู้ใช้
            </Link>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar" onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) {
              setIsSidebarOpen(false);
            }
          }}>
            <Link href="/inbox" className="block px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
              📥 กล่องข้อความ (Inbox)
            </Link>
            
            {hasPerm('admin_dashboard') && (
              <Link href="/admin" className="block px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                📊 หน้าแรก (Dashboard)
              </Link>
            )}
            
            {hasPerm('admin_workflows') && (
              <Link href="/admin/forms" className="block px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                📄 จัดการสายอนุมัติ (Workflows)
              </Link>
            )}
            
            {hasPerm('admin_documents') && (
              <Link href="/admin/documents" className="block px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                📑 คลังแม่แบบเอกสาร (Docs)
              </Link>
            )}

            {hasPerm('admin_users') && (
              <Link href="/admin/users" className="block px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                🧑‍💼 จัดการพนักงาน (Users)
              </Link>
            )}
            
            {hasPerm('admin_roles') && (
              <Link href="/admin/roles" className="block px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                👥 จัดการสิทธิ์ (Roles)
              </Link>
            )}
            
            {hasPerm('admin_responses') && (
              <Link href="/admin/responses" className="block px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                📥 คำตอบและเอกสาร
              </Link>
            )}
            
            {hasPerm('admin_logs') && (
              <Link href="/admin/logs" className="block px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                🕒 บันทึกการใช้งาน (Logs)
              </Link>
            )}
            
            {hasPerm('admin_settings') && (
              <Link href="/admin/settings" className="block px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                ⚙️ ตั้งค่าระบบ
              </Link>
            )}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
          
          {/* Mobile Header */}
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
            <div className="font-extrabold text-slate-800 text-lg">Admin Panel</div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </div>
        </main>

      </div>
    </RoleGuard>
  );
}
