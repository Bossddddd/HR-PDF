'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { getDocumentById, updateDocumentContent } from '@/app/actions/documents';
import { getRoles } from '@/app/actions/roles';
import { uploadImage } from '@/app/actions/upload';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type BlockType = 'heading' | 'paragraph' | 'image' | 'input' | 'date' | 'signature';
type BlockWidth = '100%' | '50%' | '33.33%' | '25%';

interface Block {
  id: string;
  type: BlockType;
  width: BlockWidth;
  content?: string;
  label?: string;
  placeholder?: string;
  assignedRole?: string;
  required?: boolean;
  x?: number; // percentage
  y?: number; // percentage
  page?: number;
}

export default function DocumentBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const docId = resolvedParams.id;

  const [document, setDocument] = useState<any>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [isPdf, setIsPdf] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [docRes, roleRes] = await Promise.all([
        getDocumentById(docId),
        getRoles()
      ]);
      
      if (roleRes.success) {
        setRoles(roleRes.roles || []);
      }

      if (docRes.success && docRes.document) {
        setDocument(docRes.document);
        if (docRes.document.type === 'file' && docRes.document.fileUrl && docRes.document.fileUrl.toLowerCase().includes('.pdf')) {
          setIsPdf(true);
        }
        try {
          if (docRes.document.contentJson) {
            setBlocks(JSON.parse(docRes.document.contentJson));
          }
        } catch (e) {
          console.error('Error parsing blocks', e);
        }
      } else {
        toast.error('ไม่พบเอกสาร');
        router.push('/admin/documents');
      }
      setLoading(false);
    }
    loadData();
  }, [docId, router]);

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      width: '100%',
      content: type === 'heading' ? 'หัวข้อใหม่' : type === 'paragraph' ? 'พิมพ์ข้อความที่นี่...' : '',
      label: type === 'input' ? 'คำถามใหม่' : type === 'date' ? 'วันที่' : type === 'signature' ? 'ลายเซ็น' : '',
      required: false,
      ...(isPdf ? { x: 10, y: 10, page: 1 } : {})
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= blocks.length) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + direction];
    newBlocks[index + direction] = temp;
    setBlocks(newBlocks);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!isPdf) return;
    e.dataTransfer.setData('blockId', id);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    e.dataTransfer.setData('offsetX', (e.clientX - rect.left).toString());
    e.dataTransfer.setData('offsetY', (e.clientY - rect.top).toString());
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isPdf) return;
    e.preventDefault();
    const id = e.dataTransfer.getData('blockId');
    if (!id) return;
    const offsetX = parseFloat(e.dataTransfer.getData('offsetX') || '0');
    const offsetY = parseFloat(e.dataTransfer.getData('offsetY') || '0');
    
    const container = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - container.left - offsetX) / container.width) * 100;
    const y = ((e.clientY - container.top - offsetY) / container.height) * 100;
    
    updateBlock(id, { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await updateDocumentContent(docId, JSON.stringify(blocks));
    if (res.success) {
      toast.success('บันทึกแม่แบบเรียบร้อยแล้ว');
    } else {
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">กำลังโหลด...</div>;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* Left Sidebar Tools */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <Link href="/admin/documents" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 transition-colors">
            ← กลับคลังเอกสาร
          </Link>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-bold shadow-sm transition-all text-sm disabled:opacity-50"
          >
            {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
          </button>
        </div>
        <div className="p-4">
          <h2 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1" title={document?.title}>{document?.title}</h2>
          <p className="text-xs text-slate-500 mb-6">ออกแบบฟิลด์กรอกข้อความและไฟล์</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">ข้อความ (Text)</h3>
            <div className="space-y-2">
              <button onClick={() => addBlock('heading')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 transition-colors bg-white">
                <span className="text-xl">H</span> <span className="font-medium text-sm">หัวข้อ (Heading)</span>
              </button>
              <button onClick={() => addBlock('paragraph')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 transition-colors bg-white">
                <span className="text-xl">¶</span> <span className="font-medium text-sm">ย่อหน้า (Paragraph)</span>
              </button>
              <button onClick={() => addBlock('image')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 transition-colors bg-white">
                <span className="text-xl">🖼️</span> <span className="font-medium text-sm">รูปภาพ / โลโก้</span>
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">ช่องกรอกข้อมูล (Inputs)</h3>
            <div className="space-y-2">
              <button onClick={() => addBlock('input')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 transition-colors bg-white">
                <span className="text-xl">📝</span> <span className="font-medium text-sm">กล่องข้อความ</span>
              </button>
              <button onClick={() => addBlock('date')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 transition-colors bg-white">
                <span className="text-xl">📅</span> <span className="font-medium text-sm">วันที่ (Date)</span>
              </button>
              <button onClick={() => addBlock('signature')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 transition-colors bg-white">
                <span className="text-xl">✍️</span> <span className="font-medium text-sm">ลายเซ็น (Signature)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Canvas A4 or List */}
      <div className={`flex-1 overflow-y-auto p-8 flex justify-center pb-32 ${isPdf ? 'bg-slate-200' : 'bg-slate-50'}`}>
        <div className={`w-full relative flex flex-col gap-4 ${isPdf ? 'max-w-[794px] min-h-[1123px] shadow-lg border border-slate-300 bg-white' : 'max-w-3xl'}`}>
          
          {isPdf && document?.fileUrl && (
            <div className="absolute inset-0 z-0 pointer-events-none">
              <Document 
                file={document.fileUrl} 
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                className="flex flex-col gap-4"
              >
                {Array.from(new Array(numPages || 1), (el, index) => (
                  <Page 
                    key={`page_${index + 1}`} 
                    pageNumber={index + 1} 
                    renderTextLayer={false} 
                    renderAnnotationLayer={false}
                    width={794}
                    className="shadow-md"
                  />
                ))}
              </Document>
            </div>
          )}

          <div 
            className={`relative z-10 ${isPdf ? 'w-[794px] min-h-[1123px]' : 'flex flex-col gap-4 w-full'}`}
            onDragOver={isPdf ? (e) => e.preventDefault() : undefined}
            onDrop={isPdf ? handleDrop : undefined}
          >
            {blocks.length === 0 ? (
              <div className="w-full h-64 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-xl m-2">
                <span className="text-4xl mb-2">📄</span>
                <p>หน้ากระดาษว่างเปล่า</p>
                <p className="text-sm">คลิกเครื่องมือด้านซ้ายเพื่อเพิ่มเนื้อหา</p>
              </div>
            ) : (
              blocks.map((block, index) => (
                <div 
                  key={block.id} 
                  className={`group relative ${isPdf ? 'absolute cursor-move' : 'w-full'}`}
                  style={isPdf ? { left: `${block.x}%`, top: `${block.y}%`, width: block.width } : undefined}
                  draggable={isPdf}
                  onDragStart={(e) => handleDragStart(e, block.id)}
                >
                  <div className={`transition-colors relative ${isPdf ? 'border p-2 -m-2 rounded-lg bg-white/80 backdrop-blur-sm border-blue-400 shadow-md' : 'bg-white rounded-xl shadow-sm border border-slate-200 p-4'}`}>
                    
                    {/* Controls overlay */}
                    <div className={`absolute bg-slate-800 text-white rounded-lg px-2 py-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-xl ${isPdf ? '-top-10 right-0' : 'top-2 right-2'}`}>
                      {isPdf && (
                        <select 
                          value={block.width}
                          onChange={(e) => updateBlock(block.id, { width: e.target.value as BlockWidth })}
                          className="bg-transparent text-xs outline-none cursor-pointer border-r border-slate-600 pr-1"
                          title="ปรับความกว้าง"
                        >
                          <option value="100%" className="text-slate-800">100%</option>
                          <option value="50%" className="text-slate-800">50%</option>
                          <option value="33.33%" className="text-slate-800">33%</option>
                          <option value="25%" className="text-slate-800">25%</option>
                        </select>
                      )}
                      
                      <button onClick={() => moveBlock(index, -1)} disabled={index === 0} className="p-1 hover:bg-slate-700 rounded disabled:opacity-30" title="เลื่อนขึ้น">↑</button>
                      <button onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} className="p-1 hover:bg-slate-700 rounded disabled:opacity-30" title="เลื่อนลง">↓</button>
                      <button onClick={() => removeBlock(block.id)} className="p-1 hover:bg-red-500 rounded text-red-200 hover:text-white" title="ลบ">✕</button>
                    </div>

                    {/* Rendering based on type */}
                    {block.type === 'heading' && (
                      <input 
                        type="text" 
                        value={block.content} 
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        className="w-full text-2xl font-bold text-slate-800 bg-transparent border-b border-transparent focus:border-blue-300 outline-none p-1"
                        placeholder="พิมพ์หัวข้อ..."
                      />
                    )}

                    {block.type === 'paragraph' && (
                      <textarea 
                        value={block.content} 
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        className="w-full text-slate-600 bg-transparent border border-transparent focus:border-blue-300 outline-none p-1 resize-none"
                        placeholder="พิมพ์ข้อความรายละเอียด..."
                        rows={3}
                      />
                    )}

                    {block.type === 'image' && (
                      <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 relative min-h-[120px]">
                        {block.content ? (
                          <div className="relative group/image">
                            <img src={block.content} alt="Uploaded logo" className="max-h-32 object-contain" />
                            <button onClick={() => updateBlock(block.id, { content: '' })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">✕</button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className="text-3xl block mb-2 opacity-50">🖼️</span>
                            <label className="bg-white border border-slate-300 text-slate-700 font-semibold px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-sm">
                              อัปโหลดรูปภาพ / โลโก้
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  toast.loading('กำลังอัปโหลด...', { id: `upload_${block.id}` });
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  const res = await uploadImage(formData);
                                  if (res.success) {
                                    updateBlock(block.id, { content: res.url });
                                    toast.success('อัปโหลดสำเร็จ', { id: `upload_${block.id}` });
                                  } else {
                                    toast.error('อัปโหลดไม่สำเร็จ', { id: `upload_${block.id}` });
                                  }
                                }} 
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    {block.type === 'input' && (
                      <div className="bg-transparent border-none rounded-lg p-3">
                        <input 
                          type="text" 
                          value={block.label} 
                          onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                          className="font-bold text-slate-700 text-sm bg-transparent outline-none w-full border-b border-dashed border-slate-300 mb-2 focus:border-blue-400"
                          placeholder="คำถาม / หัวข้อข้อมูล"
                        />
                        <div className="text-slate-400 text-sm italic bg-slate-50 px-3 py-2 rounded border border-slate-100 flex justify-between items-center">
                          <span>ช่องกรอกข้อความ (แสดงเฉพาะตอนพนักงานกรอก)</span>
                          <select 
                            value={block.type} 
                            onChange={(e) => updateBlock(block.id, { type: e.target.value as any })}
                            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 cursor-pointer hover:border-blue-300 outline-none"
                          >
                            <option value="input">📝 ข้อความ</option>
                            <option value="date">📅 วันที่</option>
                            <option value="signature">✍️ ลายเซ็น</option>
                          </select>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-xs text-slate-600">
                            <input type="checkbox" checked={block.required} onChange={(e) => updateBlock(block.id, { required: e.target.checked })} />
                            บังคับกรอก (Required)
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 w-24">สิทธิ์ผู้กรอก:</span>
                            <select 
                              value={block.assignedRole || ''} 
                              onChange={(e) => updateBlock(block.id, { assignedRole: e.target.value })}
                              className="text-xs border rounded p-1 flex-1 text-slate-700 bg-white"
                            >
                              <option value="">-- ใครกรอกก็ได้ (ตาม Step) --</option>
                              {roles.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {block.type === 'date' && (
                      <div className="bg-transparent border-none rounded-lg p-3">
                        <input 
                          type="text" 
                          value={block.label} 
                          onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                          className="font-bold text-slate-700 text-sm bg-transparent outline-none w-full border-b border-dashed border-slate-300 mb-2 focus:border-blue-400"
                          placeholder="ระบุวันที่..."
                        />
                        <div className="text-slate-400 text-sm italic bg-slate-50 px-3 py-2 rounded border border-slate-100 flex justify-between items-center">
                          <span>📅 ช่องเลือกวันที่</span>
                          <select 
                            value={block.type} 
                            onChange={(e) => updateBlock(block.id, { type: e.target.value as any })}
                            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 cursor-pointer hover:border-blue-300 outline-none"
                          >
                            <option value="input">📝 ข้อความ</option>
                            <option value="date">📅 วันที่</option>
                            <option value="signature">✍️ ลายเซ็น</option>
                          </select>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-xs text-slate-600">
                            <input type="checkbox" checked={block.required} onChange={(e) => updateBlock(block.id, { required: e.target.checked })} />
                            บังคับกรอก (Required)
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 w-24">สิทธิ์ผู้กรอก:</span>
                            <select 
                              value={block.assignedRole || ''} 
                              onChange={(e) => updateBlock(block.id, { assignedRole: e.target.value })}
                              className="text-xs border rounded p-1 flex-1 text-slate-700 bg-white"
                            >
                              <option value="">-- ใครกรอกก็ได้ (ตาม Step) --</option>
                              {roles.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {block.type === 'signature' && (
                      <div className="bg-transparent border-none rounded-lg p-3 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <input 
                              type="text" 
                              value={block.label} 
                              onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                              className="font-bold text-slate-700 text-sm bg-transparent outline-none flex-1 border-b border-dashed border-slate-300 focus:border-blue-400"
                              placeholder="ตำแหน่งลายเซ็น (เช่น ผู้ขออนุมัติ)"
                            />
                            <select 
                              value={block.type} 
                              onChange={(e) => updateBlock(block.id, { type: e.target.value as any })}
                              className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 cursor-pointer hover:border-blue-300 outline-none ml-4"
                            >
                              <option value="input">📝 ข้อความ</option>
                              <option value="date">📅 วันที่</option>
                              <option value="signature">✍️ ลายเซ็น</option>
                            </select>
                          </div>
                          <div className="text-slate-300 text-center py-6 text-sm italic border-2 border-dashed border-slate-100 rounded-lg bg-slate-50">
                            ✍️ พื้นที่แสดงลายเซ็น
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 w-24">ให้ใครเซ็น?:</span>
                            <select 
                              value={block.assignedRole || ''} 
                              onChange={(e) => updateBlock(block.id, { assignedRole: e.target.value })}
                              className="text-xs border border-blue-300 bg-blue-50 text-blue-700 font-semibold rounded p-1 flex-1"
                            >
                              <option value="">-- ใครกรอกก็ได้ --</option>
                              {roles.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ))
            )}
          </div>
          
        </div>
      </div>

    </div>
  );
}
