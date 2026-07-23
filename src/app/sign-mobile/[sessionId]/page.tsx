'use client';

import { useState, useRef, useEffect, use } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { checkSignatureSession, completeSignatureSession } from '@/app/actions/signature';
import { toast } from 'sonner';

export default function MobileSignaturePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.sessionId;
  
  const sigCanvas = useRef<any>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const res = await checkSignatureSession(sessionId);
      if (res.success) {
        setIsValid(true);
        if (res.isCompleted) {
          setIsCompleted(true);
        }
      } else {
        setIsValid(false);
      }
    }
    checkSession();
  }, [sessionId]);

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  const handleSave = async () => {
    if (!consent) {
      toast.error('กรุณากดยินยอมก่อนบันทึกลายเซ็น');
      return;
    }

    if (sigCanvas.current && sigCanvas.current.isEmpty()) {
      toast.error('กรุณาเซ็นลายเซ็นของคุณ');
      return;
    }

    setIsSaving(true);
    const rawCanvas = sigCanvas.current.getTrimmedCanvas();
    // สร้าง canvas ขนาดมาตรฐานเดียวกับ DOCX export (200x67 pixels)
    const standardCanvas = document.createElement('canvas');
    standardCanvas.width = 200;
    standardCanvas.height = 67;
    const ctx = standardCanvas.getContext('2d')!;
    const scale = Math.min(200 / rawCanvas.width, 67 / rawCanvas.height);
    const dx = (200 - rawCanvas.width * scale) / 2;
    const dy = (67 - rawCanvas.height * scale) / 2;
    ctx.drawImage(rawCanvas, dx, dy, rawCanvas.width * scale, rawCanvas.height * scale);
    const dataURL = standardCanvas.toDataURL('image/png');
    
    const res = await completeSignatureSession(sessionId, dataURL);
    if (res.success) {
      setIsCompleted(true);
      toast.success('บันทึกลายเซ็นเรียบร้อยแล้ว');
    } else {
      toast.error('เกิดข้อผิดพลาดในการบันทึกลายเซ็น');
      setIsSaving(false);
    }
  };

  if (isValid === null) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">กำลังตรวจสอบข้อมูล...</div>;
  }

  if (isValid === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-xl font-bold mb-2">เซสชันไม่ถูกต้อง หรือหมดอายุแล้ว</h1>
        <p className="text-slate-400">กรุณากลับไปที่หน้าจอคอมพิวเตอร์และกดสร้าง QR Code ใหม่อีกครั้ง</p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-500 text-white p-6 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">ส่งลายเซ็นสำเร็จ!</h1>
        <p className="text-green-100">คุณสามารถปิดหน้านี้ และทำรายการต่อที่หน้าจอคอมพิวเตอร์ได้เลยครับ</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="p-4 border-b border-slate-800 bg-slate-900 text-center sticky top-0 z-10">
        <h1 className="font-bold text-lg">เซ็นลายเซ็นของคุณ</h1>
        <p className="text-xs text-slate-400">โปรดใช้นิ้วหรือปากกาวาดลายเซ็นลงในกรอบด้านล่าง</p>
      </div>

      <div className="flex-1 p-4 flex flex-col">
        <div className="bg-white rounded-xl flex-1 w-full overflow-hidden relative shadow-inner">
          <SignatureCanvas 
            ref={sigCanvas}
            canvasProps={{ className: 'w-full h-full absolute top-0 left-0' }}
            backgroundColor="white"
            penColor="black"
          />
          <button 
            onClick={handleClear}
            className="absolute top-4 right-4 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 shadow-sm z-10"
          >
            ล้างลายเซ็น
          </button>
        </div>

        <div className="mt-6 bg-slate-800 p-4 rounded-xl border border-slate-700">
          <label className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
            />
            <span className="text-sm text-slate-300 leading-relaxed">
              ข้าพเจ้ายินยอมให้ใช้ลายเซ็นอิเล็กทรอนิกส์นี้ในการลงนามเอกสารของบริษัท และยืนยันว่าลายเซ็นนี้เป็นของข้าพเจ้าจริง
            </span>
          </label>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving || !consent}
          className="mt-4 w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-900/50 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all"
        >
          {isSaving ? 'กำลังบันทึก...' : 'บันทึกลายเซ็น'}
        </button>
      </div>
    </div>
  );
}
