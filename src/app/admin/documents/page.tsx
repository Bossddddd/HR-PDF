'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDocuments, createDocument, deleteDocument } from '@/app/actions/documents';
import { parseDocument } from '@/app/actions/parseDocument';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('canvas'); // 'canvas' or 'file'
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    const res = await getDocuments();
    if (res.success) {
      setDocuments(res.documents);
    } else {
      toast.error('โหลดข้อมูลล้มเหลว');
    }
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Default content for canvas
    let contentJson = type === 'canvas' ? JSON.stringify([]) : undefined;
    let fileUrl = undefined;

    if (type === 'file') {
      if (!file) {
        toast.error('กรุณาเลือกไฟล์');
        setIsSubmitting(false);
        return;
      }
      toast.loading('กำลังอัปโหลดและแสกนเอกสาร...', { id: 'upload_doc' });
      const formData = new FormData();
      formData.append('file', file);
      
      const parseRes = await parseDocument(formData);
      
      if (parseRes.success) {
        fileUrl = parseRes.url;
        
        // Check extracted fields
        const fields = parseRes.extractedFields || [];
        if (fields.length > 0) {
          toast.success(`อัปโหลดสำเร็จ! แสกนพบ ${fields.length} ช่อง: ${fields.join(', ')}`, { id: 'upload_doc', duration: 5000 });
          
          // Convert fields to Canvas blocks
          const blocks = fields.map((f: string) => ({
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: f.toLowerCase().includes('date') || f.toLowerCase().includes('วัน') ? 'date' : 
                  f.toLowerCase().includes('sign') || f.toLowerCase().includes('เซ็น') ? 'signature' : 'input',
            width: '100%',
            label: f,
            required: false
          }));
          contentJson = JSON.stringify(blocks);
          
        } else {
          toast.warning('อัปโหลดสำเร็จ แต่ไม่พบช่องสำหรับกรอกข้อมูล (เอกสารนี้จะให้อ่านอย่างเดียว)', { id: 'upload_doc', duration: 5000 });
          contentJson = JSON.stringify([]);
        }
        
      } else {
        toast.error('อัปโหลดไฟล์ไม่สำเร็จ: ' + parseRes.error, { id: 'upload_doc' });
        setIsSubmitting(false);
        return;
      }
    }

    const res = await createDocument({
      title,
      description,
      type,
      contentJson,
      fileUrl
    });

    if (res.success) {
      toast.success('สร้างเอกสารเรียบร้อยแล้ว');
      fetchDocuments();
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setFile(null);
    } else {
      toast.error(res.error || 'เกิดข้อผิดพลาด');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณต้องการลบเอกสารนี้ใช่หรือไม่?')) return;
    
    const res = await deleteDocument(id);
    if (res.success) {
      toast.success('ลบเอกสารสำเร็จ');
      setDocuments(documents.filter(d => d.id !== id));
    } else {
      toast.error(res.error || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">คลังแม่แบบเอกสาร (Document Library)</h1>
          <p className="text-slate-500 mt-2">จัดการแม่แบบ PDF และ Canvas สำหรับใช้ในสายอนุมัติ</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all"
        >
          + เพิ่มแม่แบบเอกสาร
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400">กำลังโหลด...</div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            📑
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">ยังไม่มีแม่แบบเอกสาร</h2>
          <p className="text-slate-500">กดปุ่มเพิ่มด้านบนเพื่อสร้างแม่แบบเอกสารชิ้นแรก</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  doc.type === 'canvas' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {doc.type === 'canvas' ? 'Canvas' : 'PDF File'}
                </div>
                <button onClick={() => handleDelete(doc.id)} className="text-red-400 hover:text-red-600 p-1">
                  ✕
                </button>
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-1">{doc.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">{doc.description || 'ไม่มีคำอธิบาย'}</p>
              
              <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                {doc.type === 'canvas' ? (
                  <Link href={`/admin/documents/${doc.id}`} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 rounded-lg font-medium text-sm transition-colors border border-slate-200 text-center block">
                    ออกแบบฟิลด์ข้อมูล
                  </Link>
                ) : (
                  <a href={doc.fileUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 rounded-lg font-medium text-sm transition-colors border border-slate-200 text-center block">
                    ดาวน์โหลดไฟล์อ้างอิง
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">สร้างแม่แบบเอกสาร</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">ชื่อเอกสาร</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">คำอธิบาย</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">ประเภทเอกสาร</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`border rounded-xl p-3 flex flex-col items-center cursor-pointer transition-colors ${type === 'canvas' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="type" value="canvas" checked={type === 'canvas'} onChange={() => setType('canvas')} className="sr-only" />
                    <span className="text-xl mb-1">📝</span>
                    <span className={`text-sm font-medium ${type === 'canvas' ? 'text-blue-700' : 'text-slate-600'}`}>Canvas (สร้างในเว็บ)</span>
                  </label>
                  <label className={`border rounded-xl p-3 flex flex-col items-center cursor-pointer transition-colors ${type === 'file' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="type" value="file" checked={type === 'file'} onChange={() => setType('file')} className="sr-only" />
                    <span className="text-xl mb-1">📄</span>
                    <span className={`text-sm font-medium ${type === 'file' ? 'text-blue-700' : 'text-slate-600'}`}>อัปโหลดไฟล์ (PDF/Word)</span>
                  </label>
                </div>
              </div>
              
              {type === 'file' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">เลือกไฟล์อ้างอิง</label>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500 bg-slate-50 text-sm"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">รองรับไฟล์ .pdf, .doc, .docx (พนักงานสามารถดาวน์โหลดไปใช้งานได้)</p>
                </div>
              )}
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
