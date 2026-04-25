import React from 'react';
import { formatValue } from '../../utils/helpers';

export default function DataQualityBadge({ status, note }) {
  const normalized = status || 'partial';
  const styles = {
    ready: 'bg-green-50 text-green-700 border-green-200',
    partial: 'bg-amber-50 text-amber-700 border-amber-200',
    stale: 'bg-red-50 text-red-700 border-red-200',
    research_needed: 'bg-slate-50 text-slate-600 border-slate-200'
  };
  const labels = {
    ready: 'بيانات موثقة',
    partial: 'بيانات جزئية',
    stale: 'تحتاج تحديثًا',
    research_needed: 'تحتاج مراجعة'
  };
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${styles[normalized] || styles.partial}`}>
      <span>{normalized === 'ready' ? '✓' : '!'}</span>
      <span>{labels[normalized] || 'بيانات جزئية'}</span>
      {formatValue(note) && <span className="opacity-80">— {formatValue(note)}</span>}
    </span>
  );
}
