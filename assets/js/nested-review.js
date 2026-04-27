document.addEventListener('DOMContentLoaded', function () {
  var path = window.location.pathname;
  if (path.indexOf('/category/cfd-prop-firms/') === -1) return;
  // في البنية الجديدة، app.js هو المسؤول عن الجدول والتفاصيل بالكامل.
  // نخرج مبكراً لمنع التعارض مع واجهة التصنيف الحالية.
  if (document.querySelector('#category-summary-table') || document.querySelector('#category-table-body')) return;

  var base = path.indexOf('/Compari-prop-firm/') === 0 ? '/Compari-prop-firm/' : '/';

  fetch(base + 'src/data/detailed/cfd-prop-firms.json', { cache: 'no-store' })
    .then(function (response) { return response.json(); })
    .then(function (data) {
      if (!data || !Array.isArray(data.companies)) return;
      renderNestedCfdReviews(data.companies);
    })
    .catch(function () {});
});

function nrEsc(value) {
  return String(value == null || value === '' ? 'غير متوفر' : value).replace(/[&<>\"]/g, function (char) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[char];
  });
}

function nrBadge(value) {
  var text = String(value || 'Needs Review');
  var lower = text.toLowerCase();
  if (lower.indexOf('ready') > -1 || lower.indexOf('complete') > -1) return '<span class="badge badge-ready">Ready</span>';
  if (lower.indexOf('partial') > -1) return '<span class="badge badge-partial">Partial</span>';
  return '<span class="badge badge-review">Needs Review</span>';
}

function nrInitials(name) {
  var clean = String(name || '').replace(/\[|\]/g, '').trim();
  if (!clean) return '--';
  var parts = clean.split(/\s+/).filter(Boolean);
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[1][0]).toUpperCase();
}

function nrCompanyCell(company) {
  return '<div class="company-cell"><span class="company-logo-fallback">' + nrInitials(company.company_name) + '</span><span><span class="company-name-small">' + nrEsc(company.company_name || '[Company Name]') + '</span></span></div>';
}

function nrMiniTable(title, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return '<div class="empty-state">' + nrEsc(title) + ': غير متوفر حالياً — القسم جاهز للتعبئة.</div>';
  }
  var keys = Object.keys(rows[0]);
  return '<div class="table-wrapper nested-table"><h3 style="padding:14px 14px 0">' + nrEsc(title) + '</h3><table><thead><tr>' +
    keys.map(function (key) { return '<th>' + nrEsc(key) + '</th>'; }).join('') +
    '</tr></thead><tbody>' +
    rows.map(function (row) {
      return '<tr>' + keys.map(function (key) { return '<td>' + nrEsc(row[key]) + '</td>'; }).join('') + '</tr>';
    }).join('') +
    '</tbody></table></div>';
}

function nrVariant(variant) {
  return '<details class="variant-card" open>' +
    '<summary>' + nrEsc(variant.variant_name) + ' · ' + nrEsc(variant.program_type) + '</summary>' +
    '<div class="variant-body">' +
      '<div class="review-tabs"><span class="active">Account Sizes</span><span>Phase Rules</span><span>Drawdown</span><span>Trading</span><span>Payout</span><span>Costs</span><span>Hidden Rules</span></div>' +
      nrMiniTable('Account Sizes Table', variant.account_sizes) +
      nrMiniTable('Phase Rules Table', variant.phase_rules) +
      nrMiniTable('Drawdown Mechanics Table', variant.drawdown_mechanics) +
      nrMiniTable('Trading Permissions Table', variant.trading_permissions) +
      nrMiniTable('Payout & Funded Stage Table', variant.payout_and_funded_stage) +
      nrMiniTable('Costs & Execution Table', variant.costs_and_execution) +
      nrMiniTable('Hidden Rules & Red Flags Table', variant.hidden_rules_red_flags) +
    '</div>' +
  '</details>';
}

function nrProgramGroup(group) {
  var variants = Array.isArray(group.variants) ? group.variants : [];
  return '<details class="program-group-card" open>' +
    '<summary>' + nrEsc(group.group_name) + ' · ' + nrEsc(group.available) + '</summary>' +
    '<div class="variant-body">' +
      '<p class="section-subtitle">' + nrEsc(group.description) + '</p>' +
      (variants.length ? variants.map(nrVariant).join('') : '<div class="empty-state">هذا البرنامج غير متوفر أو لم يتم إدخال بياناته بعد.</div>') +
    '</div>' +
  '</details>';
}

function renderNestedCfdReviews(companies) {
  var container = document.querySelector('main .container');
  if (!container) return;

  var old = document.querySelector('.details-section');
  if (old) old.remove();

  var section = document.createElement('section');
  section.className = 'details-section nested-review-section';
  section.innerHTML = '<h2 class="section-title">Review عميق لكل شركة: البرامج ← الأنواع ← الحسابات ← القواعد</h2>' +
    '<p class="section-subtitle">هذا هو المنطق الصحيح: لا نسطح بيانات الشركة في جدول واحد. كل برنامج له Variants، وكل Variant له أحجام حسابات وجداول قواعد وشروط مخفية ومصادر.</p>' +
    '<div class="details-grid">' + companies.map(function (company) {
      var groups = Array.isArray(company.program_groups) ? company.program_groups : [];
      var totalAccounts = groups.reduce(function (sum, group) {
        return sum + (Array.isArray(group.variants) ? group.variants.reduce(function (vsum, variant) {
          return vsum + (Array.isArray(variant.account_sizes) ? variant.account_sizes.length : 0);
        }, 0) : 0);
      }, 0);

      return '<article class="company-card">' +
        '<div class="company-card-head">' +
          '<div>' + nrCompanyCell(company) + '<div class="company-meta">CFD Prop Firm · ' + nrEsc(company.last_checked) + '</div></div>' +
          '<div class="company-actions">' + nrBadge(company.data_status) + '<span class="btn btn-outline">[Official Source]</span></div>' +
        '</div>' +
        '<div class="company-card-body">' +
          '<div class="metric-grid">' +
            '<div class="metric"><span class="metric-label">Program Groups</span><span class="metric-value">' + groups.length + '</span></div>' +
            '<div class="metric"><span class="metric-label">Variants</span><span class="metric-value">' + groups.reduce(function (n, g) { return n + ((g.variants || []).length); }, 0) + '</span></div>' +
            '<div class="metric"><span class="metric-label">Account Rows</span><span class="metric-value">' + totalAccounts + '</span></div>' +
            '<div class="metric"><span class="metric-label">Missing Data</span><span class="metric-value"><span class="badge badge-review">Needs Verification</span></span></div>' +
          '</div>' +
          '<div class="summary-box">' + nrEsc(company.summary) + '</div>' +
          '<div class="review-tabs"><span class="active">Overview</span><span>Programs</span><span>Account Sizes</span><span>Risk Rules</span><span>Trading Rules</span><span>Payouts</span><span>Costs</span><span>Hidden Rules</span><span>Arab User</span><span>Sources</span></div>' +
          groups.map(nrProgramGroup).join('') +
          nrMiniTable('Arab User Relevance', company.arab_user_relevance) +
          nrMiniTable('Official Sources', company.official_sources) +
        '</div>' +
      '</article>';
    }).join('') + '</div>';

  container.appendChild(section);
}
