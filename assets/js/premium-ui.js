(() => {
  const enhance = () => {
    document.body.classList.add('premium-ui-ready');
    enhanceReview();
    enhanceCompare();
    enhanceTables();
  };

  const observeTarget = () => {
    const targets = ['#review-header', '#review-metrics', '#review-tabs', '#compare-output']
      .map((selector) => document.querySelector(selector))
      .filter(Boolean);

    if (!targets.length) return;
    const observer = new MutationObserver(() => window.requestAnimationFrame(enhance));
    targets.forEach((target) => observer.observe(target, { childList: true, subtree: true }));
    window.requestAnimationFrame(enhance);
  };

  const enhanceReview = () => {
    const header = document.querySelector('#review-header');
    const metrics = document.querySelector('#review-metrics');
    const tabs = document.querySelector('#review-tabs');
    if (header) header.classList.add('premium-review-header');
    if (metrics) metrics.classList.add('premium-metric-wall');
    if (tabs) tabs.classList.add('premium-review-tabs');

    document.querySelectorAll('#review-tabs .tab-panel').forEach((panel, index) => {
      panel.classList.add('premium-tab-panel');
      if (!panel.querySelector('.premium-panel-title')) {
        const title = document.createElement('div');
        title.className = 'premium-panel-title';
        title.innerHTML = `<span>0${index + 1}</span><strong>${getActiveTabLabel(index)}</strong>`;
        panel.prepend(title);
      }
    });
  };

  const enhanceCompare = () => {
    const output = document.querySelector('#compare-output');
    if (!output) return;
    output.classList.add('premium-compare-output');

    const firstPanel = output.querySelector('.panel, .card, .table-wrapper');
    if (firstPanel && !output.querySelector('.premium-decision-strip')) {
      const strip = document.createElement('div');
      strip.className = 'premium-decision-strip';
      strip.innerHTML = `
        <div><span>Comparison Mode</span><strong>قرار سريع مبني على محور محدد</strong></div>
        <p>استخدم هذه الصفحة لاختيار الفائز في محور واحد. التفاصيل الكاملة تبقى في صفحة المراجعة.</p>
      `;
      output.prepend(strip);
    }
  };

  const enhanceTables = () => {
    document.querySelectorAll('.table-wrapper table').forEach((table) => {
      table.classList.add('premium-data-table');
      table.querySelectorAll('tbody tr').forEach((row) => {
        const cells = Array.from(row.children);
        cells.forEach((cell) => {
          const text = cell.textContent.trim().toLowerCase();
          if (text.includes('ready') || text.includes('نعم') || text.includes('allowed')) cell.classList.add('cell-positive');
          if (text.includes('partial') || text.includes('needs verification') || text.includes('غير متوفر')) cell.classList.add('cell-warning');
          if (text.includes('not allowed') || text.includes('لا') || text.includes('restricted')) cell.classList.add('cell-negative');
        });
      });
    });
  };

  const getActiveTabLabel = (index) => {
    const buttons = Array.from(document.querySelectorAll('#review-tabs .tabs-nav button'));
    return buttons[index]?.textContent?.trim() || 'تفاصيل المراجعة';
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeTarget);
  } else {
    observeTarget();
  }
})();
