import React from 'react';
import { formatBoolean, formatMoney, formatPercent, formatValue, isPresent } from '../../utils/helpers';

export default function CryptoExchangeProductsTable({ data = {} }) {
  if (!isPresent(data)) return null;
  const products = [
    {
      product_type: 'Spot',
      available: data.spot_trading,
      maker_fee: data.maker_fee,
      taker_fee: data.taker_fee,
      kyc_required: data.kyc_required,
      p2p_trading: data.p2p_trading,
      fiat_deposit: data.fiat_deposit,
      proof_of_reserves: data.proof_of_reserves
    },
    {
      product_type: 'Futures',
      available: data.futures_trading,
      maker_fee: data.futures_maker_fee || data.maker_fee,
      taker_fee: data.futures_taker_fee || data.taker_fee,
      max_leverage: data.max_leverage,
      kyc_required: data.kyc_required,
      p2p_trading: data.p2p_trading,
      fiat_deposit: data.fiat_deposit,
      proof_of_reserves: data.proof_of_reserves
    },
    {
      product_type: 'Margin',
      available: data.margin_trading,
      maker_fee: data.maker_fee,
      taker_fee: data.taker_fee,
      kyc_required: data.kyc_required,
      p2p_trading: data.p2p_trading,
      fiat_deposit: data.fiat_deposit,
      proof_of_reserves: data.proof_of_reserves
    }
  ].filter((item) => isPresent(item.available));

  if (!products.length && !isPresent(data.maker_fee) && !isPresent(data.taker_fee)) return null;
  const rows = products.length ? products : [{ product_type: 'Trading', ...data }];

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <h3 className="border-b border-slate-200 px-5 py-4 text-lg font-bold text-slate-900">المنتجات والرسوم</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-right text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-bold">المنتج</th>
              <th className="px-4 py-3 font-bold">متاح</th>
              <th className="px-4 py-3 font-bold">Maker</th>
              <th className="px-4 py-3 font-bold">Taker</th>
              <th className="px-4 py-3 font-bold">أقصى رافعة</th>
              <th className="px-4 py-3 font-bold">KYC</th>
              <th className="px-4 py-3 font-bold">P2P</th>
              <th className="px-4 py-3 font-bold">Fiat</th>
              <th className="px-4 py-3 font-bold">Proof of Reserves</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={`${row.product_type}-${index}`} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 font-semibold">{formatValue(row.product_type)}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatBoolean(row.available)}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatPercent(row.maker_fee) || formatValue(row.maker_fee) || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatPercent(row.taker_fee) || formatValue(row.taker_fee) || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatValue(row.max_leverage) || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatBoolean(row.kyc_required) || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatBoolean(row.p2p_trading) || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatBoolean(row.fiat_deposit) || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatBoolean(row.proof_of_reserves) || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
