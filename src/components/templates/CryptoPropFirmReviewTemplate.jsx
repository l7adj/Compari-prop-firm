import React from 'react';
import { buildRows, formatValue, getCategoryLabel, getCompanyName, getInitials, getLowestPrice, getMaxAccountSize, isPresent } from '../../utils/helpers';
import DataQualityBadge from '../common/DataQualityBadge';
import InfoTable from '../common/InfoTable';
import OfficialSources from '../common/OfficialSources';
import ProgramPricingTable from '../common/ProgramPricingTable';
import ProfessionalTraderAnalysis from '../common/ProfessionalTraderAnalysis';
import WarningNote from '../common/WarningNote';

export default function CryptoPropFirmReviewTemplate({ company }) {
  if (!company) return null;
  const name = getCompanyName(company);
  const summaryRows = buildRows([
    { label: 'أقل سعر', value: getLowestPrice(company), type: 'money' },
    { label: 'أكبر حساب', value: getMaxAccountSize(company), type: 'money' },
    { label: 'الأسواق', value: company?.markets_and_platforms?.markets },
    { label: 'الأدوات', value: company?.markets_and_platforms?.instruments },
    { label: 'المنصات', value: company?.markets_and_platforms?.platforms },
    { label: 'بيئة التنفيذ', value: company?.markets_and_platforms?.execution_environment }
  ]);
  const riskRows = buildRows([
    { label: 'Daily Drawdown', value: company?.risk_rules?.daily_drawdown_based_on || company?.programs?.[0]?.plans?.[0]?.daily_drawdown },
    { label: 'Max Drawdown', value: company?.risk_rules?.max_drawdown_based_on || company?.programs?.[0]?.plans?.[0]?.max_drawdown },
    { label: 'الخسائر العائمة', value: company?.risk_rules?.floating_loss_counts, type: 'boolean' },
    { label: 'الرافعة للكريبتو', value: company?.programs?.[0]?.plans?.[0]?.leverage_crypto },
    { label: 'أقصى حجم مركز', value: company?.programs?.[0]?.plans?.[0]?.max_position_size }
  ]);
  const payoutRows = buildRows([
    { label: 'تقاسم الأرباح', value: company?.funded_stage_and_payouts?.profit_split_scaling || company?.programs?.[0]?.plans?.[0]?.profit_split },
    { label: 'شروط أول سحب', value: company?.funded_stage_and_payouts?.first_payout_requirements },
    { label: 'طرق السحب', value: company?.funded_stage_and_payouts?.payout_methods || company?.company_level_rules?.payout_methods },
    { label: 'KYC قبل السحب', value: company?.funded_stage_and_payouts?.kyc_before_payout, type: 'boolean' }
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
          <div className="mt-4"><WarningNote tone="info">تحقق من نوع التداول: هل هو تداول كريبتو حقيقي أم عقود CFD على الكريبتو. هذا يؤثر على الرسوم، الرافعة، والسيولة.</WarningNote></div>
        </section>
        <InfoTable title="ملخص القرار السريع" rows={summaryRows} />
        <ProgramPricingTable programs={company.programs} category="crypto_prop_firm" />
        <InfoTable title="قواعد المخاطر للكريبتو" rows={riskRows} />
        <InfoTable title="السحب والرسوم" rows={payoutRows} />
        <ProfessionalTraderAnalysis summary={company.editorial_summary} />
        <OfficialSources company={company} />
        <WarningNote />
      </div>
    </main>
  );
}
