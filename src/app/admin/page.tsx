import prisma from '@/lib/prisma';
import Link from 'next/link';

export const revalidate = 0; // Disable caching to always show latest stats

export default async function AdminDashboard() {
  // Fetch stats directly from Database
  const totalResponses = await prisma.formResponse.count();
  
  const pendingCount = await prisma.formResponse.count({
    where: {
      status: {
        notIn: ['อนุมัติแล้ว', 'ตีกลับ']
      }
    }
  });

  const completedCount = await prisma.formResponse.count({
    where: {
      status: 'อนุมัติแล้ว'
    }
  });

  const rejectedCount = await prisma.formResponse.count({
    where: {
      status: 'ตีกลับ'
    }
  });

  const totalTemplates = await prisma.formTemplate.count();

  // Fetch recent pending actions
  const urgentTasks = await prisma.formResponse.findMany({
    where: {
      status: {
        in: ['รอตรวจสอบ', 'รอผู้บริหารเซ็น']
      }
    },
    include: {
      formTemplate: { select: { title: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Dashboard สรุปข้อมูลสถิติ</h1>
      
      {/* Filters (UI Only for now) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-8 flex gap-4">
        <select className="border border-slate-200 rounded-lg px-4 py-2 bg-slate-50 outline-none">
          <option>ทั้งหมด (All Time)</option>
        </select>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">นำไปใช้</button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="text-slate-500 mb-1 font-medium">เอกสารที่มีคนตอบกลับ</div>
          <div className="text-4xl font-bold text-slate-800 mt-2">{totalResponses}</div>
        </div>
        <div className="bg-yellow-50 p-6 rounded-2xl shadow-sm border border-yellow-200 flex flex-col justify-between">
          <div className="text-yellow-700 mb-1 font-medium">กำลังดำเนินการ (Pending)</div>
          <div className="text-4xl font-bold text-yellow-800 mt-2">{pendingCount}</div>
        </div>
        <div className="bg-green-50 p-6 rounded-2xl shadow-sm border border-green-200 flex flex-col justify-between">
          <div className="text-green-700 mb-1 font-medium">อนุมัติเรียบร้อย (Completed)</div>
          <div className="text-4xl font-bold text-green-800 mt-2">{completedCount}</div>
        </div>
        <div className="bg-purple-50 p-6 rounded-2xl shadow-sm border border-purple-200 flex flex-col justify-between">
          <div className="text-purple-700 mb-1 font-medium">แม่แบบฟอร์มในระบบ</div>
          <div className="text-4xl font-bold text-purple-800 mt-2">{totalTemplates}</div>
        </div>
      </div>

      {/* Action Required */}
      <h2 className="text-xl font-bold text-slate-800 mb-4">งานที่ต้องจัดการด่วน (Action Required)</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {urgentTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">ไม่มีงานค้างที่ต้องอนุมัติ</h3>
            <p className="text-slate-500">ทุกคนทำงานเรียบร้อยดีเยี่ยม!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {urgentTasks.map(task => (
              <div key={task.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${task.status === 'รอผู้บริหารเซ็น' ? 'bg-orange-500' : 'bg-yellow-500'}`}></div>
                  <div>
                    <h4 className="font-bold text-slate-800">{task.formTemplate?.title}</h4>
                    <p className="text-sm text-slate-500">ส่งโดย: {task.submitterName} • {new Date(task.createdAt).toLocaleString('th-TH')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${task.status === 'รอผู้บริหารเซ็น' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {task.status}
                  </span>
                  <Link href="/admin/responses" className="text-blue-600 hover:text-blue-800 font-semibold text-sm bg-blue-50 px-4 py-2 rounded-lg transition-colors">
                    ไปจัดการ &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
