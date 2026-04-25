import React from 'react';

export default function EmptySafeSection({ title = 'لا توجد بيانات كافية', message = 'سيتم إظهار هذا القسم عند توفر بيانات قابلة للعرض.' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
      <h3 className="mb-2 font-semibold text-slate-700">{title}</h3>
      <p>{message}</p>
    </div>
  );
}
