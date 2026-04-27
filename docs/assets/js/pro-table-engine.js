window.ProTableEngine = (() => {
  const missing = (value) => value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const yesNo = (value) => {
    if (value === true) return '<span class="badge ready">نعم</span>';
    if (value === false) return '<span class="badge risk">لا</span>';
    if (String(value).toLowerCase() === 'restricted') return '<span class="badge partial">مقيد</span>';
    return format(value);
  };
  const format = (value) => {
    if (missing(value)) return '<span class="badge info">غير موثق</span>';
    if (Array.isArray(value)) return value.map(format).join('، ');
    if (typeof value === 'boolean') return yesNo(value);
    if (typeof value === 'number') return Number.isInteger(value) ? esc(value) : esc(value.toFixed(2));
    if (typeof value === 'object') return Object.entries(value).map(([key, val]) => `<b>${esc(key)}</b>: ${format(val)}`).join('<br>');
    return `<span class="ltr">${esc(value)}</span>`;
  };
  const money = (price, currency = 'USD') => missing(price) ? '<span class="badge info">غير موثق</span>' : `<b class="ltr">${esc(currency)} ${esc(price)}</b>`;
  const companyAbbr = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 3).map((part) => part[0]).join('').toUpperCase();
  const table = ({ columns, rows, className = '' }) => `
    <div class="tableBox proTableBox ${className}">
      <table class="proTable">
        <thead><tr>${columns.map((col, index) => `<th class="${index === 0 ? 'sticky' : ''}">${esc(col.label)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${columns.map((col, index) => `<td class="${index === 0 ? 'sticky' : ''}">${col.render ? col.render(row) : format(row[col.key])}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>`;
  const planColumns = [
    { key: 'plan_name', label: 'الحساب', render: (p) => `<b>${format(p.plan_name)}</b><small>${format(p.account_size)} ${format(p.currency)}</small>` },
    { key: 'price', label: 'السعر', render: (p) => money(p.price, p.currency) },
    { key: 'phase_1_profit_target', label: 'هدف 1', render: (p) => format(p.phase_1_profit_target) },
    { key: 'phase_2_profit_target', label: 'هدف 2', render: (p) => format(p.phase_2_profit_target) },
    { key: 'daily_drawdown', label: 'Daily DD', render: (p) => format(p.daily_drawdown) },
    { key: 'max_drawdown', label: 'Max DD', render: (p) => format(p.max_drawdown) },
    { key: 'drawdown_type', label: 'نوع DD', render: (p) => format(p.drawdown_type) },
    { key: 'drawdown_calculation_notes', label: 'حساب DD', render: (p) => format(p.drawdown_calculation_notes) },
    { key: 'minimum_trading_days', label: 'أقل أيام', render: (p) => format(p.minimum_trading_days) },
    { key: 'maximum_trading_days', label: 'أقصى أيام', render: (p) => format(p.maximum_trading_days) },
    { key: 'profit_split', label: 'Profit Split', render: (p) => format(p.profit_split) },
    { key: 'first_payout_time', label: 'أول سحب', render: (p) => format(p.first_payout_time) },
    { key: 'payout_frequency', label: 'تكرار السحب', render: (p) => format(p.payout_frequency) },
    { key: 'refund_policy', label: 'Refund', render: (p) => format(p.refund_policy) }
  ];
  const tradingRuleColumns = [
    { key: 'plan_name', label: 'الحساب', render: (p) => `<b>${format(p.plan_name)}</b><small>${format(p.account_size)}</small>` },
    { key: 'news_trading', label: 'الأخبار', render: (p) => yesNo(p.news_trading) },
    { key: 'weekend_holding', label: 'Weekend', render: (p) => yesNo(p.weekend_holding) },
    { key: 'overnight_holding', label: 'Overnight', render: (p) => yesNo(p.overnight_holding) },
    { key: 'ea_bots', label: 'EA/Bots', render: (p) => yesNo(p.ea_bots) },
    { key: 'copy_trading', label: 'Copy', render: (p) => yesNo(p.copy_trading) },
    { key: 'hedging', label: 'Hedging', render: (p) => yesNo(p.hedging) },
    { key: 'martingale', label: 'Martingale', render: (p) => yesNo(p.martingale) },
    { key: 'arbitrage', label: 'Arbitrage', render: (p) => yesNo(p.arbitrage) },
    { key: 'high_frequency_trading', label: 'HFT', render: (p) => yesNo(p.high_frequency_trading) },
    { key: 'grid_trading', label: 'Grid', render: (p) => yesNo(p.grid_trading) },
    { key: 'tick_scalping', label: 'Tick Scalping', render: (p) => yesNo(p.tick_scalping) }
  ];
  const executionColumns = [
    { key: 'plan_name', label: 'الحساب', render: (p) => `<b>${format(p.plan_name)}</b>` },
    { key: 'leverage_forex', label: 'Forex Lev.', render: (p) => format(p.leverage_forex) },
    { key: 'leverage_indices', label: 'Indices Lev.', render: (p) => format(p.leverage_indices) },
    { key: 'leverage_metals', label: 'Metals Lev.', render: (p) => format(p.leverage_metals) },
    { key: 'leverage_crypto', label: 'Crypto Lev.', render: (p) => format(p.leverage_crypto) },
    { key: 'commission', label: 'Commission', render: (p) => format(p.commission) },
    { key: 'spreads_notes', label: 'Spreads', render: (p) => format(p.spreads_notes) },
    { key: 'swap_rules', label: 'Swap', render: (p) => format(p.swap_rules) },
    { key: 'max_contracts_or_lots', label: 'Max Lots/Contracts', render: (p) => format(p.max_contracts_or_lots) },
    { key: 'max_position_size', label: 'Max Position', render: (p) => format(p.max_position_size) }
  ];
  const sourcesColumns = [
    { key: 'plan_name', label: 'الحساب', render: (p) => `<b>${format(p.plan_name)}</b>` },
    { key: 'official_sources', label: 'المصادر الرسمية', render: (p) => missing(p.official_sources) ? format(null) : `<div class="sourceList">${p.official_sources.map((url) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a>`).join('')}</div>` },
    { key: 'important_notes', label: 'ملاحظات مهمة', render: (p) => format(p.important_notes) },
    { key: 'plan_data_confidence', label: 'ثقة الخطة', render: (p) => format(p.plan_data_confidence) }
  ];
  const renderProgram = (program) => {
    const plans = Array.isArray(program.plans) ? program.plans : [];
    return `
      <section class="program">
        <div class="programHead">
          <h3>${format(program.program_name)}</h3>
          <p>${format(program.program_type)} · ${format(program.available_platforms)} · ${format(program.available_markets)}</p>
        </div>
        <div class="programBody">
          <h4>الحسابات والأسعار والشروط</h4>${table({ columns: planColumns, rows: plans })}
          <h4>قواعد التداول لكل حساب</h4>${table({ columns: tradingRuleColumns, rows: plans })}
          <h4>الرافعة والتكاليف والتنفيذ</h4>${table({ columns: executionColumns, rows: plans })}
          <h4>المصادر والملاحظات</h4>${table({ columns: sourcesColumns, rows: plans })}
        </div>
      </section>`;
  };
  const renderPrograms = (company) => {
    const programs = Array.isArray(company.programs) ? company.programs : [];
    if (!programs.length) return '<div class="note">لا توجد برامج تفصيلية موثقة لهذه الشركة حالياً.</div>';
    return programs.map(renderProgram).join('');
  };
  const renderHiddenRules = (company) => {
    const cards = [];
    const add = (title, value, source = '') => { if (!missing(value)) cards.push(`<article class="riskCard"><h4>${esc(title)}</h4><p>${format(value)}</p>${source ? `<small>${format(source)}</small>` : ''}</article>`); };
    (company.programs || []).forEach((program) => (program.plans || []).forEach((plan) => {
      add(`${program.program_name} / ${plan.plan_name}: Forbidden Practices`, plan.forbidden_practices, plan.official_sources);
      add(`${program.program_name} / ${plan.plan_name}: Breach Rules`, plan.breach_rules, plan.official_sources);
      add(`${program.program_name} / ${plan.plan_name}: Important Notes`, plan.important_notes, plan.official_sources);
    }));
    add('Company Level Rules', company.company_level_rules, company.official_sources);
    add('Risk Rules', company.risk_rules, company.official_sources);
    add('Payout Denial Reasons', company.funded_stage_and_payouts?.payout_denial_reasons, company.official_sources);
    return cards.length ? cards.join('') : '<div class="note">لا توجد قواعد مخفية موثقة في قاعدة البيانات لهذه الشركة، أو ما زالت تحتاج بحثاً.</div>';
  };
  const renderCompanyHeader = (company) => `
    <section class="card companyReviewHead">
      <div class="companyCell"><span class="abbr">${esc(companyAbbr(company.company_name))}</span><div><h2>${esc(company.company_name)}</h2><small>${format(company.company_type)} · ${format(company.category)} · آخر تحقق: ${format(company.last_checked)}</small></div></div>
      <div class="statRow"><span class="badge ${company.data_quality_status === 'ready' ? 'ready' : 'partial'}">${format(company.data_quality_status)}</span><span class="badge info">ثقة البيانات: ${format(company.data_confidence)}/10</span><a class="btn" href="${esc(company.official_website || '#')}" target="_blank" rel="noopener">الموقع الرسمي</a></div>
      <p>${format(company.editorial_summary?.main_strength || company.summary || company.programs?.[0]?.program_description)}</p>
    </section>`;
  const renderReview = (company) => `
    ${renderCompanyHeader(company)}
    <div class="tabs" data-pro-tabs>
      <button class="tab active" data-tab="programs">البرامج والحسابات</button>
      <button class="tab" data-tab="rules">القواعد المخفية</button>
      <button class="tab" data-tab="profile">الملف والتشغيل</button>
      <button class="tab" data-tab="arab">المتداول العربي</button>
      <button class="tab" data-tab="audit">المصادر والتدقيق</button>
    </div>
    <section id="programs" class="panel active">${renderPrograms(company)}</section>
    <section id="rules" class="panel">${renderHiddenRules(company)}</section>
    <section id="profile" class="panel">${table({ columns: [{ key: 'k', label: 'القسم' }, { key: 'v', label: 'التفاصيل', render: (r) => format(r.v) }], rows: [{ k: 'Company Profile', v: company.company_profile }, { k: 'Markets & Platforms', v: company.markets_and_platforms }, { k: 'Execution & Costs', v: company.execution_and_costs }, { k: 'Funded Stage & Payouts', v: company.funded_stage_and_payouts }] })}</section>
    <section id="arab" class="panel">${table({ columns: [{ key: 'k', label: 'العنصر' }, { key: 'v', label: 'التفاصيل', render: (r) => format(r.v) }], rows: Object.entries(company.arab_user_relevance || {}).map(([k, v]) => ({ k, v })) })}</section>
    <section id="audit" class="panel">${table({ columns: [{ key: 'k', label: 'العنصر' }, { key: 'v', label: 'التفاصيل', render: (r) => format(r.v) }], rows: [{ k: 'Official Sources', v: company.official_sources }, { k: 'Research Audit', v: company.research_audit }, { k: 'Editorial Summary', v: company.editorial_summary }] })}</section>`;
  const initTabs = (root = document) => {
    root.querySelectorAll('[data-pro-tabs] .tab').forEach((button) => {
      button.addEventListener('click', () => {
        const tabs = button.closest('[data-pro-tabs]');
        const scope = tabs.parentElement;
        tabs.querySelectorAll('.tab').forEach((item) => item.classList.remove('active'));
        scope.querySelectorAll('.panel').forEach((panel) => panel.classList.remove('active'));
        button.classList.add('active');
        scope.querySelector('#' + button.dataset.tab)?.classList.add('active');
      });
    });
  };
  return { format, table, renderPrograms, renderHiddenRules, renderReview, initTabs };
})();
