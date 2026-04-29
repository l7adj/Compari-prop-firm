import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : 'true';
      out[key] = value;
    }
  }
  return out;
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/["\n,]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

async function writeCsv(filePath, rows, columns) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map((col) => csvEscape(row[col])).join(','));
  }
  await fs.writeFile(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function normalizeSnippet(text, max = 280) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function hasReviewFlag(text, flags = []) {
  const lower = String(text || '').toLowerCase();
  return flags.some((flag) => lower.includes(String(flag).toLowerCase()));
}

function extractFields(rawText, config) {
  const rows = [];
  const patterns = config.field_patterns || {};
  for (const [fieldName, regexList] of Object.entries(patterns)) {
    let found = false;
    for (const pattern of regexList) {
      const re = new RegExp(pattern, 'i');
      const match = rawText.match(re);
      if (match) {
        rows.push({
          field_name: fieldName,
          value: normalizeSnippet(match[1] || match[0], 120),
          source_text: normalizeSnippet(match[0]),
          confidence: 'medium',
          needs_review: false,
          review_reason: ''
        });
        found = true;
        break;
      }
    }
    if (!found) {
      rows.push({
        field_name: fieldName,
        value: '',
        source_text: '',
        confidence: 'low',
        needs_review: true,
        review_reason: 'field_not_found'
      });
    }
  }
  return rows;
}

async function clickByStrategy(page, label, strategy) {
  if (!label) return;
  if (strategy === 'text_exact') {
    await page.getByText(label, { exact: true }).first().click({ timeout: 7000 });
    return;
  }
  if (strategy === 'text_contains') {
    await page.getByText(label, { exact: false }).first().click({ timeout: 7000 });
    return;
  }
  if (strategy?.startsWith('selector:')) {
    const selectorTemplate = strategy.replace('selector:', '');
    const selector = selectorTemplate.replaceAll('{label}', label);
    await page.locator(selector).first().click({ timeout: 7000 });
    return;
  }
  await page.getByText(label, { exact: true }).first().click({ timeout: 7000 });
}

async function main() {
  const args = parseArgs();
  const configPath = args.config || process.env.COMPANY_CONFIG || 'agents/propfirm-agent/companies/template.company.json';
  const outputDir = args.output || process.env.OUTPUT_DIR || 'output';
  const saveScreenshots = String(process.env.SAVE_SCREENSHOTS || args.screenshots || 'false') === 'true';
  const config = await readJson(configPath);
  if (!config.source_url || config.source_url.includes('example.com')) {
    throw new Error('Set a real source_url in the company config before running the agent.');
  }

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

  const rawRows = [];
  const normalizedRows = [];
  const capturedAt = new Date().toISOString();

  try {
    await page.goto(config.source_url, { waitUntil: 'networkidle', timeout: 90000 });
    if (config.selectors?.ready) await page.locator(config.selectors.ready).first().waitFor({ timeout: 30000 });

    for (const programType of config.program_types || ['']) {
      let programClickStatus = 'ok';
      if (programType) {
        try {
          await clickByStrategy(page, programType, config.click_strategy?.program_type);
          await page.waitForTimeout(800);
        } catch (error) {
          programClickStatus = `program_click_failed: ${error.message}`;
        }
      }

      for (const accountSize of config.account_sizes || ['']) {
        let accountClickStatus = 'ok';
        if (accountSize) {
          try {
            await clickByStrategy(page, accountSize, config.click_strategy?.account_size);
            await page.waitForTimeout(1000);
          } catch (error) {
            accountClickStatus = `account_click_failed: ${error.message}`;
          }
        }

        const scope = config.selectors?.result_scope || 'body';
        const rawVisibleText = await page.locator(scope).first().innerText({ timeout: 30000 });
        const interactionPath = [programType, accountSize].filter(Boolean).join(' > ') || 'default_view';
        const reviewByContext = hasReviewFlag(rawVisibleText, config.review_flags);

        let screenshotPath = '';
        if (saveScreenshots) {
          const safeName = interactionPath.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').toLowerCase();
          screenshotPath = path.join(outputDir, 'screenshots', `${safeName || 'default'}.png`);
          await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
          await page.screenshot({ path: screenshotPath, fullPage: true });
        }

        rawRows.push({
          company_name: config.company_name,
          entity_type: config.entity_type,
          program_type: programType,
          account_size: accountSize,
          interaction_path: interactionPath,
          source_url: config.source_url,
          program_click_status: programClickStatus,
          account_click_status: accountClickStatus,
          raw_visible_text: rawVisibleText,
          screenshot_path: screenshotPath,
          captured_at: capturedAt
        });

        const extracted = extractFields(rawVisibleText, config);
        for (const item of extracted) {
          const needsReview = item.needs_review || reviewByContext || programClickStatus !== 'ok' || accountClickStatus !== 'ok';
          const reviewReasons = [
            item.review_reason,
            reviewByContext ? 'discount_or_promo_context_detected' : '',
            programClickStatus !== 'ok' ? programClickStatus : '',
            accountClickStatus !== 'ok' ? accountClickStatus : ''
          ].filter(Boolean).join(' | ');

          normalizedRows.push({
            company_name: config.company_name,
            entity_type: config.entity_type,
            program_type: programType,
            account_size: accountSize,
            field_name: item.field_name,
            value: item.value,
            source_url: config.source_url,
            interaction_path: interactionPath,
            source_text: item.source_text,
            confidence: needsReview ? 'low' : item.confidence,
            needs_review: needsReview,
            review_reason: reviewReasons,
            captured_at: capturedAt
          });
        }
      }
    }
  } finally {
    await browser.close();
  }

  const rawColumns = [
    'company_name', 'entity_type', 'program_type', 'account_size', 'interaction_path', 'source_url',
    'program_click_status', 'account_click_status', 'raw_visible_text', 'screenshot_path', 'captured_at'
  ];
  const normalizedColumns = [
    'company_name', 'entity_type', 'program_type', 'account_size', 'field_name', 'value', 'source_url',
    'interaction_path', 'source_text', 'confidence', 'needs_review', 'review_reason', 'captured_at'
  ];

  await writeCsv(path.join(outputDir, 'raw_scrape_results.csv'), rawRows, rawColumns);
  await writeCsv(path.join(outputDir, 'normalized_pending_review.csv'), normalizedRows, normalizedColumns);

  console.log(`Raw rows: ${rawRows.length}`);
  console.log(`Normalized rows: ${normalizedRows.length}`);
  console.log(`Output dir: ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
