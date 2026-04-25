// ============================================
// ReviewPage.jsx - صفحة المراجعة
// ============================================

import React from 'react';
import CFDPropFirmReviewTemplate from '../components/templates/CFDPropFirmReviewTemplate';
import FuturesPropFirmReviewTemplate from '../components/templates/FuturesPropFirmReviewTemplate';
import CryptoPropFirmReviewTemplate from '../components/templates/CryptoPropFirmReviewTemplate';
import BrokerReviewTemplate from '../components/templates/BrokerReviewTemplate';
import CryptoExchangeReviewTemplate from '../components/templates/CryptoExchangeReviewTemplate';

export default function ReviewPage({ company }) {
  if (!company) return <div className="p-8 text-center text-slate-500">لا توجد بيانات متاحة</div>;

  const category = company?.category || company?.company_type;

  switch (category) {
    case 'cfd_prop_firm':
    case 'CFD Prop Firm':
    case 'cfd':
      return <CFDPropFirmReviewTemplate company={company} />;
    case 'futures_prop_firm':
    case 'Futures Prop Firm':
    case 'futures':
      return <FuturesPropFirmReviewTemplate company={company} />;
    case 'crypto_prop_firm':
    case 'Crypto Prop Firm':
    case 'crypto_prop':
      return <CryptoPropFirmReviewTemplate company={company} />;
    case 'broker':
    case 'Broker':
      return <BrokerReviewTemplate company={company} />;
    case 'crypto_exchange':
    case 'Crypto Exchange':
    case 'exchange':
      return <CryptoExchangeReviewTemplate company={company} />;
    default:
      return <CFDPropFirmReviewTemplate company={company} />;
  }
}
