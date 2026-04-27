document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initTabs();
  initAccordions();
  initFilters();
  initSearch();
  initCalculators();
  loadDatabase();
});

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const base = () => (location.pathname.startsWith('/Compari-prop-firm/') ? '/Compari-prop-firm/' : '/');

const categoryMeta = {
  cfd_prop_firm: { slug: 'cfd-prop-firms', label: 'شركات تمويل CFD' },
  futures_prop_firm: { slug: 'futures-prop-firms', label: 'شركات تمويل Futures' },
  crypto_prop_firm: { slug: 'crypto-prop-firms', label: 'شركات تمويل Crypto' },
  broker: { slug: 'brokers', label: 'بروكرات التداول' },
  crypto_exchange: { slug: 'crypto-exchanges', label: 'منصات تداول العملات الرقمية' }
};
const detailedFiles = {
  cfd_prop_firm: 'src/data/detailed/cfd-prop-firms.json',
  futures_prop_firm: 'src/data/detailed/futures-prop-firms.json',
  crypto_prop_firm: 'src/data/detailed/crypto-prop-firms.json',
  broker: 'src/data/detailed/brokers.json',
  crypto_exchange: 'src/data/detailed/crypto-exchanges.json'
};

let STORE = { index: [], detailed: {} };

function isMissing(v) {
  if (v == null) return true;
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t || t === 'غير متوفر' || /^\[[^\]]+\]$/.test(t)) return true;
  }
  if (Array.isArray(v)) return v.length === 0 || v.every(isMissing);
  return false;
}
function esc(v) {
  return String(v).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}
function safe(v) {
  if (isMissing(v)) return 'غير متوفر <span class="badge badge-verify">Needs Verification</span>';
  if (Array.isArray(v)) return v.map(x => safe(x)).join('، ');
  if (typeof v === 'object') return Object.entries(v).map(([k,val]) => `${esc(k)}: ${safe(val)}`).join(' | ');
  if (typeof v === 'boolean') return v ? 'نعم' : 'لا';
  return esc(v);
}
function getPath(obj, path) {
  return path.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
}
function pick(obj, paths) {
  for (const p of paths) {
    const v = getPath(obj, p);
    if (!isMissing(v)) return v;
  }
  return undefined;
}
function getPermissionFromList(list, keys) {
  if (!Array.isArray(list)) return undefined;
  const lowered = (keys || []).map(k => String(k).toLowerCase());
  const found = list.find(x => {
    const name = String(x?.rule || x?.name || x?.permission || x?.label || '').toLowerCase();
    return lowered.some(k => name.includes(k));
  });
  return found ? (found.allowed ?? found.value ?? found.status ?? found) : undefined;
}
function getTradingPermission(company, keys) {
  const direct = pick(company, ['program_groups.0.variants.0.trading_permissions']);
  const directMatch = getPermissionFromList(direct, keys);
  if (!isMissing(directMatch)) return directMatch;

  const groups = Array.isArray(company?.program_groups) ? company.program_groups : [];
  for (const group of groups) {
    const variants = Array.isArray(group?.variants) ? group.variants : [];
    for (const variant of variants) {
      const value = getPermissionFromList(variant?.trading_permissions, keys);
      if (!isMissing(value)) return value;
    }
  }
  return undefined;
}
function directValue(value) {
  return { __direct: true, value };
}
function qualityBadge(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('ready')) return '<span class="badge badge-ready">Ready</span>';
  if (s.includes('partial')) return '<span class="badge badge-partial">Partial</span>';
  return '<span class="badge badge-verify">Needs Verification</span>';
}
function logoUrl(i) { return i.logo || i.logo_url || i.logo_path || ''; }
function companyCell(item, logoOnly = false) {
  const name = pick(item, ['company_name']) || 'غير متوفر';
  const logo = logoUrl(item);
  const initials = String(name).split(/\s+/).slice(0, 2).map(x => x[0] || '').join('').toUpperCase() || '--';
  const media = logo ? `<img class="company-logo" src="${esc(logo)}" alt="${esc(name)}" loading="lazy" onerror="this.outerHTML='<span class=\'company-logo-fallback\'>${esc(initials)}</span>'">` : `<span class="company-logo-fallback">${esc(initials)}</span>`;
  return `<div class="company-cell">${media}${logoOnly ? '' : `<span class="company-name-small" title="${esc(name)}">${esc(name)}</span>`}</div>`;
}
function currentCategory() {
  return Object.keys(categoryMeta).find(k => location.pathname.includes('/category/' + categoryMeta[k].slug + '/'));
}

function initMobileMenu() {
  const btn = $('.menu-btn'); const nav = $('.nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => nav.classList.toggle('open'));
  $$('.nav a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
}
function initTabs() {
  $$('.tabs-nav').forEach(nav => {
    nav.addEventListener('click', e => {
      const b = e.target.closest('button[data-tab]');
      if (!b) return;
      const root = nav.closest('.tabs-container') || document;
      $$('button[data-tab]', nav).forEach(x => x.classList.remove('active'));
      $$('.tab-panel', root).forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      const panel = $('#' + b.dataset.tab, root); if (panel) panel.classList.add('active');
    });
  });
}
function initAccordions() {
  document.addEventListener('click', e => {
    const b = e.target.closest('.accordion-btn');
    if (!b) return;
    b.closest('.accordion-item')?.classList.toggle('open');
  });
}
function initFilters() {
  const bar = $('.filters-bar[data-table-target]');
  if (!bar) return;
  bar.addEventListener('input', () => {
    const q = ($('#filter-search', bar)?.value || '').trim().toLowerCase();
    const table = $(bar.dataset.tableTarget);
    if (!table) return;
    $$('tbody tr', table).forEach(tr => tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none');
  });
}
function initSearch() {
  const input = $('#home-search');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    $$('#latest-reviews-body tr').forEach(tr => tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none');
  });
}
function initCalculators() {
  const bind = (id, fn) => { const el = $('#' + id); if (el) el.addEventListener('input', fn); };
  const n = id => parseFloat($('#' + id)?.value || 0) || 0;
  const set = (id, html) => { const el = $('#' + id); if (el) el.innerHTML = html; };
  const money = v => `$${(Number.isFinite(v) ? v : 0).toFixed(2)}`;
  const risk = () => { const c = n('risk-capital'), p = n('risk-percentage'); const r = (c * p) / 100; set('risk-result', `المبلغ المخاطر به: <b>${money(r)}</b><br>الرصيد بعد الخسارة: <b>${money(c - r)}</b>`); };
  const dd = () => { const s = n('dd-account-size'), p = n('dd-percentage'); const l = (s * p) / 100; set('dd-result', `الحد الأدنى المسموح: <b>${money(s - l)}</b><br>المبلغ الذي يمكن خسارته: <b>${money(l)}</b>`); };
  const be = () => { const e = n('be-entry-price'), u = n('be-units'), c = n('be-commission'); const b = u > 0 ? e + (c / u) : 0; set('be-result', `سعر التعادل: <b>$${b.toFixed(5)}</b>`); };
  ['risk-capital', 'risk-percentage'].forEach(id => bind(id, risk));
  ['dd-account-size', 'dd-percentage'].forEach(id => bind(id, dd));
  ['be-entry-price', 'be-units', 'be-commission'].forEach(id => bind(id, be));
}

async function loadDatabase() {
  try {
    const idxRes = await fetch(base() + 'src/data/index.json', { cache: 'no-store' });
    STORE.index = await idxRes.json();
    const detailEntries = await Promise.all(Object.entries(detailedFiles).map(async ([cat, file]) => {
      try {
        const r = await fetch(base() + file, { cache: 'no-store' });
        const j = await r.json();
        return [cat, (j.companies || []).map(c => ({ ...c, category: cat, category_label: categoryMeta[cat].label }))];
      } catch (_) { return [cat, []]; }
    }));
    STORE.detailed = Object.fromEntries(detailEntries);
    renderHome(STORE.index);
    renderCategory(STORE);
    renderReview(STORE);
    renderCompare(STORE);
  } catch (e) {
    console.error(e);
    renderHome([]);
    renderCategory({ index: [], detailed: {} });
    renderReview({ index: [], detailed: {} });
    renderCompare({ index: [], detailed: {} });
  }
}

function renderHome(data) {
  const body = $('#latest-reviews-body');
  if (!body) return;
  if (!data.length) {
    body.innerHTML = '<tr><td class="table-sticky-col" colspan="5">لا توجد بيانات كافية حالياً. سيتم عرض الشركات بعد ربط قاعدة البيانات.</td></tr>';
    return;
  }
  body.innerHTML = data.slice(0, 20).map(item => `<tr>
    <td class="table-sticky-col">${companyCell(item)}</td>
    <td>${safe(item.category_label)}</td>
    <td>${qualityBadge(item.data_quality_status)}</td>
    <td>${safe(item.last_checked)}</td>
    <td>${!isMissing(item.official_website) ? `<a class="btn btn-outline" href="${esc(item.official_website)}" target="_blank" rel="noopener">مصدر</a>` : safe('')}</td>
  </tr>`).join('');
}

function flattenCategoryRows(companies, cat) {
  return companies.map(c => {
    if (cat === 'cfd_prop_firm') {
      const v = pick(c, ['program_groups.0.variants.0.account_sizes.0']) || {};
      const variant = pick(c, ['program_groups.0.variants.0']) || {};
      return {
        company: c,
        program_type: pick(variant, ['program_type', 'challenge_model']),
        lowest_price: pick(v, ['price']),
        max_account_size: pick(v, ['account_size', 'max_account_size']),
        phase_1_target: pick(v, ['phase_1_target']),
        phase_2_target: pick(v, ['phase_2_target']),
        daily_drawdown: pick(v, ['daily_drawdown']),
        max_drawdown: pick(v, ['max_drawdown']),
        drawdown_type: pick(v, ['drawdown_type']),
        drawdown_basis: pick(v, ['drawdown_basis']),
        minimum_trading_days: pick(v, ['minimum_trading_days']),
        profit_split: pick(v, ['profit_split']),
        first_payout: pick(v, ['first_payout']),
        payout_frequency: pick(v, ['payout_frequency']),
        refund_policy: pick(v, ['refund_policy']),
        scaling_plan: pick(v, ['scaling_plan']),
        leverage: pick(c, ['leverage.forex', 'leverage']),
        commission: pick(variant, ['costs_and_execution.0.value']),
        news_trading: getTradingPermission(c, ['news']),
        ea_bots: getTradingPermission(c, ['ea', 'bot', 'algorithm']),
        copy_trading: getTradingPermission(c, ['copy']),
        martingale: getTradingPermission(c, ['martingale']),
        arbitrage: getTradingPermission(c, ['arbitrage']),
        hft: getTradingPermission(c, ['hft', 'high frequency']),
        forbidden_practices: pick(variant, ['hidden_rules_red_flags.0.hidden_rule']),
        platforms: pick(c, ['platforms'])
      };
    }
    if (cat === 'futures_prop_firm') {
      const p = pick(c, ['plans.0']) || {};
      return {
        company: c,
        monthly_fee: pick(p, ['monthly_fee']),
        activation_fee: pick(p, ['activation_fee']),
        data_fee: pick(p, ['data_fee']),
        reset_fee: pick(p, ['reset_fee']),
        trailing_drawdown: pick(p, ['trailing_drawdown']),
        static_drawdown: pick(p, ['static_drawdown']),
        max_contracts: pick(p, ['max_contracts']),
        micros_allowed: pick(c, ['contract_rules.0.micros_allowed']),
        platforms: pick(c, ['platforms']),
        data_feed: pick(c, ['data_feed.provider', 'data_feed']),
        payout: pick(p, ['first_payout'])
      };
    }
    if (cat === 'crypto_prop_firm') {
      const p = pick(c, ['programs.0']) || {};
      return {
        company: c,
        market_type: pick(p, ['market_type']),
        spot: pick(c, ['market_access.spot']),
        perpetual: pick(c, ['market_access.perpetual']),
        margin: pick(c, ['market_access.margin']),
        cfd_crypto: pick(c, ['market_access.cfd_crypto']),
        maker_fee: pick(c, ['fees.maker_fee']),
        taker_fee: pick(c, ['fees.taker_fee']),
        leverage: pick(p, ['max_leverage']),
        liquidation: pick(c, ['risk_rules.liquidation_rules']),
        kyc: pick(c, ['kyc_and_payouts.kyc_required']),
        api: pick(c, ['api_and_bots.api_trading']),
        bots: pick(c, ['api_and_bots.bots_allowed'])
      };
    }
    if (cat === 'broker') {
      const a = pick(c, ['account_types.0']) || {};
      return {
        company: c,
        regulators: pick(c, ['regulation_and_trust.regulators']),
        legal_entities: pick(c, ['regulation_and_trust.legal_entities']),
        jurisdictions: pick(c, ['regulation_and_trust.jurisdictions']),
        spread_from: pick(a, ['spread_from']),
        commission: pick(a, ['commission']),
        execution: pick(c, ['platforms_and_markets.execution_model']),
        deposit: pick(c, ['deposit_and_withdrawal.0.method']),
        withdrawal: pick(c, ['deposit_and_withdrawal.1.method', 'deposit_and_withdrawal.0.method']),
        islamic_account: pick(c, ['arab_user_relevance.islamic_account']),
        arabic_support: pick(c, ['arab_user_relevance.arabic_support'])
      };
    }
    return {
      company: c,
      products: pick(c, ['products']),
      maker_fee: pick(c, ['fees.maker_fee']),
      taker_fee: pick(c, ['fees.taker_fee']),
      kyc_tiers: pick(c, ['kyc_and_restrictions.kyc_tiers']),
      proof_of_reserves: pick(c, ['security_and_reserves.proof_of_reserves']),
      security: pick(c, ['security_and_reserves']),
      fiat: pick(c, ['fiat_and_p2p.fiat_deposit']),
      p2p: pick(c, ['fiat_and_p2p.p2p']),
      api: pick(c, ['liquidity_and_api.api']),
      liquidity: pick(c, ['liquidity_and_api.liquidity']),
      restrictions: pick(c, ['kyc_and_restrictions.restricted_countries'])
    };
  });
}

function renderCategory(store) {
  const cat = currentCategory();
  if (!cat) return;
  const companies = (store.detailed[cat] && store.detailed[cat].length) ? store.detailed[cat] : store.index.filter(x => x.category === cat);
  const rows = flattenCategoryRows(companies, cat);
  const body = $('#category-table-body');
  const title = $('#category-title');
  if (title) title.textContent = categoryMeta[cat].label;
  const cards = $('#category-cards');
  if (cards) {
    if (!rows.length) {
      cards.innerHTML = '<article class="card"><h3>لا توجد بيانات كافية حالياً</h3><p>سيتم عرض الشركات بعد ربط قاعدة البيانات.</p></article>';
    } else {
    cards.innerHTML = rows.map(r => `<article class="company-card panel"><h3>${companyCell(r.company)}</h3><div class="metric-grid"><div class="metric"><small>الحالة</small><div>${qualityBadge(r.company.data_status || r.company.data_quality_status)}</div></div><div class="metric"><small>آخر تحقق</small><div>${safe(r.company.last_checked)}</div></div><div class="metric"><small>ملخص</small><div>${safe(r.company.summary)}</div></div></div></article>`).join('');
    }
  }
  if (!body) return;
  if (!rows.length) {
    const colCount = $$('thead th', $('#category-summary-table') || document).length || 1;
    body.innerHTML = `<tr><td class="table-sticky-col" colspan="${colCount}">لا توجد بيانات كافية حالياً. سيتم عرض الشركات بعد ربط قاعدة البيانات.</td></tr>`;
    renderCompanyDetails([], cat);
    return;
  }

  const headers = $$('thead th', $('#category-summary-table')).map(th => th.textContent.trim());
  body.innerHTML = rows.map(r => `<tr>${
    headers.map((h, i) => `<td class="${i===0?'table-sticky-col':''}">${
      h === 'Review'
        ? `<a class="btn btn-outline" href="${base()}review/?category=${cat}&company=${encodeURIComponent(r.company.company_name || '')}">Review</a>`
        : h === 'Compare'
          ? `<a class="btn btn-outline" href="${base()}compare/?category=${cat}&a=${encodeURIComponent(r.company.company_name || '')}">Compare</a>`
          : categoryCellValue(cat, r, h)
    }</td>`).join('')
  }</tr>`).join('');

  renderCompanyDetails(companies, cat);
}

function categoryCellValue(cat, row, header) {
  const c = row.company;
  const direct = {
    'الشركة': companyCell(c), 'المنصة': companyCell(c),
    'Data Status': qualityBadge(c.data_status || c.data_quality_status), 'حالة البيانات': qualityBadge(c.data_status || c.data_quality_status),
    'Last Checked': safe(c.last_checked), 'آخر تحقق': safe(c.last_checked)
  };
  if (direct[header] != null) return direct[header];
  const mapByCat = {
    cfd_prop_firm: {
      'Program Type': ['program_groups.0.variants.0.program_type'], 'Lowest Price': ['program_groups.0.variants.0.account_sizes.0.price'], 'Max Account Size': ['program_groups.0.variants.0.account_sizes.0.account_size'],
      'Phase 1 Target': ['program_groups.0.variants.0.account_sizes.0.phase_1_target'], 'Phase 2 Target': ['program_groups.0.variants.0.account_sizes.0.phase_2_target'], 'Phase 3 Target': ['program_groups.0.variants.0.account_sizes.0.phase_3_target'],
      'Daily Drawdown': ['program_groups.0.variants.0.account_sizes.0.daily_drawdown'], 'Max Drawdown': ['program_groups.0.variants.0.account_sizes.0.max_drawdown'],
      'Drawdown Type': ['program_groups.0.variants.0.account_sizes.0.drawdown_type'], 'Drawdown Basis': ['program_groups.0.variants.0.account_sizes.0.drawdown_basis'],
      'Minimum Trading Days': ['program_groups.0.variants.0.account_sizes.0.minimum_trading_days'], 'Maximum Trading Days': ['program_groups.0.variants.0.account_sizes.0.maximum_trading_days'],
      'Consistency Rule': ['program_groups.0.variants.0.phase_rules.0.consistency_rule'], 'Profit Split': ['program_groups.0.variants.0.account_sizes.0.profit_split'], 'First Payout': ['program_groups.0.variants.0.account_sizes.0.first_payout'],
      'Payout Frequency': ['program_groups.0.variants.0.account_sizes.0.payout_frequency'], 'Refund Policy': ['program_groups.0.variants.0.account_sizes.0.refund_policy'], 'Scaling Plan': ['program_groups.0.variants.0.account_sizes.0.scaling_plan'],
      'Forex Leverage': ['leverage.forex'], 'Indices Leverage': ['leverage.indices'], 'Metals Leverage': ['leverage.metals'], 'Crypto Leverage': ['leverage.crypto'],
      'Commission': ['program_groups.0.variants.0.costs_and_execution.0.value'], 'Spread Notes': ['program_groups.0.variants.0.costs_and_execution.1.value'],
      'News Trading': directValue(getTradingPermission(c, ['news'])), 'Weekend Holding': directValue(getTradingPermission(c, ['weekend'])), 'Overnight Holding': directValue(getTradingPermission(c, ['overnight'])),
      'EA/Bots': directValue(getTradingPermission(c, ['ea', 'bot', 'algorithm'])), 'Copy Trading': directValue(getTradingPermission(c, ['copy'])), 'Hedging': directValue(getTradingPermission(c, ['hedg'])),
      'Martingale': directValue(getTradingPermission(c, ['martingale'])), 'Arbitrage': directValue(getTradingPermission(c, ['arbitrage'])), 'HFT': directValue(getTradingPermission(c, ['hft', 'high frequency'])),
      'Forbidden Practices': ['program_groups.0.variants.0.hidden_rules_red_flags.0.hidden_rule'], 'Platforms': ['platforms']
    },
    futures_prop_firm: {
      'Billing Type': ['plans.0.billing_type'], 'Lowest Monthly Price': ['plans.0.monthly_fee'], 'Max Account Size': ['plans.0.account_size'], 'Profit Target': ['plans.0.profit_target'],
      'Daily Loss Limit': ['plans.0.daily_loss_limit'], 'Max Loss Limit': ['plans.0.max_loss_limit'], 'Trailing Drawdown': ['plans.0.trailing_drawdown'], 'EOD Drawdown': ['plans.0.eod_drawdown'],
      'Static Drawdown': ['plans.0.static_drawdown'], 'Drawdown Lock': ['plans.0.drawdown_lock'], 'Max Contracts': ['plans.0.max_contracts'], 'Micros Allowed': ['contract_rules.0.micros_allowed'],
      'Scaling Rules': ['contract_rules.0.scaling_rules'], 'Activation Fee': ['plans.0.activation_fee'], 'Data Fee': ['plans.0.data_fee'], 'Reset Fee': ['plans.0.reset_fee'], 'Platform Fee': ['plans.0.platform_fee'],
      'Exchanges': ['exchanges'], 'Products': ['products'], 'Platforms': ['platforms'], 'Data Feed': ['data_feed.provider', 'data_feed'], 'News Trading': ['trading_rules.0.news_trading'],
      'Overnight Holding': ['trading_rules.0.overnight_holding'], 'First Payout': ['plans.0.first_payout'], 'Payout Frequency': ['plans.0.payout_frequency'], 'Payout Cap': ['plans.0.payout_cap'], 'Consistency Rule': ['plans.0.consistency_rule']
    },
    crypto_prop_firm: {
      'Market Type': ['programs.0.market_type'], 'Program Type': ['programs.0.program_type'], 'Lowest Price': ['programs.0.price'], 'Max Account Size': ['programs.0.account_size'],
      'Profit Target': ['programs.0.profit_target'], 'Daily Drawdown': ['programs.0.daily_drawdown'], 'Max Drawdown': ['programs.0.max_drawdown'], 'Crypto Leverage': ['programs.0.max_leverage'],
      'Max Position Size': ['risk_rules.max_position_size'], 'Supported Pairs': ['supported_pairs'], 'Spot': ['market_access.spot'], 'Perpetual Futures': ['market_access.perpetual'],
      'Margin': ['market_access.margin'], 'CFD Crypto': ['market_access.cfd_crypto'], 'Maker Fee': ['fees.maker_fee'], 'Taker Fee': ['fees.taker_fee'], 'Funding Fees': ['fees.funding_fees'],
      'Liquidation Rules': ['risk_rules.liquidation_rules'], 'KYC Required': ['kyc_and_payouts.kyc_required'], 'Payout Method': ['kyc_and_payouts.payout_method'], 'Payout Currency': ['kyc_and_payouts.payout_currency'],
      'Weekend Trading': ['risk_rules.weekend_trading'], 'API Trading': ['api_and_bots.api_trading'], 'Bots Allowed': ['api_and_bots.bots_allowed']
    },
    broker: {
      'Regulators': ['regulation_and_trust.regulators'], 'Legal Entities': ['regulation_and_trust.legal_entities'], 'Jurisdictions': ['regulation_and_trust.jurisdictions'],
      'Client Fund Segregation': ['regulation_and_trust.client_fund_segregation'], 'Negative Balance Protection': ['regulation_and_trust.negative_balance_protection'],
      'Investor Compensation': ['regulation_and_trust.investor_compensation'], 'Minimum Deposit': ['account_types.0.minimum_deposit'], 'Account Types': ['account_types'], 'Base Currencies': ['account_types.0.base_currencies'],
      'Spread From': ['account_types.0.spread_from'], 'Spread Type': ['account_types.0.spread_type'], 'Commission': ['account_types.0.commission'], 'Execution Model': ['platforms_and_markets.execution_model'],
      'Max Leverage': ['account_types.0.max_leverage'], 'Min Lot Size': ['account_types.0.min_lot_size'], 'Islamic Account': ['arab_user_relevance.islamic_account'], 'Demo Account': ['account_types.0.demo_account'],
      'Platforms': ['platforms'], 'Markets': ['markets'], 'Deposit Methods': ['deposit_and_withdrawal.0.method'], 'Withdrawal Methods': ['deposit_and_withdrawal.1.method', 'deposit_and_withdrawal.0.method'],
      'Deposit Fees': ['deposit_and_withdrawal.0.fee'], 'Withdrawal Fees': ['deposit_and_withdrawal.1.fee'], 'Inactivity Fee': ['fees.inactivity_fee'], 'Swap Policy': ['fees.swap_policy'],
      'Arabic Website': ['arab_user_relevance.arabic_website'], 'Arabic Support': ['arab_user_relevance.arabic_support'], 'MENA Restrictions': ['arab_user_relevance.mena_restrictions']
    },
    crypto_exchange: {
      'Spot': ['products.spot'], 'Futures': ['products.futures'], 'Margin': ['products.margin'], 'Options': ['products.options'], 'P2P': ['products.p2p'], 'Earn': ['products.earn'], 'Launchpad': ['products.launchpad'],
      'Maker Fee': ['fees.maker_fee'], 'Taker Fee': ['fees.taker_fee'], 'Futures Fees': ['fees.futures_fees'], 'Withdrawal Fees': ['fees.withdrawal_fees'], 'Max Leverage': ['fees.max_leverage'],
      'KYC Required': ['kyc_and_restrictions.kyc_required'], 'KYC Tiers': ['kyc_and_restrictions.kyc_tiers'], 'Proof of Reserves': ['security_and_reserves.proof_of_reserves'],
      'Cold Storage': ['security_and_reserves.cold_storage'], '2FA': ['security_and_reserves.two_fa'], 'Withdrawal Whitelist': ['security_and_reserves.withdrawal_whitelist'], 'Insurance Fund': ['security_and_reserves.insurance_fund'],
      'Fiat Deposit': ['fiat_and_p2p.fiat_deposit'], 'Local Currency Support': ['fiat_and_p2p.local_currency_support'], 'Arabic Interface': ['arab_user_relevance.arabic_interface'],
      'Restricted Countries': ['kyc_and_restrictions.restricted_countries'], 'API': ['liquidity_and_api.api'], 'Liquidity': ['liquidity_and_api.liquidity'], 'Products': ['products'], 'Security': ['security_and_reserves'], 'Fiat': ['fiat_and_p2p.fiat_deposit'], 'Restrictions': ['kyc_and_restrictions.restricted_countries']
    }
  };
  const candidate = (mapByCat[cat] || {})[header];
  if (candidate && candidate.__direct) return safe(candidate.value);
  const val = Array.isArray(candidate) ? pick(c, candidate) : undefined;
  return safe(val);
}

function renderCompanyDetails(companies, cat) {
  const host = $('#category-details');
  if (!host) return;
  if (!companies.length) {
    host.innerHTML = '<article class="card"><h3>لا توجد تفاصيل متاحة حالياً</h3><p>يرجى التحقق لاحقاً بعد تحديث قاعدة البيانات.</p></article>';
    return;
  }
  host.innerHTML = companies.map(c => `<article class="company-card panel"><h3>${companyCell(c)}</h3><p>${safe(c.summary)}</p><div class="source-block">المصدر الرسمي: ${!isMissing(c.official_website) ? `<a href="${esc(c.official_website)}" target="_blank" rel="noopener">${esc(c.official_website)}</a>` : safe('')}</div><div class="source-block">التصنيف: ${categoryMeta[cat].label}</div><details class="raw-details"><summary>عرض كل حقول قاعدة البيانات</summary><pre>${esc(JSON.stringify(c, null, 2))}</pre></details></article>`).join('');
}

function renderReview(store) {
  if (!$('#review-company')) return;
  const params = new URLSearchParams(location.search);
  const catSel = $('#review-category');
  const compSel = $('#review-company');
  const state = { cat: params.get('category') || catSel.value, item: null };
  if (categoryMeta[state.cat]) catSel.value = state.cat;

  const refillCompanies = () => {
    const list = (store.detailed[state.cat] && store.detailed[state.cat].length) ? store.detailed[state.cat] : store.index.filter(x => x.category === state.cat);
    if (!list.length) {
      compSel.innerHTML = '<option value="">لا توجد شركات متاحة</option>';
      state.item = null;
      return;
    }
    compSel.innerHTML = list.map((c, i) => `<option value="${i}">${esc(c.company_name || 'غير متوفر')}</option>`).join('');
    const fromUrlCompany = params.get('company');
    const fromUrlIdx = list.findIndex(x => String(x.company_name || '') === String(fromUrlCompany || ''));
    const selectedIndex = fromUrlIdx >= 0 ? fromUrlIdx : 0;
    compSel.value = String(selectedIndex);
    state.item = list[selectedIndex] || null;
    compSel.onchange = () => { state.item = list[parseInt(compSel.value, 10)] || null; draw(); };
  };

  const draw = () => {
    const c = state.item;
    if (!c) {
      $('#review-header').innerHTML = '<div class="info-box">لا توجد بيانات كافية حالياً. سيتم عرض الشركات بعد ربط قاعدة البيانات.</div>';
      $('#review-metrics').innerHTML = '';
      $('#review-tabs').innerHTML = '';
      return;
    }
    $('#review-header').innerHTML = `<div class="panel"><h2>${companyCell(c)}</h2><p>${categoryMeta[state.cat].label} | ${qualityBadge(c.data_status || c.data_quality_status)}</p><p>آخر تحقق: ${safe(c.last_checked)}</p><p>${!isMissing(c.official_website) ? `<a class="btn btn-outline" href="${esc(c.official_website)}" target="_blank" rel="noopener">المصدر الرسمي</a>` : safe('')}</p><a class="btn" href="${base()}compare/?category=${state.cat}&a=${encodeURIComponent(c.company_name || '')}">قارن هذه الشركة مع...</a></div>`;
    $('#review-metrics').innerHTML = `<div class="metric-grid"><div class="metric"><small>أقل سعر / أقل إيداع</small><div>${safe(pick(c,['lowest_price_or_deposit.value','program_groups.0.variants.0.account_sizes.0.price','plans.0.monthly_fee','fees.maker_fee']))}</div></div><div class="metric"><small>أكبر حساب / أكبر منتج</small><div>${safe(pick(c,['max_account_size','program_groups.0.variants.0.account_sizes.0.account_size','plans.0.account_size']))}</div></div><div class="metric"><small>عدد البرامج/الحسابات</small><div>${safe((c.program_groups||c.programs||c.plans||c.account_types||c.products_and_fees||[]).length)}</div></div><div class="metric"><small>مستوى الخطر</small><div>${safe(pick(c,['risk_level','risk_rules.liquidation_rules']))}</div></div><div class="metric"><small>ثقة البيانات</small><div>${safe(c.data_confidence || c.data_status || c.data_quality_status)}</div></div><div class="metric"><small>عدد البيانات الناقصة</small><div>${countMissing(c)}</div></div></div>`;
    renderReviewTabs(c, state.cat);
  };

  catSel.onchange = () => { state.cat = catSel.value; refillCompanies(); draw(); };
  refillCompanies(); draw();
}
function countMissing(obj) {
  let n = 0; const walk = x => { if (isMissing(x)) n += 1; else if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') Object.values(x).forEach(walk); };
  walk(obj); return n;
}
function tableRows(rows) { return `<div class="table-wrapper"><table><tbody>${rows.map(r=>`<tr><td class="table-sticky-col">${esc(r[0])}</td><td>${safe(r[1])}</td></tr>`).join('')}</tbody></table></div>`; }
function renderVariantAccordion(variants) {
  return (variants || []).map((v, i) => `<div class="accordion-item ${i===0?'open':''}"><button class="accordion-btn">${safe(v.variant_name || v.plan_name || v.program_name || v.account_type || 'Variant')}</button><div class="accordion-body">${tableRows([
    ['Account Size', pick(v,['account_sizes.0.account_size','account_size'])], ['Price', pick(v,['account_sizes.0.price','price','monthly_fee'])], ['Profit Target', pick(v,['account_sizes.0.phase_1_target','profit_target'])], ['Daily Drawdown', pick(v,['account_sizes.0.daily_drawdown','daily_drawdown'])], ['Max Drawdown', pick(v,['account_sizes.0.max_drawdown','max_drawdown'])], ['Platforms', pick(v,['platforms'])]
  ])}<div class="source-block">Trading Permissions: ${safe(getPermissionFromList(v.trading_permissions, ['news', 'weekend', 'overnight', 'ea', 'bot', 'copy', 'hedg', 'martingale', 'arbitrage', 'hft']))}</div><div class="source-block">Forbidden Practices: ${safe(pick(v,['hidden_rules_red_flags.0.hidden_rule']))}</div><div class="source-block">Source: ${safe(pick(v,['official_source']))} | Last Checked: ${safe(pick(v,['last_checked']))}</div></div></div>`).join('');
}
function renderReviewTabs(c, cat) {
  const tabMap = {
    cfd_prop_firm: ['Overview','One Phase','Two Phase','Three Phase','Instant Funding','Drawdown Rules','Trading Rules','Payouts','Fees','Platforms','Trust','Arab User','Hidden Rules','Sources'],
    futures_prop_firm: ['Overview','Plans & Fees','Drawdown Mechanics','Contract Rules','Platforms & Data','Payout Rules','Hidden Rules','Arab User','Sources'],
    crypto_prop_firm: ['Overview','Market Type','Account Sizes','Fees','Risk & Liquidation','API & Bots','KYC & Payout','Hidden Rules','Arab User','Sources'],
    broker: ['Overview','Regulation','Account Types','Trading Costs','Execution','Deposit & Withdrawal','Fees','Islamic Account','Arab User','Hidden Risks','Sources'],
    crypto_exchange: ['Overview','Products','Fees','KYC & Limits','Security','Fiat & P2P','API & Liquidity','Restrictions','Hidden Risks','Arab User','Sources']
  };
  const tabs = tabMap[cat] || ['Overview'];
  $('#review-tabs').innerHTML = `<div class="tabs-container"><div class="tabs-nav">${tabs.map((t,i)=>`<button data-tab="rt-${i}" class="${i===0?'active':''}">${t}</button>`).join('')}</div>${tabs.map((t,i)=>`<section id="rt-${i}" class="tab-panel ${i===0?'active':''}">${reviewTabContent(t,c,cat)}</section>`).join('')}</div>`;
  initTabs();
}
function reviewTabContent(tab, c, cat) {
  if (tab === 'Overview') return `<div class="panel"><p>${safe(c.summary)}</p></div>`;
  if (cat === 'cfd_prop_firm' && ['One Phase','Two Phase','Three Phase','Instant Funding'].includes(tab)) {
    const type = { 'One Phase':'one_phase','Two Phase':'two_phase','Three Phase':'three_phase','Instant Funding':'instant_funding' }[tab];
    const group = (c.program_groups || []).find(g => g.group_type === type) || {};
    return renderVariantAccordion(group.variants);
  }
  if (tab === 'Hidden Rules' || tab === 'Hidden Risks') {
    const rules = pick(c,['program_groups.0.variants.0.hidden_rules_red_flags']) || pick(c,['hidden_rules']) || [];
    return (rules || []).map(r=>`<article class="company-card panel"><h4>${safe(r.hidden_rule || r.rule_name)}</h4><p>${safe(r.what_it_means || r.description)}</p><p>${safe(r.risk_level || r.severity || 'Needs Verification')}</p><div class="source-block">Source: ${safe(r.where_to_verify || r.source)} ${!isMissing(r.source_url)?`| <a href="${esc(r.source_url)}" target="_blank" rel="noopener">URL</a>`:''}</div><div class="source-block">Verification Status: ${safe(r.status || r.verification_status)} | Last Checked: ${safe(r.last_checked)}</div></article>`).join('') || `<div class="panel">${safe('')}</div>`;
  }
  const tabRows = {
    'Drawdown Rules': [['Daily Drawdown', pick(c,['program_groups.0.variants.0.account_sizes.0.daily_drawdown'])],['Max Drawdown',pick(c,['program_groups.0.variants.0.account_sizes.0.max_drawdown'])]],
    'Trading Rules': [
      ['News Trading', getTradingPermission(c,['news'])],
      ['Weekend Holding', getTradingPermission(c,['weekend'])],
      ['Overnight Holding', getTradingPermission(c,['overnight'])],
      ['EA/Bots', getTradingPermission(c,['ea', 'bot', 'algorithm'])],
      ['Copy Trading', getTradingPermission(c,['copy'])],
      ['Hedging', getTradingPermission(c,['hedg'])],
      ['Martingale', getTradingPermission(c,['martingale'])],
      ['Arbitrage', getTradingPermission(c,['arbitrage'])],
      ['HFT', getTradingPermission(c,['hft', 'high frequency'])]
    ],
    'Payouts': [['Profit Split', pick(c,['program_groups.0.variants.0.account_sizes.0.profit_split'])],['First Payout',pick(c,['program_groups.0.variants.0.account_sizes.0.first_payout'])]],
    'Fees': [['Price/Fee', pick(c,['program_groups.0.variants.0.account_sizes.0.price','plans.0.monthly_fee','fees.maker_fee'])],['Refund',pick(c,['program_groups.0.variants.0.account_sizes.0.refund_policy'])]],
    'Platforms': [['Platforms', pick(c,['platforms'])],['Markets',pick(c,['markets'])]],
    'Trust': [['Data Status', c.data_status || c.data_quality_status],['Official Website', c.official_website]],
    'Arab User': [['Arabic Support', pick(c,['arab_user_relevance.arabic_support'])],['MENA Restrictions',pick(c,['arab_user_relevance.mena_restrictions'])]],
    'Sources': [['Official Source', pick(c,['official_sources.0.url','official_website'])],['Last Checked',c.last_checked]],
    'Plans & Fees': [['Monthly Fee', pick(c,['plans.0.monthly_fee'])],['Activation Fee',pick(c,['plans.0.activation_fee'])],['Reset Fee',pick(c,['plans.0.reset_fee'])],['Data Fee',pick(c,['plans.0.data_fee'])],['Platform Fee',pick(c,['plans.0.platform_fee'])]],
    'Drawdown Mechanics': [['Trailing Drawdown', pick(c,['plans.0.trailing_drawdown'])],['EOD Drawdown',pick(c,['plans.0.eod_drawdown'])],['Static Drawdown',pick(c,['plans.0.static_drawdown'])],['Drawdown Lock',pick(c,['plans.0.drawdown_lock'])],['يشمل الربح غير المحقق',pick(c,['plans.0.includes_unrealized_profit'])]],
    'Contract Rules': [['Max Contracts', pick(c,['contract_rules.0.max_contracts'])],['Micros Allowed',pick(c,['contract_rules.0.micros_allowed'])],['Scaling Rules',pick(c,['contract_rules.0.scaling_rules'])],['Products',pick(c,['products'])],['Restrictions',pick(c,['contract_rules.0.restrictions'])]],
    'Platforms & Data': [['Platforms',pick(c,['platforms'])],['Data Feed',pick(c,['data_feed.provider','data_feed'])]],
    'Market Type': [['Spot',pick(c,['market_access.spot'])],['Perpetual',pick(c,['market_access.perpetual'])],['Margin',pick(c,['market_access.margin'])],['CFD Crypto',pick(c,['market_access.cfd_crypto'])]],
    'Account Sizes': [['Account Size',pick(c,['programs.0.account_size'])],['Max Position Size',pick(c,['risk_rules.max_position_size'])]],
    'Risk & Liquidation': [['Liquidation Rules',pick(c,['risk_rules.liquidation_rules'])],['Funding Fees',pick(c,['fees.funding_fees'])]],
    'API & Bots': [['API Trading',pick(c,['api_and_bots.api_trading'])],['Bots Allowed',pick(c,['api_and_bots.bots_allowed'])]],
    'KYC & Payout': [['KYC Required',pick(c,['kyc_and_payouts.kyc_required'])],['Payout Method',pick(c,['kyc_and_payouts.payout_method'])],['Payout Currency',pick(c,['kyc_and_payouts.payout_currency'])]],
    'Regulation': [['Regulators',pick(c,['regulation_and_trust.regulators'])],['Legal Entities',pick(c,['regulation_and_trust.legal_entities'])],['License Numbers',pick(c,['regulation_and_trust.license_numbers'])]],
    'Account Types': [['Account Types',pick(c,['account_types.0.account_type'])],['Minimum Deposit',pick(c,['account_types.0.minimum_deposit'])]],
    'Trading Costs': [['Spread From',pick(c,['account_types.0.spread_from'])],['Commission',pick(c,['account_types.0.commission'])]],
    'Execution': [['Execution Model',pick(c,['platforms_and_markets.execution_model'])],['Platforms',pick(c,['platforms'])]],
    'Deposit & Withdrawal': [['Methods',pick(c,['deposit_and_withdrawal.0.method'])],['Processing Time',pick(c,['deposit_and_withdrawal.0.processing_time'])]],
    'Islamic Account': [['Islamic Account',pick(c,['arab_user_relevance.islamic_account'])],['Arabic Support',pick(c,['arab_user_relevance.arabic_support'])]],
    'Products': [['Spot',pick(c,['products.spot'])],['Futures',pick(c,['products.futures'])],['Margin',pick(c,['products.margin'])],['Options',pick(c,['products.options'])],['P2P',pick(c,['products.p2p'])]],
    'KYC & Limits': [['KYC Tiers',pick(c,['kyc_and_restrictions.kyc_tiers'])],['Limits',pick(c,['kyc_and_restrictions.withdrawal_limits'])]],
    'Security': [['Proof of Reserves',pick(c,['security_and_reserves.proof_of_reserves'])],['Cold Storage',pick(c,['security_and_reserves.cold_storage'])],['2FA',pick(c,['security_and_reserves.two_fa'])]],
    'Fiat & P2P': [['Fiat Deposit',pick(c,['fiat_and_p2p.fiat_deposit'])],['Local Currency',pick(c,['fiat_and_p2p.local_currency_support'])]],
    'API & Liquidity': [['API',pick(c,['liquidity_and_api.api'])],['Liquidity',pick(c,['liquidity_and_api.liquidity'])]],
    'Restrictions': [['Restricted Countries',pick(c,['kyc_and_restrictions.restricted_countries'])],['Arabic Interface',pick(c,['arab_user_relevance.arabic_interface'])]]
  };
  return tableRows(tabRows[tab] || [['الحالة', 'غير متوفر']]);
}

function renderCompare(store) {
  if (!$('#compare-category')) return;
  const params = new URLSearchParams(location.search);
  const catSel = $('#compare-category');
  const aSel = $('#compare-a');
  const bSel = $('#compare-b');
  const cSel = $('#compare-c');
  const axisSel = $('#compare-axis');
  const out = $('#compare-output');
  const state = { cat: params.get('category') || catSel.value, items: [] };
  if (categoryMeta[state.cat]) catSel.value = state.cat;

  const axisMap = {
    cfd_prop_firm: ['Overview','Account Sizes & Prices','Challenge Phases','Drawdown Rules','Trading Rules','Payout Rules','Costs & Execution','Hidden Rules','Arab User'],
    futures_prop_firm: ['Overview','Plans & Fees','Drawdown Mechanics','Contract Rules','Platforms & Data','Payout Rules','Hidden Rules'],
    crypto_prop_firm: ['Overview','Market Type','Account Sizes & Prices','Fees','Risk & Liquidation','API & Bots','KYC & Payout','Hidden Rules'],
    broker: ['Overview','Regulation & Trust','Account Types','Trading Costs','Execution','Deposit & Withdrawal','Islamic Account','Arab User','Hidden Risks'],
    crypto_exchange: ['Overview','Products','Fees','KYC & Limits','Security','Fiat & P2P','API & Liquidity','Restrictions','Hidden Risks']
  };

  function refill() {
    state.cat = catSel.value;
    state.items = (store.detailed[state.cat] && store.detailed[state.cat].length) ? store.detailed[state.cat] : store.index.filter(x => x.category === state.cat);
    if (!state.items.length) {
      [aSel,bSel,cSel].forEach(s => s.innerHTML = '<option value="">لا توجد شركات متاحة</option>');
      axisSel.innerHTML = '<option>Overview</option>';
      out.innerHTML = '<div class="info-box">لا توجد بيانات كافية حالياً. سيتم عرض الشركات بعد ربط قاعدة البيانات.</div>';
      return;
    }
    [aSel,bSel,cSel].forEach(s => s.innerHTML = '<option value="">--</option>' + state.items.map((x,i)=>`<option value="${i}">${esc(x.company_name || 'غير متوفر')}</option>`).join(''));
    const idxA = state.items.findIndex(x => String(x.company_name || '') === String(params.get('a') || ''));
    const idxB = state.items.findIndex(x => String(x.company_name || '') === String(params.get('b') || ''));
    const idxC = state.items.findIndex(x => String(x.company_name || '') === String(params.get('c') || ''));
    if (idxA >= 0) aSel.value = String(idxA);
    if (idxB >= 0) {
      bSel.value = String(idxB);
    } else if (idxA >= 0) {
      const fallbackB = state.items.findIndex((_, i) => i !== idxA);
      if (fallbackB >= 0) bSel.value = String(fallbackB);
    }
    if (idxC >= 0) cSel.value = String(idxC);
    axisSel.innerHTML = axisMap[state.cat].map(x => `<option>${x}</option>`).join('');
    draw();
  }
  function compareRows(axis, a, b, c) {
    const map = {
      cfd_prop_firm: {
        'Overview': [['الحالة', a.data_status||a.data_quality_status, b.data_status||b.data_quality_status, c?.data_status||c?.data_quality_status, 'ابدأ بجودة البيانات.']],
        'Account Sizes & Prices': [['Account Size', pick(a,['program_groups.0.variants.0.account_sizes.0.account_size']), pick(b,['program_groups.0.variants.0.account_sizes.0.account_size']), pick(c||{},['program_groups.0.variants.0.account_sizes.0.account_size']), 'السعر يجب أن يقارن مع حجم الحساب.'], ['Price', pick(a,['program_groups.0.variants.0.account_sizes.0.price']), pick(b,['program_groups.0.variants.0.account_sizes.0.price']), pick(c||{},['program_groups.0.variants.0.account_sizes.0.price']), 'راقب الرسوم غير المستردة.']],
        'Challenge Phases': [['Phase 1 Target', pick(a,['program_groups.0.variants.0.account_sizes.0.phase_1_target']), pick(b,['program_groups.0.variants.0.account_sizes.0.phase_1_target']), pick(c||{},['program_groups.0.variants.0.account_sizes.0.phase_1_target']), 'كلما انخفض الهدف زادت المرونة.']],
        'Drawdown Rules': [['Daily Drawdown', pick(a,['program_groups.0.variants.0.account_sizes.0.daily_drawdown']), pick(b,['program_groups.0.variants.0.account_sizes.0.daily_drawdown']), pick(c||{},['program_groups.0.variants.0.account_sizes.0.daily_drawdown']), 'قارن مع استراتيجية التداول اليومية.']],
        'Trading Rules': [
          ['News Trading', getTradingPermission(a,['news']), getTradingPermission(b,['news']), getTradingPermission(c||{},['news']), 'تأكد من السماح بالتداول وقت الأخبار حسب استراتيجيتك.'],
          ['Weekend Holding', getTradingPermission(a,['weekend']), getTradingPermission(b,['weekend']), getTradingPermission(c||{},['weekend']), 'مهم إذا كنت تحتفظ بالصفقات لنهاية الأسبوع.'],
          ['Overnight Holding', getTradingPermission(a,['overnight']), getTradingPermission(b,['overnight']), getTradingPermission(c||{},['overnight']), 'ضروري لاستراتيجيات الاحتفاظ لليوم التالي.'],
          ['EA/Bots', getTradingPermission(a,['ea', 'bot', 'algorithm']), getTradingPermission(b,['ea', 'bot', 'algorithm']), getTradingPermission(c||{},['ea', 'bot', 'algorithm']), 'مهم لمن يستخدم أتمتة.'],
          ['Copy Trading', getTradingPermission(a,['copy']), getTradingPermission(b,['copy']), getTradingPermission(c||{},['copy']), 'تحقق إن كانت النسخ مسموحة بشكل صريح.'],
          ['Hedging', getTradingPermission(a,['hedg']), getTradingPermission(b,['hedg']), getTradingPermission(c||{},['hedg']), 'يساعد على إدارة المخاطر عند فتح صفقات متعاكسة.'],
          ['Martingale', getTradingPermission(a,['martingale']), getTradingPermission(b,['martingale']), getTradingPermission(c||{},['martingale']), 'تحقق من القيود على مضاعفة العقود.'],
          ['Arbitrage', getTradingPermission(a,['arbitrage']), getTradingPermission(b,['arbitrage']), getTradingPermission(c||{},['arbitrage']), 'بعض الشركات تمنعه بشكل كامل.'],
          ['HFT', getTradingPermission(a,['hft', 'high frequency']), getTradingPermission(b,['hft', 'high frequency']), getTradingPermission(c||{},['hft', 'high frequency']), 'ضروري لاستراتيجيات التداول عالي التردد.']
        ],
        'Payout Rules': [['Profit Split', pick(a,['program_groups.0.variants.0.account_sizes.0.profit_split']), pick(b,['program_groups.0.variants.0.account_sizes.0.profit_split']), pick(c||{},['program_groups.0.variants.0.account_sizes.0.profit_split']), 'راقب الشروط الإضافية للسحب.']],
        'Costs & Execution': [['Commission', pick(a,['program_groups.0.variants.0.costs_and_execution.0.value']), pick(b,['program_groups.0.variants.0.costs_and_execution.0.value']), pick(c||{},['program_groups.0.variants.0.costs_and_execution.0.value']), 'التكلفة التنفيذية تؤثر على الربحية.']],
        'Hidden Rules': [['Hidden Rule', pick(a,['program_groups.0.variants.0.hidden_rules_red_flags.0.hidden_rule']), pick(b,['program_groups.0.variants.0.hidden_rules_red_flags.0.hidden_rule']), pick(c||{},['program_groups.0.variants.0.hidden_rules_red_flags.0.hidden_rule']), 'تحقق من الشروط غير الظاهرة.']],
        'Arab User': [['Arabic Support', pick(a,['arab_user_relevance.arabic_support']), pick(b,['arab_user_relevance.arabic_support']), pick(c||{},['arab_user_relevance.arabic_support']), 'مهم للدعم والتواصل.']]
      },
      futures_prop_firm: {
        'Overview': [['الحالة', a.data_status||a.data_quality_status, b.data_status||b.data_quality_status, c?.data_status||c?.data_quality_status, 'ابدأ بمستوى اكتمال البيانات.']],
        'Plans & Fees': [['Monthly Fee', pick(a,['plans.0.monthly_fee']), pick(b,['plans.0.monthly_fee']), pick(c||{},['plans.0.monthly_fee']), 'قارن الرسوم الشهرية مع نوع الحساب.'], ['Activation Fee', pick(a,['plans.0.activation_fee']), pick(b,['plans.0.activation_fee']), pick(c||{},['plans.0.activation_fee']), 'بعض الشركات تضيف رسوم تفعيل إلزامية.']],
        'Drawdown Mechanics': [['Trailing Drawdown', pick(a,['plans.0.trailing_drawdown']), pick(b,['plans.0.trailing_drawdown']), pick(c||{},['plans.0.trailing_drawdown']), 'هذا المحور حاسم في Futures.'], ['EOD Drawdown', pick(a,['plans.0.eod_drawdown']), pick(b,['plans.0.eod_drawdown']), pick(c||{},['plans.0.eod_drawdown']), 'افحص هل الإغلاق اليومي مطلوب.']],
        'Contract Rules': [['Max Contracts', pick(a,['contract_rules.0.max_contracts']), pick(b,['contract_rules.0.max_contracts']), pick(c||{},['contract_rules.0.max_contracts']), 'يلائم حجم رأس المال التشغيلي.'], ['Micros Allowed', pick(a,['contract_rules.0.micros_allowed']), pick(b,['contract_rules.0.micros_allowed']), pick(c||{},['contract_rules.0.micros_allowed']), 'مهم لتقليل المخاطر.']],
        'Platforms & Data': [['Platform', pick(a,['platforms.0']), pick(b,['platforms.0']), pick(c||{},['platforms.0']), 'تأكد من توافق المنصة.'], ['Data Feed', pick(a,['data_feed.provider','data_feed']), pick(b,['data_feed.provider','data_feed']), pick(c||{},['data_feed.provider','data_feed']), 'رسوم الداتا قد تغيّر التكلفة الفعلية.']],
        'Payout Rules': [['First Payout', pick(a,['plans.0.first_payout']), pick(b,['plans.0.first_payout']), pick(c||{},['plans.0.first_payout']), 'السرعة ليست العامل الوحيد.']],
        'Hidden Rules': [['Restriction', pick(a,['trading_rules.0.rule']), pick(b,['trading_rules.0.rule']), pick(c||{},['trading_rules.0.rule']), 'راجع الشروط الدقيقة في المصادر الرسمية.']]
      },
      crypto_prop_firm: {
        'Overview': [['الحالة', a.data_status||a.data_quality_status, b.data_status||b.data_quality_status, c?.data_status||c?.data_quality_status, 'ابدأ من جودة البيانات.']],
        'Market Type': [['Market Type', pick(a,['programs.0.market_type']), pick(b,['programs.0.market_type']), pick(c||{},['programs.0.market_type']), 'فرّق بين Spot/Perpetual/Margin/CFD Crypto.']],
        'Account Sizes & Prices': [['Account Size', pick(a,['programs.0.account_size']), pick(b,['programs.0.account_size']), pick(c||{},['programs.0.account_size']), 'قارن الحجم مع الرسوم.'], ['Price', pick(a,['programs.0.price']), pick(b,['programs.0.price']), pick(c||{},['programs.0.price']), 'افحص سياسة الاسترداد.']],
        'Fees': [['Maker Fee', pick(a,['fees.maker_fee']), pick(b,['fees.maker_fee']), pick(c||{},['fees.maker_fee']), 'رسوم التداول المباشرة.'], ['Taker Fee', pick(a,['fees.taker_fee']), pick(b,['fees.taker_fee']), pick(c||{},['fees.taker_fee']), 'مهم للتنفيذ السريع.']],
        'Risk & Liquidation': [['Liquidation Rules', pick(a,['risk_rules.liquidation_rules']), pick(b,['risk_rules.liquidation_rules']), pick(c||{},['risk_rules.liquidation_rules']), 'افهم قواعد التصفية قبل الاشتراك.']],
        'API & Bots': [['API Trading', pick(a,['api_and_bots.api_trading']), pick(b,['api_and_bots.api_trading']), pick(c||{},['api_and_bots.api_trading']), 'هل الربط الآلي مسموح؟'], ['Bots Allowed', pick(a,['api_and_bots.bots_allowed']), pick(b,['api_and_bots.bots_allowed']), pick(c||{},['api_and_bots.bots_allowed']), 'تحقق من الشروط التشغيلية.']],
        'KYC & Payout': [['KYC Required', pick(a,['kyc_and_payouts.kyc_required']), pick(b,['kyc_and_payouts.kyc_required']), pick(c||{},['kyc_and_payouts.kyc_required']), 'قد يؤخر السحب.'], ['Payout Method', pick(a,['kyc_and_payouts.payout_method']), pick(b,['kyc_and_payouts.payout_method']), pick(c||{},['kyc_and_payouts.payout_method']), 'اختر طريقة تناسب بلدك.']],
        'Hidden Rules': [['Hidden Rule', pick(a,['risk_rules.hidden_rules.0']), pick(b,['risk_rules.hidden_rules.0']), pick(c||{},['risk_rules.hidden_rules.0']), 'العنصر الناقص يظهر Needs Verification.']]
      },
      broker: {
        'Overview': [['الحالة', a.data_status||a.data_quality_status, b.data_status||b.data_quality_status, c?.data_status||c?.data_quality_status, 'ابدأ بالموثوقية.']],
        'Regulation & Trust': [['Regulators', pick(a,['regulation_and_trust.regulators']), pick(b,['regulation_and_trust.regulators']), pick(c||{},['regulation_and_trust.regulators']), 'التنظيم هو عامل الثقة الأول.']],
        'Account Types': [['Account Type', pick(a,['account_types.0.account_type']), pick(b,['account_types.0.account_type']), pick(c||{},['account_types.0.account_type']), 'اختر نوع الحساب المناسب لاستراتيجية التداول.']],
        'Trading Costs': [['Spread From', pick(a,['account_types.0.spread_from']), pick(b,['account_types.0.spread_from']), pick(c||{},['account_types.0.spread_from']), 'قارن السبريد مع العمولة.'], ['Commission', pick(a,['account_types.0.commission']), pick(b,['account_types.0.commission']), pick(c||{},['account_types.0.commission']), 'التكلفة التشغيلية اليومية.']],
        'Execution': [['Execution Model', pick(a,['platforms_and_markets.execution_model']), pick(b,['platforms_and_markets.execution_model']), pick(c||{},['platforms_and_markets.execution_model']), 'يؤثر على الانزلاق والتنفيذ.']],
        'Deposit & Withdrawal': [['Method', pick(a,['deposit_and_withdrawal.0.method']), pick(b,['deposit_and_withdrawal.0.method']), pick(c||{},['deposit_and_withdrawal.0.method']), 'سرعة السحب عنصر تشغيلي مهم.']],
        'Islamic Account': [['Islamic Account', pick(a,['arab_user_relevance.islamic_account']), pick(b,['arab_user_relevance.islamic_account']), pick(c||{},['arab_user_relevance.islamic_account']), 'ملاءمة المستخدم العربي.']],
        'Arab User': [['Arabic Support', pick(a,['arab_user_relevance.arabic_support']), pick(b,['arab_user_relevance.arabic_support']), pick(c||{},['arab_user_relevance.arabic_support']), 'الدعم العربي يقلل أخطاء التشغيل.']],
        'Hidden Risks': [['Risk', pick(a,['regulation_and_trust.hidden_risks.0']), pick(b,['regulation_and_trust.hidden_risks.0']), pick(c||{},['regulation_and_trust.hidden_risks.0']), 'افحص المخاطر المخفية لكل جهة قانونية.']]
      },
      crypto_exchange: {
        'Overview': [['الحالة', a.data_status||a.data_quality_status, b.data_status||b.data_quality_status, c?.data_status||c?.data_quality_status, 'ابدأ بجودة البيانات.']],
        'Products': [['Spot', pick(a,['products.spot']), pick(b,['products.spot']), pick(c||{},['products.spot']), 'توفر المنتج لا يعني مناسبة الرسوم.'], ['Futures', pick(a,['products.futures']), pick(b,['products.futures']), pick(c||{},['products.futures']), 'راجع متطلبات KYC.']],
        'Fees': [['Maker Fee', pick(a,['fees.maker_fee']), pick(b,['fees.maker_fee']), pick(c||{},['fees.maker_fee']), 'قارن عبر نفس نوع الزوج.'], ['Taker Fee', pick(a,['fees.taker_fee']), pick(b,['fees.taker_fee']), pick(c||{},['fees.taker_fee']), 'يرتبط بسيولة السوق.']],
        'KYC & Limits': [['KYC Tiers', pick(a,['kyc_and_restrictions.kyc_tiers']), pick(b,['kyc_and_restrictions.kyc_tiers']), pick(c||{},['kyc_and_restrictions.kyc_tiers']), 'راجع حدود السحب لكل مستوى.']],
        'Security': [['Proof of Reserves', pick(a,['security_and_reserves.proof_of_reserves']), pick(b,['security_and_reserves.proof_of_reserves']), pick(c||{},['security_and_reserves.proof_of_reserves']), 'عنصر ثقة أساسي.']],
        'Fiat & P2P': [['Fiat Deposit', pick(a,['fiat_and_p2p.fiat_deposit']), pick(b,['fiat_and_p2p.fiat_deposit']), pick(c||{},['fiat_and_p2p.fiat_deposit']), 'مهم للمستخدم المحلي.']],
        'API & Liquidity': [['API', pick(a,['liquidity_and_api.api']), pick(b,['liquidity_and_api.api']), pick(c||{},['liquidity_and_api.api']), 'ملائم للتكامل الآلي.'], ['Liquidity', pick(a,['liquidity_and_api.liquidity']), pick(b,['liquidity_and_api.liquidity']), pick(c||{},['liquidity_and_api.liquidity']), 'السيولة تحدد جودة التنفيذ.']],
        'Restrictions': [['Restricted Countries', pick(a,['kyc_and_restrictions.restricted_countries']), pick(b,['kyc_and_restrictions.restricted_countries']), pick(c||{},['kyc_and_restrictions.restricted_countries']), 'تأكد من بلد الإقامة.']],
        'Hidden Risks': [['Risk', pick(a,['security_and_reserves.hidden_risks.0']), pick(b,['security_and_reserves.hidden_risks.0']), pick(c||{},['security_and_reserves.hidden_risks.0']), 'تابع تحديثات السياسات.']]
      }
    };
    const byCat = map[state.cat] || {};
    const rows = byCat[axis] || [['الحالة', a.data_status||a.data_quality_status, b.data_status||b.data_quality_status, c?.data_status||c?.data_quality_status, `المحور: ${axis}`]];
    return rows.map(r=>`<tr><td class="table-sticky-col">${esc(r[0])}</td><td>${safe(r[1])}</td><td>${safe(r[2])}</td>${c?`<td>${safe(r[3])}</td>`:''}<td>${safe(r[4])}</td></tr>`).join('');
  }
  function draw() {
    const a = state.items[parseInt(aSel.value,10)];
    const b = state.items[parseInt(bSel.value,10)];
    const c = state.items[parseInt(cSel.value,10)];
    if (!a || !b) { out.innerHTML = '<div class="info-box">اختر شركتين على الأقل لبدء المقارنة.</div>'; return; }
    out.innerHTML = `<div class="table-wrapper"><table><thead><tr><th class="table-sticky-col">معيار المقارنة</th><th>${companyCell(a,true)}</th><th>${companyCell(b,true)}</th>${c?`<th>${companyCell(c,true)}</th>`:''}<th>ملاحظة تحليلية</th></tr></thead><tbody>${compareRows(axisSel.value,a,b,c)}</tbody></table></div><div class="compare-buttons"><a class="btn btn-outline" href="${base()}review/?category=${state.cat}&company=${encodeURIComponent(a.company_name||'')}">فتح مراجعة A</a><a class="btn btn-outline" href="${base()}review/?category=${state.cat}&company=${encodeURIComponent(b.company_name||'')}">فتح مراجعة B</a>${c?`<a class="btn btn-outline" href="${base()}review/?category=${state.cat}&company=${encodeURIComponent(c.company_name||'')}">فتح مراجعة C</a>`:''}</div><div class="warning-box">المقارنة لا تكفي وحدها، راجع صفحة الشركة الكاملة.</div>`;
  }

  [catSel,aSel,bSel,cSel,axisSel].forEach(el=>el.addEventListener('change', draw));
  catSel.addEventListener('change', refill);
  refill();
}
