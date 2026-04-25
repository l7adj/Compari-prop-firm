import React from 'react';
import { buildRows, formatValue, getCategoryLabel, getCompanyName, getInitials, isPresent } from '../../utils/helpers';
import CryptoExchangeProductsTable from '../common/CryptoExchangeProductsTable';
import DataQualityBadge from '../common/DataQualityBadge';
import InfoTable from '../common/InfoTable';
import OfficialSources from '../common/OfficialSources';
import ProfessionalTraderAnalysis from '../common/ProfessionalTraderAnalysis';
import WarningNote from '../common/WarningNote';

export default function CryptoExchangeReviewTemplate({ company }) {
  if (!company) return null;
  const name = getCompanyName(company);
  const exchange = company.crypto_exchange_specific || {};
  const summaryRows = buildRows([
    { label: 'Spot Trading', value: exchange.spot_trading, type: 'boolean' },
    { label: 'Futures Trading', value: exchange.futures_trading, type: 'boolean' },
    { label: 'Margin Trading', value: exchange.margin_trading, type: 'boolean' },
    { label: 'P2P', value: exchange.p2p_trading, type: 'boolean' },
    { label: 'KYC', value: exchange.kyc_required, type: 'boolean' },
    { label: 'Proof of Reserves', value: exchange.proof_of_reserves, type: 'boolean' },
    { label: 'Maker Fee', value: exchange.maker_fee },
    { label: 'Taker Fee', value: exchange.taker_fee },
    { label: 'عدد العملات', value: exchange.supported_coins_count }
  ]);
  const securityRows = buildRows([
    { label: 'Proof of Reserves', value: exchange.proof_of_reserves, type: 'boolean' },
    { label: 'ميزات الأمان', value: exchange.security_features },
    { label: 'الوضع القانوني', value: company?.company_profile?.regulation_or_legal_status },
    { label: 'ملاحظات ثقة', value: company?.company_profile?.trust_notes },
    { label: 'إشارات إيجابية', value: company?.company_profile?.positive_signals },
    { label: 'ملاحظات مخاطر', value: company?.company_profile?.red_flags }
  ]);
  const arabRows = buildRows([
    { label: 'دعم العربية', value: company?.arab_user_relevance?.arabic_language_support, type: 'boolean' },
    { label: 'دول MENA المدعومة', value: company?.arab_user_relevance?.mena_countries_supported },
    { label: 'دول MENA المحظورة', value: company?.arab_user_relevance?.mena_countries_restricted || exchange.restricted_countries },
    { label: 'إيداع Fiat', value: exchange.fiat_deposit, type: 'boolean' },
    { label: 'P2P للمستخدم العربي', value: exchange.p2p_trading, type: 'boolean' },
    { label: 'طرق دفع مناسبة', value: company?.arab_user_relevance?.payment_methods_for_arab_users }
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
          {company.data_quality_status === 'partial' && <div className="mt-4"><WarningNote tone="warning">قسم منصات الكريبتو ما زال جزئيًا ويحتاج تحققًا دوريًا من الرسوم والقيود.</WarningNote></div>}
        </section>
        <InfoTable title="ملخص القرار السريع" rows={summaryRows} />
        <CryptoExchangeProductsTable data={exchange} />
        <InfoTable title="الأمان والثقة" rows={securityRows} />
        <InfoTable title="ملاءمة المستخدم العربي" rows={arabRows} />
        <ProfessionalTraderAnalysis summary={company.editorial_summary} />
        <OfficialSources company={company} />
        <WarningNote />
      </div>
    </main>
  );
}
