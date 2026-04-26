import React from 'react';
import { ComparisonTable, EmptySafeSection, Layout, OfficialSources, WarningNote } from '../common/index.jsx';
import { formatArray, formatBoolean, formatMoney, formatPercent, getAllPlans, getCategoryLabel, getOfficialSources, isPresent } from '../../utils/helpers.js';

const ROWS_BY_CATEGORY = {
  cfd_prop_firm: [
    ['السعر', (c) => formatMoney(getAllPlans(c)[0]?.price, getAllPlans(c)[0]?.currency)],
    ['حجم الحساب', (c) => getAllPlans(c)[0]?.account_size],
    ['هدف المرحلة 1', (c) => formatPercent(getAllPlans(c)[0]?.phase_1_profit_target)],
    ['هدف المرحلة 2', (c) => formatPercent(getAllPlans(c)[0]?.phase_2_profit_target)],
    ['Daily Drawdown', (c) => formatPercent(getAllPlans(c)[0]?.daily_drawdown)],
    ['Max Drawdown', (c) => formatPercent(getAllPlans(c)[0]?.max_drawdown)],
    ['نوع الدرو داون', (c) => getAllPlans(c)[0]?.drawdown_type],
    ['أقل أيام تداول', (c) => getAllPlans(c)[0]?.minimum_trading_days],
    ['Profit Split', (c) => getAllPlans(c)[0]?.profit_split],
    ['أول سحب', (c) => getAllPlans(c)[0]?.first_payout_time],
    ['تكرار السحب', (c) => getAllPlans(c)[0]?.payout_frequency],
    ['المنصات', (c) => formatArray(c?.markets_and_platforms?.platforms)],
    ['تداول الأخبار', (c) => formatBoolean(getAllPlans(c)[0]?.news_trading)],
    ['Weekend Holding', (c) => formatBoolean(getAllPlans(c)[0]?.weekend_holding)],
    ['EA Bots', (c) => formatBoolean(getAllPlans(c)[0]?.ea_bots)],
    ['Copy Trading', (c) => formatBoolean(getAllPlans(c)[0]?.copy_trading)],
  ],
  futures_prop_firm: [
    ['السعر', (c) => formatMoney(getAllPlans(c)[0]?.price, getAllPlans(c)[0]?.currency)],
    ['حجم الحساب', (c) => getAllPlans(c)[0]?.account_size],
    ['هدف الربح', (c) => getAllPlans(c)[0]?.profit_target || getAllPlans(c)[0]?.phase_1_profit_target],
    ['Daily Loss Limit', (c) => getAllPlans(c)[0]?.daily_loss_limit || getAllPlans(c)[0]?.daily_drawdown],
    ['Max Loss Limit', (c) => getAllPlans(c)[0]?.max_loss_limit || getAllPlans(c)[0]?.max_drawdown],
    ['Trailing Drawdown', (c) => getAllPlans(c)[0]?.trailing_drawdown || getAllPlans(c)[0]?.trailing_drawdown_rules],
    ['EOD Drawdown', (c) => getAllPlans(c)[0]?.eod_drawdown],
    ['Max Contracts', (c) => getAllPlans(c)[0]?.max_contracts || getAllPlans(c)[0]?.max_contracts_or_lots],
    ['Activation Fee', (c) => getAllPlans(c)[0]?.activation_fee],
    ['Data Fee', (c) => getAllPlans(c)[0]?.data_fee],
    ['Reset Fee', (c) => getAllPlans(c)[0]?.reset_fee],
    ['تكرار السحب', (c) => getAllPlans(c)[0]?.payout_frequency],
    ['Payout Cap', (c) => getAllPlans(c)[0]?.payout_cap],
    ['المنصات', (c) => formatArray(c?.markets_and_platforms?.platforms)],
  ],
  broker: [
    ['أقل إيداع', (c) => c?.broker_specific?.minimum_deposit],
    ['التراخيص', (c) => formatArray(c?.broker_specific?.regulators)],
    ['أنواع الحسابات', (c) => formatArray((c?.broker_specific?.account_types || []).map((a) => a.account_type || a.name))],
    ['السبريد من', (c) => c?.broker_specific?.spread_from || c?.broker_specific?.spread_type],
    ['العمولة', (c) => c?.execution_and_costs?.commission_per_lot],
    ['نموذج التنفيذ', (c) => c?.broker_specific?.execution_model || c?.execution_and_costs?.execution_model],
    ['أقصى رافعة', (c) => c?.broker_specific?.max_leverage_retail],
    ['حساب إسلامي', (c) => formatBoolean(c?.broker_specific?.islamic_account)],
    ['حساب تجريبي', (c) => formatBoolean(c?.broker_specific?.demo_account)],
    ['حماية الرصيد السلبي', (c) => formatBoolean(c?.broker_specific?.negative_balance_protection)],
    ['طرق الإيداع', (c) => formatArray(c?.broker_specific?.deposit_methods)],
    ['رسوم السحب', (c) => c?.broker_specific?.withdrawal_fees],
    ['المنصات', (c) => formatArray(c?.markets_and_platforms?.platforms)],
    ['الأسواق', (c) => formatArray(c?.markets_and_platforms?.markets)],
  ],
  crypto_exchange: [
    ['Spot Trading', (c) => formatBoolean(c?.crypto_exchange_specific?.spot_trading)],
    ['Futures Trading', (c) => formatBoolean(c?.crypto_exchange_specific?.futures_trading)],
    ['Margin Trading', (c) => formatBoolean(c?.crypto_exchange_specific?.margin_trading)],
    ['P2P', (c) => formatBoolean(c?.crypto_exchange_specific?.p2p_trading)],
    ['KYC', (c) => formatBoolean(c?.crypto_exchange_specific?.kyc_required)],
    ['Proof of Reserves', (c) => formatBoolean(c?.crypto_exchange_specific?.proof_of_reserves)],
    ['Maker Fee', (c) => c?.crypto_exchange_specific?.maker_fee],
    ['Taker Fee', (c) => c?.crypto_exchange_specific?.taker_fee],
    ['عدد العملات', (c) => c?.crypto_exchange_specific?.supported_coins_count],
    ['Fiat Deposit', (c) => formatBoolean(c?.crypto_exchange_specific?.fiat_deposit)],
    ['الدول المحظورة', (c) => formatArray(c?.crypto_exchange_specific?.restricted_countries)],
    ['الأمان', (c) => formatArray(c?.crypto_exchange_specific?.security_features)],
  ],
  crypto_prop_firm: [
    ['السعر', (c) => formatMoney(getAllPlans(c)[0]?.price, getAllPlans(c)[0]?.currency)],
    ['حجم الحساب', (c) => getAllPlans(c)[0]?.account_size],
    ['نوع السوق', (c) => getAllPlans(c)[0]?.market_type],
    ['هدف المرحلة 1', (c) => formatPercent(getAllPlans(c)[0]?.phase_1_profit_target)],
    ['هدف المرحلة 2', (c) => formatPercent(getAllPlans(c)[0]?.phase_2_profit_target)],
    ['Daily Drawdown', (c) => formatPercent(getAllPlans(c)[0]?.daily_drawdown)],
    ['Max Drawdown', (c) => formatPercent(getAllPlans(c)[0]?.max_drawdown)],
    ['رافعة الكريبتو', (c) => getAllPlans(c)[0]?.leverage_crypto],
    ['أقصى حجم مركز', (c) => getAllPlans(c)[0]?.max_position_size],
    ['Maker Fee', (c) => getAllPlans(c)[0]?.maker_fee],
    ['Taker Fee', (c) => getAllPlans(c)[0]?.taker_fee],
    ['Profit Split', (c) => getAllPlans(c)[0]?.profit_split],
    ['طرق السحب', (c) => formatArray(getAllPlans(c)[0]?.payout_methods)],
    ['KYC', (c) => formatBoolean(getAllPlans(c)[0]?.kyc_required)],
    ['المنصات', (c) => formatArray(c?.markets_and_platforms?.platforms)],
  ],
};

function normalizeCategory(category) {
  if (category === 'brokers') return 'broker';
  if (category === 'crypto_exchanges') return 'crypto_exchange';
  return category;
}

export default function ComparisonTemplate({ companies = [], category }) {
  const normalized = normalizeCategory(category || companies[0]?.category);
  const rowDefinitions = ROWS_BY_CATEGORY[normalized] || ROWS_BY_CATEGORY.cfd_prop_firm;
  const rows = rowDefinitions
    .map(([label, getter]) => ({
      label,
      values: Object.fromEntries(companies.map((company) => [company.slug, getter(company)])),
    }))
    .filter((row) => Object.values(row.values).some(isPresent));

  return (
    <Layout title={`مقارنة ${companies.map((c) => c.company_name).join(' vs ')}`} description={`مقارنة ${getCategoryLabel(normalized)} اعتمادًا على البيانات المتوفرة في ملفات JSON.`}>
      <EmptySafeSection title="ملخص المقارنة" data={companies}>
        <p className="leading-8 text-slate-600">هذه المقارنة لا تعلن فائزًا مطلقًا. القرار يعتمد على أسلوب التداول، بلد المستخدم، القواعد، الرسوم، وجودة البيانات.</p>
      </EmptySafeSection>
      <ComparisonTable rows={rows} companies={companies} />
      <EmptySafeSection title="قرار المتداول المحترف" data={companies}>
        <p className="leading-8 text-slate-600">إذا كنت تريد تكلفة أقل فافحص السعر مع قيود السحب. إذا كنت تريد مخاطرة أوضح فافحص نوع الدرو داون. إذا كانت البيانات ناقصة فلا توجد بيانات كافية لحسم هذه النقطة.</p>
      </EmptySafeSection>
      <EmptySafeSection title="المصادر الرسمية" data={companies.flatMap(getOfficialSources)}>
        {companies.map((company) => <OfficialSources key={company.slug} company={company} />)}
      </EmptySafeSection>
      <WarningNote>المقارنة تعليمية وليست توصية مالية. تحقق من المصادر الرسمية قبل الدفع أو فتح حساب.</WarningNote>
    </Layout>
  );
}
