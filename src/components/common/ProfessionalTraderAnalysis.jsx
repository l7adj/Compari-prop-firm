import React from 'react';
import { compactArray, formatValue, hasItems } from '../../utils/helpers';

export default function ProfessionalTraderAnalysis({ summary = {}, title = 'تحليل مناسب للمتداول المحترف' }) {
  const points = [
    summary.main_strength && { label: 'نقطة القوة', value: summary.main_strength },
    summary.main_weakness && { label: 'نقطة الضعف', value: summary.main_weakness },
    hasItems(summary.best_for) && { label: 'يناسب', value: summary.best_for },
    hasItems(summary.not_suitable_for) && { label: 'لا يناسب', value: summary.not_suitable_for },
    summary.ideal_trader_profile && { label: 'الملف الأنسب', value: summary.ideal_trader_profile },
    summary.scalper_friendliness && { label: 'السكالبينغ', value: summary.scalper_friendliness },
    summary.swing_trader_friendliness && { label: 'السوينغ', value: summary.swing_trader_friendliness },
    summary.news_trader_friendliness && { label: 'تداول الأخبار', value: summary.news_trader_friendliness },
    summary.ea_trader_friendliness && { label: 'EAs', value: summary.ea_trader_friendliness }
  ].filter(Boolean).filter((point) => formatValue(point.value));

  if (!points.length) return null;

  return (
    <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
      <h3 className="mb-4 text-lg font-bold text-slate-900">{title}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {points.slice(0, 8).map((point) => (
          <div key={point.label} className="rounded-lg border border-blue-100 bg-white p-4">
            <div className="mb-1 text-sm font-bold text-blue-700">{point.label}</div>
            <div className="text-sm leading-7 text-slate-600">{formatValue(point.value)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
