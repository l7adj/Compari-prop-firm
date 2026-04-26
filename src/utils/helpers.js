// ============================================
// Helper Functions - محطة التمويل
// Empty-safe utilities for the real JSON schema
// ============================================

const BLOCKED_STRINGS = [
  ['غير', 'مذكور'].join(' '),
  ['غير', 'متوفر'].join(' '),
  ['غير', 'واضح'].join(' '),
  'n/a',
  'unknown',
  'null',
  'undefined'
];

export const isPresent = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    return !BLOCKED_STRINGS.some((item) => normalized.includes(item));
  }
  if (Array.isArray(value)) return value.some(isPresent);
  if (typeof value === 'object') return Object.values(value).some(isPresent);
  return true;
};

export const hasItems = (array) => Array.isArray(array) && array.some(isPresent);
export const hasArrayItems = hasItems;

export const compactArray = (array) => {
  if (!Array.isArray(array)) return [];
  return array.filter(isPresent);
};

export const formatBoolean = (value) => {
  if (!isPresent(value)) return null;
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
  return formatValue(value);
};

export const formatArray = (array) => {
  const items = compactArray(array).map(formatValue).filter(Boolean);
  return items.length ? items.join('، ') : null;
};

export const formatValue = (value) => {
  if (!isPresent(value)) return null;
  if (typeof value === 'boolean') return formatBoolean(value);
  if (typeof value === 'number') return value.toLocaleString('en-US');
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return formatArray(value);
  if (typeof value === 'object') {
    if (isPresent(value.label)) return formatValue(value.label);
    if (isPresent(value.value)) return formatValue(value.value);
    if (isPresent(value.name)) return formatValue(value.name);
    if (isPresent(value.title)) return formatValue(value.title);
    return Object.entries(value)
      .filter(([, val]) => isPresent(val))
      .map(([key, val]) => `${key}: ${formatValue(val)}`)
      .join('، ') || null;
  }
  return String(value);
};

export const formatMoney = (value, currency = 'USD') => {
  if (!isPresent(value)) return null;
  if (typeof value === 'object' && isPresent(value.value)) {
    return formatMoney(value.value, value.currency || currency);
  }
  if (typeof value === 'string' && /[$€£]/.test(value)) return value.trim();
  const num = Number(String(value).replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(num)) return formatValue(value);
  const symbolMap = { USD: '$', EUR: '€', GBP: '£', AED: 'AED', AUD: 'A$', CAD: 'C$' };
  const symbol = symbolMap[currency] || currency || '$';
  return `${symbol}${num.toLocaleString('en-US')}`;
};

export const formatPercent = (value) => {
  if (!isPresent(value)) return null;
  if (typeof value === 'string' && value.includes('%')) return value.trim();
  const num = Number(String(value).replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(num)) return formatValue(value);
  return `${num}%`;
};

export const getCompanyName = (company) =>
  formatValue(company?.company_name) || '';

export const getCategoryLabel = (category) => {
  const labels = {
    cfd_prop_firm: 'شركة تمويل CFD',
    futures_prop_firm: 'شركة تمويل Futures',
    crypto_prop_firm: 'شركة تمويل كريبتو',
    broker: 'بروكر تداول',
    brokers: 'بروكر تداول',
    crypto_exchange: 'منصة كريبتو',
    crypto_exchanges: 'منصة كريبتو'
  };
  return labels[category] || formatValue(category);
};

export const getInitials = (name = '') => {
  const clean = String(name).trim();
  if (!clean) return 'MT';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase();
};

export const getAllPrograms = (company) => (hasItems(company?.programs) ? company.programs : []);

export const getAllPlans = (company) => {
  if (!hasItems(company?.programs)) return [];
  return company.programs.flatMap((program) => {
    if (!hasItems(program?.plans)) return [];
    return program.plans.map((plan) => ({
      ...plan,
      program_name: program.program_name,
      program_type: program.program_type,
      program_description: program.program_description,
      available_platforms: program.available_platforms,
      available_markets: program.available_markets
    }));
  });
};

export const getLowestPrice = (company) => {
  const prices = getAllPlans(company)
    .map((plan) => Number(String(plan?.price).replace(/[^0-9.-]/g, '')))
    .filter(Number.isFinite);
  if (prices.length) return Math.min(...prices);
  if (isPresent(company?.lowest_price_or_deposit?.value)) return company.lowest_price_or_deposit.value;
  return null;
};

export const getMaxAccountSize = (company) => {
  const sizes = getAllPlans(company)
    .map((plan) => Number(String(plan?.account_size).replace(/[^0-9.-]/g, '')))
    .filter(Number.isFinite);
  if (sizes.length) return Math.max(...sizes);
  return isPresent(company?.max_account_size) ? company.max_account_size : null;
};

export const getBestPlan = (company) => {
  const plans = getAllPlans(company);
  if (!plans.length) return null;
  return [...plans].sort((a, b) => {
    const pa = Number(String(a?.price).replace(/[^0-9.-]/g, ''));
    const pb = Number(String(b?.price).replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(pa)) return 1;
    if (!Number.isFinite(pb)) return -1;
    return pa - pb;
  })[0];
};

export const getOfficialSources = (company) => {
  const sources = [];
  const pushSource = (source, fallbackLabel = 'مصدر رسمي') => {
    if (!isPresent(source)) return;
    if (typeof source === 'string') {
      sources.push({ label: fallbackLabel, url: source });
      return;
    }
    if (typeof source === 'object') {
      const url = source.url || source.href || source.link;
      if (isPresent(url)) sources.push({ label: source.label || source.title || fallbackLabel, url });
    }
  };

  pushSource(company?.official_website, 'الموقع الرسمي');
  compactArray(company?.official_sources).forEach((src, i) => pushSource(src, `مصدر رسمي ${i + 1}`));
  compactArray(company?.research_audit?.official_pages_checked).forEach((src, i) => pushSource(src, `صفحة رسمية ${i + 1}`));

  compactArray(company?.programs).forEach((program) => {
    compactArray(program?.plans).forEach((plan) => {
      compactArray(plan?.official_sources).forEach((src, i) => pushSource(src, `${program.program_name || 'برنامج'} — مصدر ${i + 1}`));
    });
  });

  const unique = new Map();
  sources.forEach((src) => {
    if (src.url && !unique.has(src.url)) unique.set(src.url, src);
  });
  return [...unique.values()];
};

export const shouldShowSection = (data) => isPresent(data);

export const getByPath = (object, path) => {
  if (!object || !path) return undefined;
  return String(path).split('.').reduce((acc, key) => (acc ? acc[key] : undefined), object);
};

export const shouldShowColumn = (rows, field) => {
  if (!Array.isArray(rows)) return false;
  return rows.some((row) => isPresent(getByPath(row, field)));
};

export const getTemplateByCategory = (category) => {
  const normalized = category === 'brokers' ? 'broker' : category === 'crypto_exchanges' ? 'crypto_exchange' : category;
  return {
    cfd_prop_firm: 'CFDPropFirmReviewTemplate',
    futures_prop_firm: 'FuturesPropFirmReviewTemplate',
    crypto_prop_firm: 'CryptoPropFirmReviewTemplate',
    broker: 'BrokerReviewTemplate',
    crypto_exchange: 'CryptoExchangeReviewTemplate'
  }[normalized] || null;
};

export const buildRows = (pairs) =>
  pairs
    .map(({ label, value, type }) => {
      let finalValue = value;
      if (type === 'money') finalValue = formatMoney(value);
      else if (type === 'percent') finalValue = formatPercent(value);
      else if (type === 'boolean') finalValue = formatBoolean(value);
      else finalValue = formatValue(value);
      return finalValue ? { label, value: finalValue } : null;
    })
    .filter(Boolean);
