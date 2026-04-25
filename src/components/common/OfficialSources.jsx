import React from 'react';
import { getOfficialSources, hasItems, formatValue } from '../../utils/helpers';

export default function OfficialSources({ company, sources }) {
  const finalSources = hasItems(sources) ? sources : getOfficialSources(company);
  if (!hasItems(finalSources)) return null;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-slate-900">المصادر الرسمية</h3>
      <div className="flex flex-wrap gap-3">
        {finalSources.map((source, index) => (
          <a
            key={`${source.url}-${index}`}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            {formatValue(source.label) || `مصدر ${index + 1}`}
          </a>
        ))}
      </div>
    </section>
  );
}
