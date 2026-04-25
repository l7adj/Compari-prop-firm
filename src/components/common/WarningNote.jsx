import React from 'react';

export default function WarningNote({ children, tone = 'risk' }) {
  const toneClass = tone === 'info'
    ? 'border-blue-200 bg-blue-50 text-blue-800'
    : tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-red-200 bg-red-50 text-red-800';
  return (
    <div className={`rounded-xl border p-4 text-sm leading-7 ${toneClass}`}>
      {children || 'التداول ينطوي على مخاطر عالية، وقد تتغير القواعد والرسوم. تحقق دائمًا من الموقع الرسمي قبل اتخاذ أي قرار.'}
    </div>
  );
}
