import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { scrapeCompany, writeCsv, rawColumns, normalizedColumns } from './scrape.mjs';

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

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.companies)) return payload.companies;
  throw new Error('Batch file must be an array or an object with companies[].');
}

function filterCompanies(companies, args) {
  let out = companies;
  const categories = String(args.categories || process.env.AGENT_CATEGORIES || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const slugs = String(args.slugs || process.env.AGENT_SLUGS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  if (categories.length) out = out.filter((c) => categories.includes(c.entity_type || c.candidate_category));
  if (slugs.length) out = out.filter((c) => slugs.includes(c.slug));
  return out;
}

async function main() {
  const args = parseArgs();
  const batchPath = args.batch || process.env.COMPANY_BATCH || 'agents/propfirm-agent/companies/prop-firms.seed.json';
  const outputDir = args.output || process.env.OUTPUT_DIR || 'output';
  const limit = Number(args.limit || process.env.AGENT_LIMIT || 5);
  const offset = Number(args.offset || process.env.AGENT_OFFSET || 0);
  const saveScreenshots = String(args.screenshots || process.env.SAVE_SCREENSHOTS || 'false') === 'true';

  const payload = await readJson(batchPath);
  const companies = filterCompanies(asArray(payload), args).slice(offset, offset + limit);

  const allRawRows = [];
  const allNormalizedRows = [];
  const runRows = [];
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  try {
    for (const company of companies) {
      const start = Date.now();
      try {
        const config = {
          auto_discover: true,
          selectors: { ready: 'body', result_scope: 'body' },
          click_strategy: { program_type: 'text_contains', account_size: 'text_contains' },
          max_program_types: 8,
          max_account_sizes: 12,
          max_interactions: 24,
          ...company,
          entity_type: company.entity_type || company.candidate_category,
          source_url: company.source_url || company.official_website
        };

        const result = await scrapeCompany(config, { browser, outputDir, saveScreenshots });
        allRawRows.push(...result.rawRows);
        allNormalizedRows.push(...result.normalizedRows);
        runRows.push({
          company_name: config.company_name,
          slug: config.slug,
          entity_type: config.entity_type,
          source_url: config.source_url,
          status: 'ok',
          raw_rows: result.rawRows.length,
          normalized_rows: result.normalizedRows.length,
          duration_ms: Date.now() - start,
          error: ''
        });
        console.log(`[ok] ${config.slug}: raw=${result.rawRows.length} normalized=${result.normalizedRows.length}`);
      } catch (error) {
        runRows.push({
          company_name: company.company_name,
          slug: company.slug,
          entity_type: company.entity_type || company.candidate_category,
          source_url: company.source_url || company.official_website,
          status: 'failed',
          raw_rows: 0,
          normalized_rows: 0,
          duration_ms: Date.now() - start,
          error: String(error.message || error).slice(0, 500)
        });
        console.error(`[failed] ${company.slug}: ${error.message}`);
      }
    }
  } finally {
    await browser.close();
  }

  await writeCsv(path.join(outputDir, 'batch_run_report.csv'), runRows, [
    'company_name', 'slug', 'entity_type', 'source_url', 'status', 'raw_rows', 'normalized_rows', 'duration_ms', 'error'
  ]);
  await writeCsv(path.join(outputDir, 'raw_scrape_results.csv'), allRawRows, rawColumns);
  await writeCsv(path.join(outputDir, 'normalized_pending_review.csv'), allNormalizedRows, normalizedColumns);

  console.log(`Companies attempted: ${companies.length}`);
  console.log(`Raw rows: ${allRawRows.length}`);
  console.log(`Normalized rows: ${allNormalizedRows.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
