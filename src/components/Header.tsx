'use client';

import { useState, useEffect } from 'react';

export default function Header() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatThaiDateTimeLong = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Bangkok'
    };
    return date.toLocaleDateString('th-TH', options);
  };

  const formatThaiDateTimeShort = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: '2-digit',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Bangkok'
    };
    return date.toLocaleDateString('th-TH', options);
  };

  return (
    <div className="bg-slate-900 text-white text-sm py-2 px-4 md:px-6 flex justify-between items-center shadow-md sticky top-0 z-50">
      <div className="font-semibold tracking-wide truncate mr-4">HR-PDF System</div>
      <div className="flex items-center gap-2 text-slate-300 shrink-0">
        <svg className="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        {time ? (
          <>
            <span className="hidden md:inline">{formatThaiDateTimeLong(time)}</span>
            <span className="md:hidden text-xs">{formatThaiDateTimeShort(time)}</span>
          </>
        ) : (
          <span>กำลังโหลด...</span>
        )}
      </div>
    </div>
  );
}
