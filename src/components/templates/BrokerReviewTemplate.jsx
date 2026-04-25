import React from 'react';
import { buildRows, formatValue, getCategoryLabel, getCompanyName, getInitials, isPresent } from '../../utils/helpers';
import BrokerAccountsTable from '../common/BrokerAccountsTable';
import DataQualityBadge from '../common/DataQualityBadge';
import InfoTable from '../common/InfoTable';
import OfficialSources from '../common/OfficialSources';
import ProfessionalTraderAnalysis from '../common/ProfessionalTraderAnalysis';
import WarningNote from '../common/WarningNote';

export default function BrokerReviewTemplate({ company }) {
  if (!company) return null;
  const name = getCompanyName(company);
  const broker = company.broker_specific || {};
  const summaryRows = buildRows([
    { label: 'أقل إيداع', value: broker.minimum_deposit, type: 'money' },
    { label: 'التراخيص', value: broker.regulators },
    { label: 'أنواع الحسابات', value: broker.account_types?.map((a) => a.account_type || a.name || a.type) },
    { label: 'المنصات', value: company?.markets_and_platforms?.platforms },
    { label: 'الحساب الإسلامي', value: broker.islamic_account, type: 'boolean' },
    { label: 'الحساب التجريبي', value: broker.demo_account, type: 'boolean' },
    { label: 'أقصى رافعة Retail', value: broker.max_leverage_retail },
    { label: 'حماية الرصيد السلبي', value: broker.negative_balance_protection, type: 'boolean' }
  ]);

  const trustRows = buildRows([
    { label: 'الكيان القانوني', value: company?.company_profile?.legal_entity },
    { label: 'المقر', value: company?.company_profile?.headquarters_or_registered_country },
    { label: 'سنة التأسيس', value: company?.company_profile?.year_founded },
    { label: 'التراخيص', value: broker.regulators },
    { label: 'حماية أموال العملاء', value: broker.client_fund_protection },
    { label: 'حماية الرصيد السلبي', value: broker.negative_balance_protection, type: 'boolean' },
    { label: 'إشارات إيجابية', value: company?.company_profile?.positive_signals },
    { label: 'ملاحظات مخاطر', value: company?.company_profile?.red_flags }
  ]);

  const feesRows = buildRows([
    { label: 'نوع السبريد', value: broker.spread_type },
    { label: 'السبريد النموذجي', value: company?.execution_and_costs?.typical_spreads },
    { label: 'العمولة', value: company?.execution_and_costs?.commission_per_lot },
    { label: 'نموذج التنفيذ', value: broker.execution_model || company?.execution_and_costs?.execution_model },
    { label: 'رسوم الليلة/السواب', value: company?.execution_and_costs?.swap_or_overnight_fees },
    { label: 'رسوم عدم النشاط', value: broker.inactivity_fee },
    { label: 'ملاحظات الانزلاق', value: company?.execution_and_costs?.slippage_policy }
  ]);

  const paymentRows = buildRows([
    { label: 'طرق الإيداع', value: broker.deposit_methods },
    { label: 'طرق السحب', value: broker.withdrawal_methods },
    { label: 'رسوم السحب', value: broker.withdrawal_fees },
    { label: 'طرق مناسبة للعرب', value: company?.arab_user_relevance?.payment_methods_for_arab_users },
    { label: 'الدفع بالبطاقة', value: company?.arab_user_relevance?.bank_card_payments_available, type: 'boolean' },
    { label: 'دعم العربية', value: company?.arab_user_relevance?.arabic_language_support, type: 'boolean' },
    { label: 'حساب إسلامي/Swap-free', value: broker.islamic_account || company?.arab_user_relevance?.islamic_or_swap_free_relevance }
  ]);

  const marketRows = buildRows([
    { label: 'الأسواق', value: company?.markets_and_platforms?.markets },
    { label: 'الأدوات', value: company?.markets_and_platforms?.instruments },
    { label: 'المنصات', value: company?.markets_and_platforms?.platforms },
    { label: 'عملات الحساب', value: company?.markets_and_platforms?.account_currency },
    { label: 'TradingView', value: broker.tradingview_integration, type: 'boolean' },
    { label: 'Copy Trading', value: broker.copy_trading_available, type: 'boolean' }
  ]);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl font-black text-blue-700">{getInitials(name)}</div>
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black md:text-3xl">{name}</h1><DataQualityBadge status={company.data_quality_status} /></div>
                <div className="text-sm text-slate-500">{getCategoryLabel(company.category)}{formatValue(company.last_checked) ? ` — آخر تحديث: ${formatValue(company.last_checked)}` : ''}</div>
              </div>
            </div>
            {isPresent(company.official_website) && <a className="rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-bold text-white hover:bg-blue-700" href={company.official_website} target="_blank" rel="noopener noreferrer">زيارة الموقع الرسمي</a>}
          </div>
          {company.data_quality_status === 'partial' && <div className="mt-4"><WarningNote tone="warning">هذه البيانات جزئية وقد تختلف حسب الكيان القانوني أو بلد العميل.</WarningNote></div>}
        </section>
        <InfoTable title="ملخص القرار السريع" rows={summaryRows} />
        <InfoTable title="التراخيص والثقة" rows={trustRows} />
        <BrokerAccountsTable accounts={broker.account_types} />
        <InfoTable title="الرسوم والتنفيذ" rows={feesRows} />
        <InfoTable title="المنصات والأسواق" rows={marketRows} />
        <InfoTable title="الإيداع والسحب والمستخدم العربي" rows={paymentRows} />
        <ProfessionalTraderAnalysis summary={company.editorial_summary} />
        <OfficialSources company={company} />
        <WarningNote />
      </div>
    </main>
  );
}
