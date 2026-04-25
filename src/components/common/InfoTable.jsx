import React from 'react';
import { formatValue, hasItems } from '../../utils/helpers';

export default function InfoTable({ title, rows = [] }) {
  const safeRows = rows.filter((row) => formatValue(row?.value));
  if (!hasItems(safeRows)) return null;
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {title && <h3 className="border-b border-slate-200 px-5 py-4 text-lg font-bold text-slate-900">{title}</h3>}
      <div className="divide-y divide-slate-100">
        {safeRows.map((row, index) => (
          <div key={`${row.label}-${index}`} className="grid gap-2 px-5 py-3 text-sm sm:grid-cols-3">
            <div className="font-semibold text-slate-500">{row.label}</div>
            <div className="sm:col-span-2 text-slate-900">{formatValue(row.value)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
