'use client';

import { useState, useEffect } from 'react';
import { getAuditLogs } from '@/app/actions/logs';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      const res = await getAuditLogs();
      if (res.success) setLogs(res.logs || []);
      setLoading(false);
    }
    loadLogs();
  }, []);

  return (
    <div className="max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">บันทึกการใช้งาน (Audit Logs)</h1>
        <button className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          Export Logs
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-4">
          <input 
            type="text" 
            placeholder="ค้นหาประวัติการกระทำ..." 
            className="flex-1 min-w-[200px] border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500 bg-white"
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            ค้นหา
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-400">กำลังโหลดข้อมูล...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-slate-400">ยังไม่มีประวัติการใช้งานระบบ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-6 py-4 text-sm font-semibold text-slate-500 whitespace-nowrap">วันเวลา</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-500 whitespace-nowrap">ผู้กระทำ</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-500 whitespace-nowrap">ประเภท (Action)</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-500">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('th-TH')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
                          {log.user.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-800">{log.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        log.action.includes('DELETE') ? 'bg-red-100 text-red-700' :
                        log.action.includes('CREATE') ? 'bg-green-100 text-green-700' :
                        log.action.includes('UPDATE') ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
