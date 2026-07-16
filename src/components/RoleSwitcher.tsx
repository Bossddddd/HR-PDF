'use client';

import { useState, useEffect } from 'react';
import { useRole } from '@/app/context/RoleContext';

export default function RoleSwitcher() {
  const { user, users, setUser, isLoading } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) return <div className="w-40 h-10 bg-slate-100 animate-pulse rounded-lg"></div>;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 shadow-sm hover:shadow hover:border-blue-300 transition-all min-w-[200px]"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">👤</span>
          <span className="truncate max-w-[140px]">{user ? `${user.name} (${user.role?.name})` : 'เลือกผู้ใช้'}</span>
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            จำลองสลับบัญชีผู้ใช้ (Mock Login)
          </div>
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                setUser(u.username);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between group ${user?.username === u.username ? 'bg-blue-50/50 text-blue-700 font-medium' : 'text-slate-600'}`}
            >
              <div className="flex flex-col">
                <span>{u.name}</span>
                <span className="text-xs text-slate-400 group-hover:text-blue-500 transition-colors">{u.role?.name}</span>
              </div>
              {user?.username === u.username && (
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              )}
            </button>
          ))}
          {users.length === 0 && (
            <div className="px-4 py-2 text-sm text-slate-500 text-center">ยังไม่มีผู้ใช้งานในระบบ</div>
          )}
        </div>
      )}
    </div>
  );
}
