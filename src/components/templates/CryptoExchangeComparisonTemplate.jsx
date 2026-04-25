import React from 'react';
import ResponsiveCompareTable from '../common/ResponsiveCompareTable';
import WarningNote from '../common/WarningNote';

export default function CryptoExchangeComparisonTemplate({ companies = [] }) {
  const fields = [
    { path: 'crypto_exchange_specific.spot_trading', label: 'Spot' },
    { path: 'crypto_exchange_specific.futures_trading', label: 'Futures' },
    { path: 'crypto_exchange_specific.margin_trading', label: 'Margin' },
    { path: 'crypto_exchange_specific.p2p_trading', label: 'P2P' },
    { path: 'crypto_exchange_specific.kyc_required', label: 'KYC' },
    { path: 'crypto_exchange_specific.proof_of_reserves', label: 'Proof of Reserves' },
    { path: 'crypto_exchange_specific.maker_fee', label: 'Maker Fee' },
    { path: 'crypto_exchange_specific.taker_fee', label: 'Taker Fee' },
    { path: 'crypto_exchange_specific.supported_coins_count', label: 'عدد العملات' },
    { path: 'crypto_exchange_specific.fiat_deposit', label: 'Fiat Deposit' },
    { path: 'crypto_exchange_specific.restricted_countries', label: 'الدول المحظورة' },
    { path: 'crypto_exchange_specific.security_features', label: 'الأمان' },
    { path: 'data_quality_status', label: 'جودة البيانات' }
  ];
  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-black md:text-3xl">مقارنة منصات الكريبتو</h1>
        <ResponsiveCompareTable title="جدول المقارنة" companies={companies} fields={fields} />
        <WarningNote tone="info">لا يوجد فائز مطلق. تحقق من الرسوم، KYC، القيود، والسيولة قبل الاستخدام.</WarningNote>
      </div>
    </main>
  );
}
