(() => {
  const DATA_FILES = {
    cfd_prop_firm: 'cfd-prop-firms.json',
    futures_prop_firm: 'futures-prop-firms.json',
    crypto_prop_firm: 'crypto-prop-firms.json',
    broker: 'brokers.json',
    crypto_exchange: 'crypto-exchanges.json'
  };
  const META = {
    cfd_prop_firm: { label: 'CFD Prop Firms', path: 'cfd-prop-firms', desc: 'تحديات، أحجام حسابات، دروداون، سحب، قواعد تداول ومخاطر خفية.' },
    futures_prop_firm: { label: 'Futures Prop Firms', path: 'futures-prop-firms', desc: 'رسوم شهرية، عقود، Trailing DD، Activation/Reset/Data Fees وسحب.' },
    crypto_prop_firm: { label: 'Crypto Prop Firms', path: 'crypto-prop-firms', desc: 'Spot/Perpetual، تصفية، API/Bots، رافعة، KYC وسحب كريبتو.' },
    broker: { label: 'Brokers', path: 'brokers', desc: 'تنظيم، حسابات، سبريد، عمولات، تنفيذ، إيداع وسحب وحساب إسلامي.' },
    crypto_exchange: { label: 'Crypto Exchanges', path: 'crypto-exchanges', desc: 'رسوم، KYC، P2P، Futures، أمان، Proof of Reserves وقيود الدول.' }
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const base = '/Compari-prop-firm/';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const miss = (v) => v == null || v === '' || (Array.isArray(v) && v.length === 0);
  const fmt = (v) => window.ProTableEngine ? window.ProTableEngine.format(v) : (miss(v) ? 'غير موثق' : esc(Array.isArray(v) ? v.join('، ') : v));
  const abbr = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 3).map(x => x[0]).join('').toUpperCase();
  const status = (s) => `<span class="badge ${s === 'ready' ? 'ready' : s === 'partial' ? 'partial' : 'info'}">${fmt(s)}</span>`;
  let STORE = { index: [], detail: {} };

  async function getJson(path) {
    const res = await fetch(base + path, { cache: 'no-store' });
    if (!res.ok) throw new Error(path);
    return res.json();
  }
  async function load() {
    STORE.index = await getJson('src/data/index.json');
    await Promise.all(Object.entries(DATA_FILES).map(async ([cat, file]) => {
      try { STORE.detail[cat] = await getJson('src/data/' + file); }
      catch { STORE.detail[cat] = []; }
    }));
    route();
  }
  function allCompanies() { return Object.values(STORE.detail).flat(); }
  function findCompany(category, slugOrName) {
    const list = category ? STORE.detail[category] || [] : allCompanies();
    return list.find(c => c.slug === slugOrName || c.company_name === slugOrName) || list[0];
  }
  function companyCell(c) {
    return `<div class="companyCell"><span class="abbr">${esc(abbr(c.company_name))}</span><div><b>${esc(c.company_name)}</b><small>${fmt(c.company_type || c.category_label || c.category)}</small></div></div>`;
  }
  function layout(inner) {
    document.body.innerHTML = `<header class="top"><div class="wrap nav"><a class="brand" href="${base}"><span class="mark">م</span><span>محطة التمويل</span></a><nav class="links"><a href="${base}">الرئيسية</a><a href="${base}categories/">التصنيفات</a><a href="${base}review/">المراجعة</a><a href="${base}compare/">المقارنة</a></nav></div></header>${inner}<footer class="footer"><div class="wrap"><h3>محطة التمويل</h3><p>مرجع عربي للمراجعة والمقارنة. تحقق من المصدر الرسمي قبل أي قرار مالي.</p></div></footer>`;
  }
  function route() {
    const p = location.pathname.replace(base, '').replace(/^\//,'');
    if (p.startsWith('review')) return renderReviewPage();
    if (p.startsWith('compare')) return renderComparePage();
    if (p.startsWith('categories')) return renderCategoriesPage();
    if (p.startsWith('category/')) return renderCategoryPage(p.split('/')[1]);
    renderHome();
  }
  function renderHome() {
    const ready = STORE.index.filter(c => c.data_quality_status === 'ready').length;
    layout(`<main><section class="hero"><div class="wrap heroGrid"><div><span class="kicker">مرجع المتداول المحترف</span><h1>راجع الشركة بعمق وقارن الحسابات قبل أن تدفع</h1><p class="lead">كل مراجعة تفكك البرامج، الحسابات، الأسعار، قواعد التداول، التراجع، السحب، المنصات، المصادر والقواعد المخفية.</p><div class="actions"><a class="btn primary" href="${base}review/">افتح مراجعة شركة</a><a class="btn" href="${base}compare/">قارن شركات أو حسابات</a></div></div><div class="card"><h2>بحث سريع</h2><input id="q" placeholder="FTMO, Topstep, Binance..."><div id="searchResults" class="grid"></div><div class="statRow"><span class="badge ready">${ready} Ready</span><span class="badge info">${STORE.index.length} شركة</span></div></div></div></section><section class="section"><div class="wrap"><div class="head"><h2>التصنيفات</h2><span class="muted">كل نوع له قالب مراجعة وجداوله الخاصة</span></div><div class="grid grid5">${Object.entries(META).map(([k,m]) => `<a class="card catCard" href="${base}category/${m.path}/"><strong>${m.label}</strong><p>${m.desc}</p><span class="badge info">${(STORE.detail[k]||[]).length} شركة</span></a>`).join('')}</div></div></section><section class="section"><div class="wrap"><div class="head"><h2>آخر الشركات</h2></div>${homeTable(STORE.index.slice(0,30))}</div></section></main>`);
    $('#q')?.addEventListener('input', (e)=> {
      const q = e.target.value.trim().toLowerCase();
      $('#searchResults').innerHTML = q.length < 2 ? '' : STORE.index.filter(c => c.company_name.toLowerCase().includes(q)).slice(0,8).map(c => `<a class="card" href="${base}review/?category=${c.category}&company=${c.slug}">${companyCell(c)}<span class="badge info">Review</span></a>`).join('');
    });
  }
  function homeTable(rows) {
    return `<div class="tableBox"><table><thead><tr><th class="sticky">الشركة</th><th>النوع</th><th>أقل سعر/إيداع</th><th>أكبر حساب</th><th>منصات</th><th>حالة</th><th>آخر تحقق</th><th>فتح</th></tr></thead><tbody>${rows.map(c=>`<tr><td class="sticky">${companyCell(c)}</td><td>${fmt(c.category_label||c.category)}</td><td>${fmt(c.lowest_price_or_deposit)}</td><td>${fmt(c.max_account_size)}</td><td>${fmt(c.platforms)}</td><td>${status(c.data_quality_status)}</td><td>${fmt(c.last_checked)}</td><td><a class="btn" href="${base}review/?category=${c.category}&company=${c.slug}">Review</a></td></tr>`).join('')}</tbody></table></div>`;
  }
  function renderCategoriesPage() {
    layout(`<main><section class="hero"><div class="wrap"><span class="kicker">التصنيفات</span><h1>اختر نوع السوق الذي تريد تحليله</h1><p class="lead">كل تصنيف له حقوله وجداوله وقواعده الخاصة.</p></div></section><section class="section"><div class="wrap grid grid5">${Object.entries(META).map(([k,m])=>`<a class="card catCard" href="${base}category/${m.path}/"><strong>${m.label}</strong><p>${m.desc}</p><span class="badge info">${(STORE.detail[k]||[]).length} شركة</span></a>`).join('')}</div></section></main>`);
  }
  function catByPath(path) { return Object.keys(META).find(k => META[k].path === path); }
  function renderCategoryPage(path) {
    const cat = catByPath(path) || 'cfd_prop_firm';
    const list = STORE.detail[cat] || [];
    layout(`<main><section class="hero"><div class="wrap"><span class="kicker">${META[cat].label}</span><h1>جدول احترافي للشركات داخل التصنيف</h1><p class="lead">اختصارات الشركات مقصودة للجداول، والـ Review يعرض التفاصيل الكاملة لكل برنامج وحساب.</p></div></section><section class="section"><div class="wrap">${categoryTable(cat, list)}</div></section></main>`);
  }
  function firstPlan(c) { return (c.programs||[]).flatMap(p=>p.plans||[])[0] || {}; }
  function categoryTable(cat, list) {
    const rows = list.map(c => ({ c, p: firstPlan(c) }));
    const cols = cat === 'broker'
      ? [['الشركة',r=>companyCell(r.c)],['Min Deposit',r=>fmt(r.c.broker_specific?.minimum_deposit||r.p.price)],['Account Types',r=>fmt(r.c.broker_specific?.account_types)],['Spread/Commission',r=>fmt(r.c.execution_and_costs?.commission_per_lot||r.p.commission)],['Platforms',r=>fmt(r.c.markets_and_platforms?.platforms)],['Islamic',r=>fmt(r.c.broker_specific?.islamic_account)],['Review',r=>`<a class="btn" href="${base}review/?category=${cat}&company=${r.c.slug}">فتح</a>`]]
      : cat === 'crypto_exchange'
      ? [['المنصة',r=>companyCell(r.c)],['Spot',r=>fmt(r.c.crypto_exchange_specific?.spot_trading)],['Futures',r=>fmt(r.c.crypto_exchange_specific?.futures_trading)],['P2P',r=>fmt(r.c.crypto_exchange_specific?.p2p_trading)],['Maker/Taker',r=>`${fmt(r.c.crypto_exchange_specific?.maker_fee)} / ${fmt(r.c.crypto_exchange_specific?.taker_fee)}`],['KYC',r=>fmt(r.c.crypto_exchange_specific?.kyc_required)],['Review',r=>`<a class="btn" href="${base}review/?category=${cat}&company=${r.c.slug}">فتح</a>`]]
      : [['الشركة',r=>companyCell(r.c)],['الحساب',r=>fmt(r.p.account_size)],['السعر',r=>fmt(r.p.price)],['P1/P2',r=>`${fmt(r.p.phase_1_profit_target)} / ${fmt(r.p.phase_2_profit_target)}`],['Daily/Max DD',r=>`${fmt(r.p.daily_drawdown)} / ${fmt(r.p.max_drawdown)}`],['DD Type',r=>fmt(r.p.drawdown_type)],['Payout',r=>fmt(r.p.first_payout_time||r.p.payout_frequency)],['Rules',r=>`${fmt(r.p.news_trading)} · ${fmt(r.p.ea_bots)} · ${fmt(r.p.hedging)}`],['Review',r=>`<a class="btn" href="${base}review/?category=${cat}&company=${r.c.slug}">فتح</a>`]];
    return `<div class="tableBox"><table><thead><tr>${cols.map((c,i)=>`<th class="${i===0?'sticky':''}">${c[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map((c,i)=>`<td class="${i===0?'sticky':''}">${c[1](r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function renderReviewPage() {
    const qs = new URLSearchParams(location.search);
    const cat = qs.get('category') || 'cfd_prop_firm';
    const company = findCompany(cat, qs.get('company'));
    const selector = `<div class="card"><div class="compareControls"><select id="catSel">${Object.entries(META).map(([k,m])=>`<option value="${k}" ${k===cat?'selected':''}>${m.label}</option>`).join('')}</select><select id="companySel"></select></div></div>`;
    layout(`<main><section class="hero"><div class="wrap"><span class="kicker">Review Engine</span><h1>مراجعة شاملة لكل برنامج وحساب</h1><p class="lead">تعرض الجداول الأسعار، الشروط، التداول، السحب، التكاليف، المصادر والقواعد المخفية.</p>${selector}</div></section><section class="section"><div class="wrap" id="reviewHost"></div></section></main>`);
    const fill = () => {
      const list = STORE.detail[$('#catSel').value] || [];
      $('#companySel').innerHTML = list.map(c=>`<option value="${c.slug}" ${company?.slug===c.slug?'selected':''}>${c.company_name}</option>`).join('');
    };
    fill();
    const draw = () => {
      const c = findCompany($('#catSel').value, $('#companySel').value);
      $('#reviewHost').innerHTML = window.ProTableEngine.renderReview(c);
      window.ProTableEngine.initTabs($('#reviewHost'));
      history.replaceState(null,'',`${base}review/?category=${$('#catSel').value}&company=${c.slug}`);
    };
    $('#catSel').onchange = () => { fill(); draw(); };
    $('#companySel').onchange = draw;
    draw();
  }
  function renderComparePage() {
    layout(`<main><section class="hero"><div class="wrap"><span class="kicker">Compare Engine</span><h1>مقارنة شركات أو حسابات حسب محور القرار</h1><p class="lead">المقارنة تعرض المهم: السعر، الحساب، الدرو داون، السحب، القواعد، المنصات، والمصادر.</p><div class="card compareControls"><select id="cmpCat">${Object.entries(META).map(([k,m])=>`<option value="${k}">${m.label}</option>`).join('')}</select><select id="a"></select><select id="b"></select><select id="c"></select><select id="axis"><option value="core">Core Decision</option><option value="rules">Trading Rules</option><option value="payout">Payout</option></select></div></div></section><section class="section"><div class="wrap" id="cmpOut"></div></section></main>`);
    const fill = () => {
      const list = STORE.detail[$('#cmpCat').value] || [];
      ['a','b','c'].forEach((id,idx)=> $('#'+id).innerHTML = list.map((x,i)=>`<option value="${x.slug}" ${i===idx?'selected':''}>${x.company_name}</option>`).join(''));
    };
    const draw = () => {
      const cat = $('#cmpCat').value;
      const companies = ['a','b','c'].map(id=>findCompany(cat,$('#'+id).value)).filter(Boolean);
      $('#cmpOut').innerHTML = compareTable(companies, $('#axis').value);
    };
    fill(); draw();
    ['cmpCat','a','b','c','axis'].forEach(id=>$('#'+id).onchange=()=>{ if(id==='cmpCat') fill(); draw(); });
  }
  function compareTable(companies, axis) {
    const rows = axis === 'rules'
      ? [['News',c=>firstPlan(c).news_trading],['Weekend',c=>firstPlan(c).weekend_holding],['EA/Bots',c=>firstPlan(c).ea_bots],['Copy',c=>firstPlan(c).copy_trading],['Hedging',c=>firstPlan(c).hedging],['Martingale',c=>firstPlan(c).martingale],['HFT',c=>firstPlan(c).high_frequency_trading]]
      : axis === 'payout'
      ? [['Profit Split',c=>firstPlan(c).profit_split],['First Payout',c=>firstPlan(c).first_payout_time],['Frequency',c=>firstPlan(c).payout_frequency],['Refund',c=>firstPlan(c).refund_policy],['Payout Methods',c=>c.funded_stage_and_payouts?.payout_methods],['KYC Before Payout',c=>c.funded_stage_and_payouts?.kyc_before_payout]]
      : [['Company',c=>c.company_name],['Account Size',c=>firstPlan(c).account_size],['Price',c=>firstPlan(c).price],['Phase 1 Target',c=>firstPlan(c).phase_1_profit_target],['Phase 2 Target',c=>firstPlan(c).phase_2_profit_target],['Daily DD',c=>firstPlan(c).daily_drawdown],['Max DD',c=>firstPlan(c).max_drawdown],['DD Type',c=>firstPlan(c).drawdown_type],['Platforms',c=>c.markets_and_platforms?.platforms],['Source',c=>firstPlan(c).official_sources]];
    return `<div class="note">المقارنة لا تغني عن المراجعة الكاملة. افتح Review لكل شركة لرؤية كل البرامج والحسابات.</div><div class="tableBox"><table><thead><tr><th class="sticky">المعيار</th>${companies.map(c=>`<th><span class="abbr">${esc(abbr(c.company_name))}</span><br>${esc(c.company_name)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><td class="sticky"><b>${r[0]}</b></td>${companies.map(c=>`<td>${fmt(r[1](c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${companies.map(c=>`<a class="btn" href="${base}review/?category=${c.category}&company=${c.slug}">فتح مراجعة ${esc(c.company_name)}</a> `).join('')}`;
  }
  document.addEventListener('DOMContentLoaded', () => load().catch(err => { console.error(err); document.body.innerHTML = '<main class="wrap section"><div class="note">فشل تحميل قاعدة البيانات.</div></main>'; }));
})();
