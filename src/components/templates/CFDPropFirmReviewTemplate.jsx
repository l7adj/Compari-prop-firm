import React from 'react';
import {
  buildRows,
  compactArray,
  formatMoney,
  formatValue,
  getCategoryLabel,
  getCompanyName,
  getInitials,
  getLowestPrice,
  getMaxAccountSize,
  hasItems,
  isPresent
} from '../../utils/helpers';
import DataQualityBadge from '../common/DataQualityBadge';
import InfoTable from '../common/InfoTable';
import OfficialSources from '../common/OfficialSources';
import ProgramPricingTable from '../common/ProgramPricingTable';
import ProfessionalTraderAnalysis from '../common/ProfessionalTraderAnalysis';
import WarningNote from '../common/WarningNote';

export default function CFDPropFirmReviewTemplate({ company }) {
  if (!company) return null;
  const name = getCompanyName(company);
  const lowestPrice = getLowestPrice(company);
  const maxAccount = getMaxAccountSize(company);
  const platforms = company?.markets_and_platforms?.platforms;

  const summaryRows = buildRows([
    { label: 'أقل سعر', value: lowestPrice, type: 'money' },
    { label: 'أكبر حساب', value: maxAccount, type: 'money' },
    { label: 'المنصات', value: platforms },
    { label: 'تقاسم الأرباح', value: company?.funded_stage_and_payouts?.profit_split_scaling || company?.programs?.[0]?.plans?.[0]?.profit_split },
    { label: 'أول سحب', value: company?.funded_stage_and_payouts?.first_payout_requirements || company?.programs?.[0]?.plans?.[0]?.first_payout_time },
    { label: 'الدولة/المقر', value: company?.company_profile?.headquarters_or_registered_country }
  ]);

  const riskRows = buildRows([
    { label: 'أساس حد الخسارة اليومي', value: company?.risk_rules?.daily_drawdown_based_on },
    { label: 'أساس الحد الأقصى للخسارة', value: company?.risk_rules?.max_drawdown_based_on },
    { label: 'Balance أو Equity', value: company?.risk_rules?.equity_or_balance_rule },
    { label: 'هل الخسائر العائمة محسوبة؟', value: company?.risk_rules?.floating_loss_counts, type: 'boolean' },
    { label: 'هل الدرو داون يتحرك؟', value: company?.risk_rules?.drawdown_trails_until },
    { label: 'مثال الخسارة اليومية', value: company?.risk_rules?.max_daily_loss_example },
    { label: 'مثال الحد الأقصى', value: company?.risk_rules?.max_loss_example }
  ]);

  const tradingRows = buildRows([
    { label: 'تداول الأخبار', value: company?.company_level_rules?.news_trading || company?.programs?.[0]?.plans?.[0]?.news_trading },
    { label: 'الاحتفاظ نهاية الأسبوع', value: company?.programs?.[0]?.plans?.[0]?.weekend_holding },
    { label: 'الاحتفاظ الليلي', value: company?.programs?.[0]?.plans?.[0]?.overnight_holding },
    { label: 'EA Bots', value: company?.programs?.[0]?.plans?.[0]?.ea_bots },
    { label: 'Copy Trading', value: company?.company_level_rules?.copy_trading_general_rule || company?.programs?.[0]?.plans?.[0]?.copy_trading },
    { label: 'Hedging', value: company?.programs?.[0]?.plans?.[0]?.hedging },
    { label: 'الممارسات الممنوعة', value: company?.company_level_rules?.general_forbidden_practices }
  ]);

  const payoutRows = buildRows([
    { label: 'نوع الحساب الممول', value: company?.funded_stage_and_payouts?.funded_account_type },
    { label: 'Simulated أو Live', value: company?.funded_stage_and_payouts?.simulated_or_live },
    { label: 'شروط أول سحب', value: company?.funded_stage_and_payouts?.first_payout_requirements },
    { label: 'الحد الأدنى للسحب', value: company?.funded_stage_and_payouts?.minimum_payout_amount },
    { label: 'طرق السحب', value: company?.funded_stage_and_payouts?.payout_methods || company?.company_level_rules?.payout_methods },
    { label: 'مدة معالجة السحب', value: company?.funded_stage_and_payouts?.payout_processing_time },
    { label: 'KYC قبل السحب', value: company?.funded_stage_and_payouts?.kyc_before_payout, type: 'boolean' }
  ]);

  const costRows = buildRows([
    { label: 'السبريد', value: company?.execution_and_costs?.typical_spreads || company?.execution_and_costs?.spread_table_available },
    { label: 'العمولة', value: company?.execution_and_costs?.commission_per_lot || company?.programs?.[0]?.plans?.[0]?.commission },
    { label: 'السواب أو رسوم الليلة', value: company?.execution_and_costs?.swap_or_overnight_fees },
    { label: 'نموذج التنفيذ', value: company?.execution_and_costs?.execution_model },
    { label: 'ملاحظات الانزلاق', value: company?.execution_and_costs?.slippage_policy },
    { label: 'البروكر/مزود السيولة', value: company?.execution_and_costs?.liquidity_provider_or_broker }
  ]);

  const arabRows = buildRows([
    { label: 'دعم العربية', value: company?.arab_user_relevance?.arabic_language_support, type: 'boolean' },
    { label: 'دول MENA المدعومة', value: company?.arab_user_relevance?.mena_countries_supported },
    { label: 'دول MENA المحظورة', value: company?.arab_user_relevance?.mena_countries_restricted },
    { label: 'طرق دفع مناسبة للعرب', value: company?.arab_user_relevance?.payment_methods_for_arab_users },
    { label: 'الدفع بالكريبتو', value: company?.arab_user_relevance?.crypto_payments_available, type: 'boolean' },
    { label: 'الدفع بالبطاقة', value: company?.arab_user_relevance?.bank_card_payments_available, type: 'boolean' }
  ]);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl font-black text-blue-700">{getInitials(name)}</div>
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black md:text-3xl">{name}</h1>
                  <DataQualityBadge status={company.data_quality_status} />
                </div>
                <div className="text-sm text-slate-500">{getCategoryLabel(company.category)}{formatValue(company.last_checked) ? ` — آخر تحديث: ${formatValue(company.last_checked)}` : ''}</div>
              </div>
            </div>
            {isPresent(company.official_website) && (
              <a className="rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-bold text-white hover:bg-blue-700" href={company.official_website} target="_blank" rel="noopener noreferrer">زيارة الموقع الرسمي</a>
            )}
          </div>
          {company.data_quality_status === 'partial' && <div className="mt-4"><WarningNote tone="warning">هذه البيانات جزئية وقد تحتاج تحققًا من الموقع الرسمي قبل اتخاذ القرار.</WarningNote></div>}
        </section>

        {hasItems(summaryRows) && <InfoTable title="ملخص القرار السريع" rows={summaryRows} />}
        <ProgramPricingTable programs={company.programs} category="cfd_prop_firm" />
        <InfoTable title="قواعد المخاطر" rows={riskRows} />
        <InfoTable title="قواعد التداول" rows={tradingRows} />
        <InfoTable title="السحب والمرحلة الممولة" rows={payoutRows} />
        <InfoTable title="التكاليف والتنفيذ" rows={costRows} />
        <ProfessionalTraderAnalysis summary={company.editorial_summary} />
        <InfoTable title="ملاءمة المستخدم العربي" rows={arabRows} />
        <OfficialSources company={company} />
        <WarningNote />
      </div>
    </main>
  );
}
