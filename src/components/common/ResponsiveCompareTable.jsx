import React from 'react';
import { getCompanyName, getByPath, formatValue, isPresent, hasItems } from '../../utils/helpers';

export default function ResponsiveCompareTable({ companies = [], fields = [], title }) {
  const visibleFields = fields.filter((field) => field.always || companies.some((company) => isPresent(getByPath(company, field.path || field.key))));
  if (!hasItems(companies) || !hasItems(visibleFields)) return null;
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {title && <h3 className="border-b border-slate-200 px-5 py-4 text-lg font-bold text-slate-900">{title}</h3>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-right text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-4 font-bold">المعيار</th>
              {companies.map((company) => (
                <th key={company.slug || getCompanyName(company)} className="p-4 font-bold">{getCompanyName(company)}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleFields.map((field) => (
              <tr key={field.key || field.path} className="hover:bg-slate-50">
                <td className="p-4 font-semibold text-slate-500">{field.label}</td>
                {companies.map((company) => {
                  const raw = getByPath(company, field.path || field.key);
                  const value = field.format ? field.format(raw, company) : formatValue(raw);
                  return <td key={`${company.slug}-${field.key || field.path}`} className="p-4 text-slate-900">{value || '—'}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
