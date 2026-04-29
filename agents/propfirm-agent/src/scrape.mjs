import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DEFAULT_FIELD_PATTERNS = {
  base_fee: [
    '(?:challenge\\s*)?(?:fee|price|cost|registration fee|account fee)\\s*[:\\-]?\\s*[$€£]?\\s*([0-9][0-9,.]*)',
    '[$€£]\\s*([0-9][0-9,.]*)'
  ],
  profit_target_phase_1: [
    '(?:phase\\s*1|step\\s*1|challenge)\\s*(?:profit target|target)\\s*[:\\-]?\\s*([0-9]{1,2}(?:\\.[0-9]+)?%)',
    '(?:profit target|target)\\s*[:\\-]?\\s*([0-9]{1,2}(?:\\.[0-9]+)?%)'
  ],
  profit_target_phase_2: [
    '(?:phase\\s*2|step\\s*2|verification)\\s*(?:profit target|target)\\s*[:\\-]?\\s*([0-9]{1,2}(?:\\.[0-9]+)?%)'
  ],
  max_daily_loss: [
    '(?:max daily loss|daily loss|daily drawdown|daily limit|daily loss limit)\\s*[:\\-]?\\s*([0-9]{1,2}(?:\\.[0-9]+)?%)'
  ],
  max_total_loss: [
    '(?:max total loss|max loss|maximum loss|overall loss|total loss|max drawdown|overall drawdown|trailing drawdown)\\s*[:\\-]?\\s*([0-9]{1,2}(?:\\.[0-9]+)?%)'
  ],
  profit_split: [
    '(?:profit split|payout split|split|profit share)\\s*[:\\-]?\\s*([0-9]{1,3}(?:\\.[0-9]+)?%)'
  ],
  min_trading_days: [
    '(?:minimum trading days|min trading days|trading days)\\s*[:\\-]?\\s*([0-9]+)'
  ],
  refund: [
    '(?:refund|refundable|fee refund)\\s*[:\\-]?\\s*([^\\n]+)'
  ]
};

const DEFAULT_REVIEW_FLAGS = [
  'discount', 'coupon', 'promo', 'save', 'off', 'limited time', 'code', 'sale', 'black friday', 'flash'
];

const PROGRAM_KEYWORDS = [
  'one step', '1 step', 'one-step', '1-step', 'two step', '2 step', 'two-step', '2-step',
  'instant', 'express', 'evaluation', 'challenge', 'verification', 'funded', 'starter', 'standard',
  'pro', 'pro+', 'expert', 'elite', 'growth', 'static', 'stellar', 'high stakes', 'bootcamp',
  'gauntlet', 'apex', 'swing', 'aggressive', 'normal', 'rapid'
];

const ACCOUNT_SIZE_RE = /(?:^|[\s$€£])(?:[$€£]\s*)?([0-9]{1,3}(?:,[0-9]{3})*|[0-9]{1,3})(?:\s?)(k|K|m|M|000)(?:\b|\s|$)/;

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

export async function writeCsv(filePath, rows, columns) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const lines = [columns.join(',')];
  for (const row of rows) lines.push(columns.map((col) => csvEscape(row[col])).join(','));
  await fs.writeFile(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function uniqClean(values, limit = 50) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text || text.length > 80) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
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
  const patterns = config.field_patterns || DEFAULT_FIELD_PATTERNS;
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

async function getClickableTexts(page) {
  return page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('button, a, [role="button"], [role="tab"], label, option'));
    return nodes
      .map((el) => (el.innerText || el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  });
}

async function discoverInteractions(page, config) {
  if (config.auto_discover === false) {
    return {
      programTypes: config.program_types?.length ? config.program_types : [''],
      accountSizes: config.account_sizes?.length ? config.account_sizes : [''],
      discoveredLabels: []
    };
  }

  const labels = uniqClean(await getClickableTexts(page), 200);
  const discoveredPrograms = labels.filter((label) => {
    const lower = label.toLowerCase();
    return PROGRAM_KEYWORDS.some((kw) => lower.includes(kw)) && label.length <= 60;
  });
  const discoveredSizes = labels.filter((label) => ACCOUNT_SIZE_RE.test(label)).map((label) => {
    const match = label.match(/[$€£]?\s*[0-9]{1,3}(?:,[0-9]{3})?\s?(?:k|K|m|M|000)/);
    return match ? match[0].replace(/\s+/g, '') : label;
  });

  const programTypes = config.program_types?.length ? config.program_types : uniqClean(discoveredPrograms, config.max_program_types || 8);
  const accountSizes = config.account_sizes?.length ? config.account_sizes : uniqClean(discoveredSizes, config.max_account_sizes || 12);

  return {
    programTypes: programTypes.length ? programTypes : [''],
    accountSizes: accountSizes.length ? accountSizes : [''],
    discoveredLabels: labels
  };
}

async function clickByStrategy(page, label, strategy) {
  if (!label) return;
  if (strategy === 'text_exact') {
    await page.getByText(label, { exact: true }).first().click({ timeout: 7000 });
    return;
  }
  if (strategy === 'text_contains' || !strategy) {
    await page.getByText(label, { exact: false }).first().click({ timeout: 7000 });
    return;
  }
  if (strategy?.startsWith('selector:')) {
    const selectorTemplate = strategy.replace('selector:', '');
    const selector = selectorTemplate.replaceAll('{label}', label);
    await page.locator(selector).first().click({ timeout: 7000 });
    return;
  }
  await page.getByText(label, { exact: false }).first().click({ timeout: 7000 });
}

function makeSafeFileName(value) {
  return String(value || 'default').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').toLowerCase() || 'default';
}

function buildNormalizedRows({ config, rawVisibleText, programType, accountSize, interactionPath, reviewByContext, programClickStatus, accountClickStatus, capturedAt }) {
  const rows = [];
  const extracted = extractFields(rawVisibleText, config);
  for (const item of extracted) {
    const needsReview = item.needs_review || reviewByContext || programClickStatus !== 'ok' || accountClickStatus !== 'ok';
    const reviewReasons = [
      item.review_reason,
      reviewByContext ? 'discount_or_promo_context_detected' : '',
      programClickStatus !== 'ok' ? programClickStatus : '',
      accountClickStatus !== 'ok' ? accountClickStatus : ''
    ].filter(Boolean).join(' | ');

    rows.push({
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
  return rows;
}

export async function scrapeCompany(config, options = {}) {
  if (!config.source_url || config.source_url.includes('example.com')) {
    throw new Error(`Set a real source_url for ${config.company_name || 'company'} before running the agent.`);
  }

  const outputDir = options.outputDir || process.env.OUTPUT_DIR || 'output';
  const saveScreenshots = options.saveScreenshots ?? String(process.env.SAVE_SCREENSHOTS || 'false') === 'true';
  const browser = options.browser || await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const shouldCloseBrowser = !options.browser;
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const rawRows = [];
  const normalizedRows = [];
  const capturedAt = new Date().toISOString();

  try {
    await page.goto(config.source_url, { waitUntil: 'networkidle', timeout: config.timeout_ms || 90000 });
    if (config.selectors?.ready) await page.locator(config.selectors.ready).first().waitFor({ timeout: 30000 });

    const discovered = await discoverInteractions(page, config);
    const maxInteractions = Number(config.max_interactions || options.maxInteractions || 40);
    let interactionCount = 0;

    for (const programType of discovered.programTypes) {
      for (const accountSize of discovered.accountSizes) {
        if (interactionCount >= maxInteractions) break;
        interactionCount += 1;

        await page.goto(config.source_url, { waitUntil: 'networkidle', timeout: config.timeout_ms || 90000 });
        if (config.selectors?.ready) await page.locator(config.selectors.ready).first().waitFor({ timeout: 30000 });

        let programClickStatus = 'ok';
        if (programType) {
          try {
            await clickByStrategy(page, programType, config.click_strategy?.program_type || 'text_contains');
            await page.waitForTimeout(config.after_click_wait_ms || 900);
          } catch (error) {
            programClickStatus = `program_click_failed: ${normalizeSnippet(error.message, 180)}`;
          }
        }

        let accountClickStatus = 'ok';
        if (accountSize) {
          try {
            await clickByStrategy(page, accountSize, config.click_strategy?.account_size || 'text_contains');
            await page.waitForTimeout(config.after_click_wait_ms || 1000);
          } catch (error) {
            accountClickStatus = `account_click_failed: ${normalizeSnippet(error.message, 180)}`;
          }
        }

        const scope = config.selectors?.result_scope || 'body';
        const rawVisibleText = await page.locator(scope).first().innerText({ timeout: 30000 });
        const interactionPath = [programType, accountSize].filter(Boolean).join(' > ') || 'default_view';
        const reviewByContext = hasReviewFlag(rawVisibleText, config.review_flags || DEFAULT_REVIEW_FLAGS);

        let screenshotPath = '';
        if (saveScreenshots) {
          screenshotPath = path.join(outputDir, 'screenshots', makeSafeFileName(`${config.slug || config.company_name}_${interactionPath}`) + '.png');
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
          discovered_labels: discovered.discoveredLabels.join(' | '),
          raw_visible_text: rawVisibleText,
          screenshot_path: screenshotPath,
          captured_at: capturedAt
        });

        normalizedRows.push(...buildNormalizedRows({
          config,
          rawVisibleText,
          programType,
          accountSize,
          interactionPath,
          reviewByContext,
          programClickStatus,
          accountClickStatus,
          capturedAt
        }));
      }
    }
  } finally {
    await page.close().catch(() => {});
    if (shouldCloseBrowser) await browser.close();
  }

  return { rawRows, normalizedRows };
}

export const rawColumns = [
  'company_name', 'entity_type', 'program_type', 'account_size', 'interaction_path', 'source_url',
  'program_click_status', 'account_click_status', 'discovered_labels', 'raw_visible_text', 'screenshot_path', 'captured_at'
];

export const normalizedColumns = [
  'company_name', 'entity_type', 'program_type', 'account_size', 'field_name', 'value', 'source_url',
  'interaction_path', 'source_text', 'confidence', 'needs_review', 'review_reason', 'captured_at'
];

async function main() {
  const args = parseArgs();
  const configPath = args.config || process.env.COMPANY_CONFIG || 'agents/propfirm-agent/companies/template.company.json';
  const outputDir = args.output || process.env.OUTPUT_DIR || 'output';
  const config = await readJson(configPath);
  const { rawRows, normalizedRows } = await scrapeCompany(config, {
    outputDir,
    saveScreenshots: String(process.env.SAVE_SCREENSHOTS || args.screenshots || 'false') === 'true'
  });

  await writeCsv(path.join(outputDir, 'raw_scrape_results.csv'), rawRows, rawColumns);
  await writeCsv(path.join(outputDir, 'normalized_pending_review.csv'), normalizedRows, normalizedColumns);

  console.log(`Raw rows: ${rawRows.length}`);
  console.log(`Normalized rows: ${normalizedRows.length}`);
  console.log(`Output dir: ${outputDir}`);
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
