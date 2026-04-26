import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'src', 'data');
const outDir = path.join(root, 'docs');

const categoryLabels = {
  cfd_prop_firm: 'CFD Prop Firms',
  futures_prop_firm: 'Futures Prop Firms',
  crypto_prop_firm: 'Crypto Prop Firms',
  broker: 'Brokers',
  crypto_exchange: 'Crypto Exchanges',
};

const categoryArabic = {
  cfd_prop_firm: 'شركات تمويل CFD',
  futures_prop_firm: 'شركات تمويل Futures',
  crypto_prop_firm: 'شركات تمويل Crypto',
  broker: 'البروكرات',
  crypto_exchange: 'منصات الكريبتو',
};

const categorySlugs = {
  cfd_prop_firm: 'cfd-prop-firms',
  futures_prop_firm: 'futures-prop-firms',
  crypto_prop_firm: 'crypto-prop-firms',
  broker: 'brokers',
  crypto_exchange: 'crypto-exchanges',
};

function readJson(file, fallback) {
  const full = path.join(dataDir, file);
  if (!fs.existsSync(full)) return fallback;
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

const companies = readJson('index.json', []);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(relativePath, content) {
  const full = path.join(outDir, relativePath);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, content, 'utf8');
}

function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function money(value) {
  if (!value || typeof value !== 'object' || value.value === null || value.value === undefined) return '';
  return `${esc(value.currency || 'USD')} ${esc(value.value)}`;
}

function numberValue(value) {
  if (value === null || value === undefined || value === '') return '';
  return esc(value);
}

function joinList(list) {
  return Array.isArray(list) && list.length ? list.map(esc).join('، ') : '';
}

function absoluteUrl(relative = '') {
  return `https://l7adj.github.io/Compari-prop-firm/${relative}`.replace(/([^:]\/)\/+/g, '$1');
}

const css = `
:root{--blue:#1a73e8;--ink:#111827;--muted:#5f6b7a;--line:#e5e7eb;--soft:#f7f9fc;--panel:#fff;--warn-bg:#fff7ed;--warn:#9a3412;--ok-bg:#eef6ff;--ok-line:#bfdbfe}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:Cairo,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--soft);color:var(--ink)}a{text-decoration:none;color:inherit}.shell{width:min(1180px,calc(100% - 32px));margin:auto}.topbar{position:sticky;top:0;z-index:10;background:rgba(255,255,255,.94);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}.nav{height:72px;display:flex;align-items:center;justify-content:space-between;gap:22px}.brand{display:flex;flex-direction:column;line-height:1.1}.brand strong{font-size:28px;font-weight:900;color:var(--blue)}.brand span{font-size:12px;color:var(--muted);font-weight:700}.links{display:flex;align-items:center;gap:22px;font-size:14px;font-weight:800;color:#4b5563}.links a:hover{color:var(--blue)}.cta,.btn.primary{background:var(--blue);color:#fff;border-color:var(--blue)}.cta,.btn{display:inline-flex;align-items:center;justify-content:center;border-radius:13px;padding:12px 17px;font-weight:900;border:1px solid var(--line)}.hero{display:grid;grid-template-columns:1.18fr .82fr;gap:26px;padding:48px 0 26px}.card{background:var(--panel);border:1px solid var(--line);border-radius:24px;box-shadow:0 18px 45px rgba(15,23,42,.05)}.panel,.hero-main,.hero-side{padding:28px}.eyebrow{margin:0 0 10px;color:var(--blue);font-size:13px;font-weight:900}h1{margin:0 0 18px;font-size:44px;line-height:1.25}h2{margin:0 0 12px;font-size:30px;line-height:1.35}.lead,p{color:var(--muted);line-height:1.9}.hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}.stats{display:grid;grid-template-columns:1fr 1fr;gap:12px}.stat{background:var(--soft);border:1px solid var(--line);border-radius:17px;padding:16px}.stat span{display:block;color:var(--muted);font-size:13px;font-weight:700}.stat strong{font-size:25px;font-weight:900}.risk{background:var(--warn-bg);border:1px solid #fed7aa;color:var(--warn);border-radius:16px;padding:15px;line-height:1.8;font-weight:700}.section{padding:24px 0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.chip{display:inline-flex;background:#fff;border:1px solid #d1d5db;border-radius:999px;padding:9px 14px;font-weight:900;color:#374151}.table-wrap{overflow:auto;border:1px solid var(--line);border-radius:18px;background:#fff}table{width:100%;border-collapse:collapse;min-width:820px;text-align:right}th{background:#f2f6ff;color:#374151;font-size:13px;font-weight:900}th,td{padding:15px 16px;border-bottom:1px solid var(--line);white-space:nowrap}tr:last-child td{border-bottom:0}tbody tr:hover{background:#fafafa}.badge{display:inline-flex;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:900;background:#eef6ff;color:#1f3b63}.footer{margin-top:30px;background:#111827;color:#d1d5db;padding:30px 0}.footer .shell{display:flex;justify-content:space-between;gap:20px;align-items:center}.footer strong{color:#fff;font-size:20px}@media(max-width:900px){.links{display:none}.hero,.grid{grid-template-columns:1fr}h1{font-size:32px}.footer .shell{align-items:flex-start;flex-direction:column}}@media(max-width:560px){.shell{width:min(100% - 22px,1180px)}.brand strong{font-size:23px}.card{border-radius:18px}.stats{grid-template-columns:1fr}th,td{padding:13px}}
`;

function layout({ title, description, body, canonical = '' }) {
  const safeTitle = esc(title);
  const safeDescription = esc(description);
  const safeCanonical = esc(absoluteUrl(canonical));
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${safeCanonical}" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>${css}</style>
</head>
<body>
<header class="topbar"><div class="shell nav"><a class="brand" href="/Compari-prop-firm/"><strong>محطة التمويل</strong><span>مقارنات مالية عربية منظمة</span></a><nav class="links"><a href="/Compari-prop-firm/categories/">التصنيفات</a><a href="/Compari-prop-firm/compare/">المقارنة</a><a href="/Compari-prop-firm/tools/">الأدوات</a></nav><a class="cta" href="/Compari-prop-firm/categories/">ابدأ التصفح</a></div></header>
${body}
<footer class="footer"><div class="shell"><strong>محطة التمويل</strong><span>المعلومات تعليمية وتنظيمية. راجع المصادر الرسمية قبل أي قرار مالي.</span></div></footer>
</body>
</html>`;
}

function tableRows(items, limit = items.length) {
  return items.slice(0, limit).map((c) => `
<tr>
  <td><strong><a href="/Compari-prop-firm/reviews/${esc(c.slug)}/">${esc(c.company_name)}</a></strong></td>
  <td>${esc(c.category_label || categoryLabels[c.category] || c.category)}</td>
  <td>${money(c.lowest_price_or_deposit)}</td>
  <td>${numberValue(c.max_account_size)}</td>
  <td>${joinList(c.platforms)}</td>
  <td><span class="badge">${esc(c.data_quality_status || '')}</span></td>
</tr>`).join('');
}

function companyTable(items, limit) {
  return `<div class="table-wrap"><table><thead><tr><th>الشركة</th><th>التصنيف</th><th>أقل سعر/إيداع</th><th>أكبر حساب</th><th>المنصات</th><th>حالة البيانات</th></tr></thead><tbody>${tableRows(items, limit)}</tbody></table></div>`;
}

function generateHome() {
  const ready = companies.filter((c) => c.data_quality_status === 'ready').length;
  const partial = companies.filter((c) => c.data_quality_status === 'partial').length;
  const cats = Object.entries(categoryLabels).map(([key, label]) => companies.filter((c) => c.category === key).length ? `<a class="chip" href="/Compari-prop-firm/category/${categorySlugs[key]}/">${esc(label)}</a>` : '').join('');
  const body = `<main><section class="shell hero"><div class="card hero-main"><p class="eyebrow">محرك مقارنة عربي لشركات التمويل والبروكرات</p><h1>قارن قبل أن تدفع أو تفتح حساب تداول</h1><p class="lead">موقع عربي يولّد صفحات ثابتة من ملفات JSON: مراجعات، تصنيفات، وجداول مقارنة قابلة للأرشفة في Google.</p><div class="hero-actions"><a class="btn primary" href="/Compari-prop-firm/categories/">عرض التصنيفات</a><a class="btn" href="/Compari-prop-firm/compare/">فتح المقارنة</a></div></div><aside class="card hero-side"><div class="stats"><div class="stat"><span>الشركات</span><strong>${companies.length}</strong></div><div class="stat"><span>Ready</span><strong>${ready}</strong></div><div class="stat"><span>Partial</span><strong>${partial}</strong></div><div class="stat"><span>التصنيفات</span><strong>5</strong></div></div><div class="risk">تحذير مخاطر: التداول وشركات التمويل والرافعة المالية قد تؤدي إلى خسائر كبيرة. المحتوى تعليمي وتنظيمي وليس توصية مالية.</div></aside></section><section class="shell section"><div class="card panel"><h2>التصنيفات</h2><p>كل تصنيف له صفحات ثابتة وقوائم قابلة للتوسيع من ملفات JSON.</p><div class="hero-actions">${cats}</div></div></section><section class="shell section"><div class="card panel"><h2>أحدث الشركات في قاعدة البيانات</h2>${companyTable(companies, 30)}</div></section></main>`;
  writeFile('index.html', layout({ title: 'محطة التمويل | مقارنة شركات التمويل والبروكرات', description: 'موقع عربي ثابت لتوليد مراجعات ومقارنات شركات التمويل والبروكرات ومنصات الكريبتو من ملفات JSON.', body }));
}

function generateCategories() {
  const cards = Object.entries(categoryLabels).map(([key, label]) => {
    const count = companies.filter((c) => c.category === key).length;
    return `<a class="card panel" href="/Compari-prop-firm/category/${categorySlugs[key]}/"><p class="eyebrow">${esc(label)}</p><h2>${esc(categoryArabic[key])}</h2><p>${count} عنصر في قاعدة البيانات.</p></a>`;
  }).join('');
  const body = `<main><section class="shell section"><h1>تصنيفات محطة التمويل</h1><p class="lead">تصفح الشركات والمنصات حسب النوع قبل فتح صفحة المراجعة أو المقارنة.</p><div class="grid">${cards}</div></section></main>`;
  writeFile('categories/index.html', layout({ title: 'التصنيفات | محطة التمويل', description: 'تصنيفات شركات التمويل والبروكرات ومنصات الكريبتو في محطة التمويل.', canonical: 'categories/', body }));

  Object.entries(categoryLabels).forEach(([key, label]) => {
    const items = companies.filter((c) => c.category === key);
    const body = `<main><section class="shell section"><p class="eyebrow">${esc(label)}</p><h1>${esc(categoryArabic[key])}</h1><p class="lead">قائمة ثابتة مولدة من JSON. تُعرض فقط الحقول المتوفرة بدون ملء فراغات غير موثقة.</p>${companyTable(items)}</section></main>`;
    writeFile(`category/${categorySlugs[key]}/index.html`, layout({ title: `${categoryArabic[key]} | محطة التمويل`, description: `قائمة ${categoryArabic[key]} في محطة التمويل مع بيانات منظمة للمراجعة والمقارنة.`, canonical: `category/${categorySlugs[key]}/`, body }));
  });
}

function generateReviews() {
  companies.forEach((c) => {
    const rows = [
      ['التصنيف', c.category_label || categoryLabels[c.category]],
      ['الموقع الرسمي', c.official_website ? `<a href="${esc(c.official_website)}" rel="nofollow noopener" target="_blank">فتح المصدر الرسمي</a>` : ''],
      ['حالة البيانات', c.data_quality_status],
      ['درجة الثقة', c.data_confidence],
      ['آخر فحص', c.last_checked],
      ['أقل سعر/إيداع', money(c.lowest_price_or_deposit)],
      ['أكبر حساب', numberValue(c.max_account_size)],
      ['المنصات', joinList(c.platforms)],
      ['الأسواق', joinList(c.markets)],
    ].filter(([, v]) => v !== '' && v !== null && v !== undefined);

    const bodyRows = rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${v}</td></tr>`).join('');
    const body = `<main><section class="shell section"><p class="eyebrow">مراجعة شركة</p><h1>مراجعة ${esc(c.company_name)}</h1><p class="lead">${esc(c.summary || 'صفحة مراجعة مولدة من قاعدة بيانات محطة التمويل.')}</p><div class="card panel"><h2>ملخص البيانات</h2><div class="table-wrap"><table><tbody>${bodyRows}</tbody></table></div></div><div class="card panel" style="margin-top:18px"><h2>تنبيه قبل القرار</h2><div class="risk">لا تعتمد على هذه الصفحة وحدها قبل شراء تحدي أو فتح حساب. راجع القواعد الرسمية، شروط السحب، وحدود الخسارة من موقع الشركة.</div></div></section></main>`;
    writeFile(`reviews/${c.slug}/index.html`, layout({ title: `مراجعة ${c.company_name} | محطة التمويل`, description: `مراجعة ${c.company_name} مع ملخص التصنيف والمنصات والأسواق وحالة البيانات.`, canonical: `reviews/${c.slug}/`, body }));
  });
}

function generateStaticPages() {
  const compareBody = `<main><section class="shell section"><h1>صفحة المقارنة</h1><p class="lead">هذه الصفحة ستستخدم ملفات JSON لاختيار شركتين أو أكثر وإنشاء جدول مقارنة ثابت. المرحلة التالية هي توليد صفحات مقارنة مثل fundednext-vs-ftmo.</p><div class="card panel">${companyTable(companies, 50)}</div></section></main>`;
  writeFile('compare/index.html', layout({ title: 'المقارنة | محطة التمويل', description: 'صفحة مقارنة شركات التمويل والبروكرات في محطة التمويل.', canonical: 'compare/', body: compareBody }));

  const toolsBody = `<main><section class="shell section"><h1>الأدوات</h1><p class="lead">ستضاف هنا أدوات عملية ثابتة أو تفاعلية: حاسبة المخاطرة، حاسبة الدرو داون، واختيار الشركة المناسبة حسب القواعد.</p><div class="card panel"><div class="risk">أي أداة حسابية تعليمية فقط وليست توصية مالية.</div></div></section></main>`;
  writeFile('tools/index.html', layout({ title: 'الأدوات | محطة التمويل', description: 'أدوات تعليمية لمقارنة المخاطر وقواعد شركات التمويل.', canonical: 'tools/', body: toolsBody }));
}

function generateSeoFiles() {
  const urls = ['', 'categories/', 'compare/', 'tools/', ...Object.values(categorySlugs).map((s) => `category/${s}/`), ...companies.map((c) => `reviews/${c.slug}/`)];
  writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${absoluteUrl(u)}</loc></url>`).join('\n')}\n</urlset>\n`);
  writeFile('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${absoluteUrl('sitemap.xml')}\n`);
  writeFile('.nojekyll', '');
}

fs.rmSync(outDir, { recursive: true, force: true });
ensureDir(outDir);
generateHome();
generateCategories();
generateReviews();
generateStaticPages();
generateSeoFiles();
console.log(`Generated ${companies.length} review pages into docs/`);
