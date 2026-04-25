import React from 'react';

export default function AdSlot({ label = 'Ad slot' }) {
  return (
    <div className="my-8 flex min-h-24 items-center justify-center rounded-xl border-2 border-dashed border-blue-100 bg-blue-50/50 p-6 text-center text-sm text-slate-400">
      <div>
        <div className="mb-1 text-xs uppercase tracking-wider">{label}</div>
        <div>مساحة إعلانية</div>
      </div>
    </div>
  );
}
