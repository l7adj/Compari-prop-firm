import React from 'react';
import {
  isPresent,
  hasItems,
  formatValue,
  formatBoolean,
  formatArray,
  getOfficialSources,
  shouldShowColumn,
} from '../../utils/helpers.js';

export function Layout({ title, description, children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950" dir="rtl">
      <Header />
      <main className="mx-auto w-[min(1180px,calc(100%-28px))] py-6">
        {title ? (
          <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-2 text-sm font-black text-blue-600">محطة التمويل</p>
            <h1 className="m-0 text-3xl font-black leading-tight md:text-5xl">{title}</h1>
            {description ? <p className="mt-3 max-w-4xl leading-8 text-slate-600">{description}</p> : null}
          </section>
        ) : null}
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-[min(1180px,calc(100%-28px))] items-center justify-between gap-4">
        <a href="/Compari-prop-firm/" className="font-black text-blue-600">
          <span className="block text-2xl">محطة التمويل</span>
          <span className="block text-xs text-slate-500">مراجعات ومقارنات مالية</span>
        </a>
        <nav className="hidden gap-5 text-sm font-extrabold text-slate-600 md:flex">
          <a href="/Compari-prop-firm/categories/">التصنيفات</a>
          <a href="/Compari-prop-firm/compare/">المقارنات</a>
          <a href="/Compari-prop-firm/tools/">الأدوات</a>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-10 bg-slate-950 py-8 text-slate-300">
      <div className="mx-auto w-[min(1180px,calc(100%-28px))]">
        <strong className="text-white">محطة التمويل</strong>
        <p className="mt-2 leading-7">المعلومات تعليمية وتنظيمية. راجع المصادر الرسمية قبل أي قرار مالي.</p>
      </div>
    </footer>
  );
}

export function DataQualityBadge({ status }) {
  if (!isPresent(status)) return null;
  const className = status === 'ready'
    ? 'bg-green-100 text-green-800 border-green-200'
    : status === 'partial'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-blue-100 text-blue-800 border-blue-200';
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${className}`}>{status}</span>;
}

export function EmptySafeSection({ title, children, data, className = '' }) {
  const hasContent = isPresent(data) || React.Children.toArray(children).some(Boolean);
  if (!hasContent) return null;
  return (
    <section className={`mb-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      {title ? <h2 className="mb-4 text-2xl font-black">{title}</h2> : null}
      {children}
    </section>
  );
}

export function QuickSummaryPanel({ items = [] }) {
  const clean = items.filter((item) => isPresent(item?.value));
  if (!clean.length) return null;
  return (
    <section className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {clean.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="block text-xs font-extrabold text-slate-500">{item.label}</span>
          <strong className="mt-1 block text-lg font-black">{item.value}</strong>
        </div>
      ))}
    </section>
  );
}

export function ResponsiveTable({ columns = [], rows = [] }) {
  const visibleColumns = columns.filter((column) => rows.some((row) => isPresent(row?.[column.key])));
  if (!rows.length || !visibleColumns.length) return null;
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[900px] border-collapse text-right text-sm">
        <thead>
          <tr>{visibleColumns.map((c) => <th key={c.key} className="bg-blue-50 p-3 font-black text-slate-700">{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index} className="border-t border-slate-200">
              {visibleColumns.map((c) => <td key={c.key} className="p-3 align-top">{renderCell(row[c.key])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCell(value) {
  if (!isPresent(value)) return null;
  if (typeof value === 'boolean') return formatBoolean(value);
  if (Array.isArray(value)) return formatArray(value);
  return formatValue(value);
}

export function ProgramPricingTable({ plans = [], columns = [] }) {
  return <ResponsiveTable columns={columns} rows={plans} />;
}

export function BrokerAccountsTable({ accountTypes = [] }) {
  return <ResponsiveTable rows={accountTypes} columns={[
    { key: 'account_type', label: 'نوع الحساب' },
    { key: 'minimum_deposit', label: 'أقل إيداع' },
    { key: 'spread_from', label: 'السبريد من' },
    { key: 'commission', label: 'العمولة' },
    { key: 'execution_model', label: 'التنفيذ' },
    { key: 'max_leverage', label: 'الرافعة' },
    { key: 'islamic_account', label: 'إسلامي' },
    { key: 'demo_account', label: 'تجريبي' },
    { key: 'platforms', label: 'المنصات' },
    { key: 'best_for', label: 'مناسب لـ' },
  ]} />;
}

export function CryptoExchangeProductsTable({ products = [] }) {
  return <ResponsiveTable rows={products} columns={[
    { key: 'product_type', label: 'المنتج' },
    { key: 'maker_fee', label: 'Maker' },
    { key: 'taker_fee', label: 'Taker' },
    { key: 'max_leverage', label: 'أقصى رافعة' },
    { key: 'kyc_required', label: 'KYC' },
    { key: 'p2p_trading', label: 'P2P' },
    { key: 'fiat_deposit', label: 'Fiat' },
    { key: 'withdrawal_fees', label: 'رسوم السحب' },
    { key: 'proof_of_reserves', label: 'إثبات الاحتياطيات' },
  ]} />;
}

export function OfficialSources({ company }) {
  const sources = getOfficialSources(company);
  if (!sources.length) return null;
  return (
    <EmptySafeSection title="المصادر الرسمية" data={sources}>
      <ul className="grid gap-2 leading-7">
        {sources.map((source) => (
          <li key={source.url}><a className="font-bold text-blue-700" href={source.url} rel="nofollow noopener" target="_blank">{source.label || source.url}</a></li>
        ))}
      </ul>
    </EmptySafeSection>
  );
}

export function WarningNote({ children }) {
  return <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 font-bold leading-8 text-orange-800">{children}</div>;
}

export function ProfessionalTraderAnalysis({ title = 'تحليل المتداول المحترف', items = [] }) {
  const clean = items.filter((item) => isPresent(item?.value));
  if (!clean.length) return null;
  return (
    <EmptySafeSection title={title} data={clean}>
      <div className="grid gap-3 md:grid-cols-2">
        {clean.map((item) => <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><strong>{item.label}</strong><p>{item.value}</p></div>)}
      </div>
    </EmptySafeSection>
  );
}

export function ComparisonTable({ rows = [], companies = [] }) {
  if (!rows.length || !companies.length) return null;
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[820px] border-collapse text-right text-sm">
        <thead><tr><th className="bg-blue-50 p-3">النقطة</th>{companies.map((c) => <th key={c.slug} className="bg-blue-50 p-3">{c.company_name}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.label} className="border-t"><td className="p-3 font-black">{row.label}</td>{companies.map((c) => <td key={c.slug} className="p-3">{isPresent(row.values?.[c.slug]) ? row.values[c.slug] : '—'}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
