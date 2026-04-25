// ============================================
// ComparisonPage.jsx - صفحة المقارنة
// ============================================

import React from 'react';
import CFDPropFirmComparisonTemplate from '../components/templates/CFDPropFirmComparisonTemplate';
import FuturesPropFirmComparisonTemplate from '../components/templates/FuturesPropFirmComparisonTemplate';
import BrokerComparisonTemplate from '../components/templates/BrokerComparisonTemplate';
import CryptoExchangeComparisonTemplate from '../components/templates/CryptoExchangeComparisonTemplate';

export default function ComparisonPage({ companies, category }) {
  if (!companies || companies.length === 0) return <div className="p-8 text-center text-slate-500">لا توجد شركات للمقارنة</div>;

  switch (category) {
    case 'cfd_prop_firm':
    case 'CFD Prop Firm':
    case 'cfd':
      return <CFDPropFirmComparisonTemplate companies={companies} />;
    case 'futures_prop_firm':
    case 'Futures Prop Firm':
    case 'futures':
      return <FuturesPropFirmComparisonTemplate companies={companies} />;
    case 'broker':
    case 'Broker':
      return <BrokerComparisonTemplate companies={companies} />;
    case 'crypto_prop_firm':
    case 'Crypto Prop Firm':
    case 'crypto_prop':
      return <CFDPropFirmComparisonTemplate companies={companies} />;
    case 'crypto_exchange':
    case 'Crypto Exchange':
    case 'exchange':
      return <CryptoExchangeComparisonTemplate companies={companies} />;
    default:
      return <CFDPropFirmComparisonTemplate companies={companies} />;
  }
}
