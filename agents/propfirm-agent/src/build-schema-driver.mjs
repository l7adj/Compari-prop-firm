import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const ENTITY_PACKAGES = [
  {
    entity_type: 'broker',
    folder: '01_brokers',
    schema_files: ['00_schema_core_shared.sql', '01_schema_brokers_v3_2_lite_clean.sql'],
    company_sources: 'company_sources_brokers.csv'
  },
  {
    entity_type: 'cfd_prop_firm',
    folder: '02_cfd_prop_firms',
    schema_files: ['00_schema_core_shared.sql', '02_schema_cfd_prop_firms_v3_1.sql'],
    company_sources: 'company_sources_cfd_prop_firms.csv'
  },
  {
    entity_type: 'futures_prop_firm',
    folder: '03_futures_prop_firms',
    schema_files: ['00_schema_core_shared.sql', '03_schema_futures_prop_firms_v3_1.sql'],
    company_sources: 'company_sources_futures_prop_firms.csv'
  },
  {
    entity_type: 'crypto_exchange',
    folder: '04_crypto_exchanges',
    schema_files: ['00_schema_core_shared.sql', '05_schema_crypto_exchanges_v3_core_aligned.sql'],
    company_sources: 'company_sources_crypto_exchanges.csv'
  },
  {
    entity_type: 'crypto_prop_firm',
    folder: '05_crypto_prop_firms',
    schema_files: ['00_schema_core_shared.sql', '04_schema_crypto_prop_firms_v3_1.sql'],
    company_sources: 'company_sources_crypto_prop_firms.csv'
  }
];

const BASE_FIELD_MAPPINGS = {
  cfd_prop_firm: {
    base_fee: ['cfd_prop_account_sizes', ['price', 'original_price', 'monthly_fee', 'activation_fee', 'reset_fee'], 'pricing', 'money_or_number'],
    profit_target_phase_1: ['cfd_prop_phase_rules', ['profit_target_pct', 'profit_target_amount'], 'profit_target', 'percent', { phase_number: 1 }],
    profit_target_phase_2: ['cfd_prop_phase_rules', ['profit_target_pct', 'profit_target_amount'], 'profit_target', 'percent', { phase_number: 2 }],
    max_daily_loss: ['cfd_prop_drawdown_rules', ['daily_drawdown_pct', 'daily_drawdown_amount'], 'risk_limit', 'percent'],
    max_total_loss: ['cfd_prop_drawdown_rules', ['max_drawdown_pct', 'max_drawdown_amount'], 'risk_limit', 'percent'],
    profit_split: ['cfd_prop_payout_rules', ['profit_split'], 'payout', 'percent'],
    min_trading_days: ['cfd_prop_phase_rules', ['min_trading_days'], 'trading_rule', 'integer'],
    refund: ['cfd_prop_account_sizes', ['source_notes'], 'pricing', 'text']
  },
  futures_prop_firm: {
    base_fee: ['futures_prop_account_sizes', ['monthly_price', 'one_time_price', 'activation_fee', 'reset_fee', 'data_fee', 'platform_fee'], 'pricing', 'money_or_number'],
    profit_target_phase_1: ['futures_prop_phase_rules', ['profit_target_amount', 'profit_target_pct'], 'profit_target', 'money_or_number', { phase_number: 1 }],
    profit_target_phase_2: ['futures_prop_phase_rules', ['profit_target_amount', 'profit_target_pct'], 'profit_target', 'money_or_number', { phase_number: 2 }],
    max_daily_loss: ['futures_prop_phase_rules', ['daily_loss_limit_amount', 'daily_loss_limit_pct'], 'risk_limit', 'money_or_number'],
    max_total_loss: ['futures_prop_phase_rules', ['max_drawdown_amount', 'trailing_drawdown_amount', 'max_drawdown_pct'], 'risk_limit', 'money_or_number'],
    profit_split: ['futures_prop_payout_rules', ['profit_split'], 'payout', 'percent'],
    min_trading_days: ['futures_prop_phase_rules', ['min_trading_days'], 'trading_rule', 'integer'],
    refund: ['futures_prop_account_sizes', ['source_notes'], 'pricing', 'text']
  },
  crypto_prop_firm: {
    base_fee: ['crypto_prop_account_sizes', ['price', 'original_price', 'activation_fee', 'reset_fee', 'monthly_fee', 'total_first_month_cost'], 'pricing', 'money_or_number'],
    profit_target_phase_1: ['crypto_prop_phase_drawdown_rules', ['profit_target_pct', 'profit_target_amount'], 'profit_target', 'percent', { phase_number: 1 }],
    profit_target_phase_2: ['crypto_prop_phase_drawdown_rules', ['profit_target_pct', 'profit_target_amount'], 'profit_target', 'percent', { phase_number: 2 }],
    max_daily_loss: ['crypto_prop_phase_drawdown_rules', ['daily_drawdown_pct', 'daily_drawdown_amount'], 'risk_limit', 'percent'],
    max_total_loss: ['crypto_prop_phase_drawdown_rules', ['max_drawdown_pct', 'max_drawdown_amount'], 'risk_limit', 'percent'],
    profit_split: ['crypto_prop_kyc_payout_rules', ['profit_split'], 'payout', 'percent'],
    min_trading_days: ['crypto_prop_phase_drawdown_rules', ['min_trading_days'], 'trading_rule', 'integer'],
    refund: ['crypto_prop_phase_drawdown_rules', ['refund_conditions', 'source_notes'], 'pricing', 'text']
  }
};

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

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function stripBom(value) {
  return String(value || '').replace(/^\uFEFF/, '');
}

function splitCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

async function readCsv(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map(stripBom);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? '';
    });
    return row;
  });
}

function parseTables(sql, sourceFile) {
  const tables = {};
  const tableRe = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/gi;
  let match;
  while ((match = tableRe.exec(sql))) {
    const tableName = match[1];
    const body = match[2];
    const columns = [];
    for (const rawLine of body.split(/\r?\n/)) {
      const line = rawLine.trim().replace(/,$/, '');
      if (!line || line.startsWith('--')) continue;
      if (/^(FOREIGN|UNIQUE|PRIMARY|CHECK|CONSTRAINT)\b/i.test(line)) continue;
      const col = line.match(/^([a-zA-Z0-9_]+)\s+(.+)$/);
      if (!col) continue;
      columns.push({ name: col[1], type: col[2].trim() });
    }
    tables[tableName] = { source_file: sourceFile, columns };
  }
  return tables;
}

async function decodeAndExtractBundle(bundlePath, workDir) {
  if (!fsSync.existsSync(bundlePath)) {
    throw new Error(`Schema bundle not found: ${bundlePath}`);
  }
  await ensureDir(workDir);
  const zipPath = path.join(workDir, 'schema_bundle.zip');
  const b64 = await fs.readFile(bundlePath, 'utf8');
  await fs.writeFile(zipPath, Buffer.from(b64.replace(/\s+/g, ''), 'base64'));
  execFileSync('unzip', ['-o', zipPath, '-d', workDir], { stdio: 'inherit' });
  const entries = await fs.readdir(workDir, { withFileTypes: true });
  const root = entries.find((entry) => entry.isDirectory() && entry.name.startsWith('schema_and_company_sources_by_type'));
  if (!root) throw new Error(`Unable to find extracted schema root in ${workDir}`);
  return path.join(workDir, root.name);
}

function tableHasColumn(tables, table, column) {
  return Boolean(tables[table]?.columns?.some((c) => c.name === column));
}

function buildMappings(tables) {
  const result = {};
  for (const [entityType, fields] of Object.entries(BASE_FIELD_MAPPINGS)) {
    result[entityType] = {};
    for (const [fieldName, [targetTable, preferredColumns, conditionGroup, expectedFormat, fixedColumns = {}]] of Object.entries(fields)) {
      const targetColumn = preferredColumns.find((column) => tableHasColumn(tables, targetTable, column));
      result[entityType][fieldName] = {
        target_table: targetTable,
        target_column: targetColumn || preferredColumns[0],
        also_consider_columns: preferredColumns.filter((column) => column !== targetColumn && tableHasColumn(tables, targetTable, column)),
        condition_group: conditionGroup,
        expected_format: expectedFormat,
        fixed_columns: fixedColumns,
        mapping_status: tableHasColumn(tables, targetTable, targetColumn || preferredColumns[0]) ? 'validated_against_schema' : 'target_column_not_found_in_schema',
        requires_context: ['company_name', 'entity_type', 'program_type', 'account_size', 'source_url', 'interaction_path']
      };
    }
  }
  return result;
}

function normalizeSeedRow(row, entityType) {
  return {
    company_name: row.company_name || '',
    slug: row.slug || '',
    entity_type: entityType,
    candidate_category: row.candidate_category || entityType,
    secondary_categories: row.secondary_categories || '',
    source_url: row.official_website || '',
    official_website: row.official_website || '',
    official_sources_or_pages_checked: row.official_sources_or_pages_checked || '',
    status: row.status || '',
    data_quality_status: row.data_quality_status || '',
    data_confidence_legacy: row.data_confidence_legacy || '',
    last_checked_legacy: row.last_checked_legacy || '',
    research_use: row.research_use || 'seed_only_not_final_truth',
    fill_rule: row.fill_rule || 'Use schema fields as checklist; verify values from official sources; missing values = NULL.',
    auto_discover: true
  };
}

async function main() {
  const args = parseArgs();
  const bundlePath = args.bundle || 'agents/propfirm-agent/schema/schema-bundle.b64';
  const workDir = args.workdir || '.schema-work';
  const outSchema = args.outSchema || 'agents/propfirm-agent/schema/schema-driver.generated.json';
  const outCompanySeed = args.outCompanySeed || 'agents/propfirm-agent/companies/company-seed.generated.json';
  const outPropSeed = args.outPropSeed || 'agents/propfirm-agent/companies/prop-firms-seed.generated.json';

  const root = await decodeAndExtractBundle(bundlePath, workDir);
  const tables = {};
  const entityTypes = {};
  const companySources = [];

  for (const spec of ENTITY_PACKAGES) {
    const folderPath = path.join(root, spec.folder);
    const allowedTables = new Set(['companies', 'company_sources', 'data_quality_flags']);
    for (const schemaFile of spec.schema_files) {
      const schemaPath = path.join(folderPath, schemaFile);
      const sql = await fs.readFile(schemaPath, 'utf8');
      const parsed = parseTables(sql, `${spec.folder}/${schemaFile}`);
      for (const [tableName, meta] of Object.entries(parsed)) {
        tables[tableName] = meta;
        if (!['categories', 'companies', 'company_sources', 'data_quality_flags'].includes(tableName)) {
          allowedTables.add(tableName);
        }
      }
    }
    const seedRows = await readCsv(path.join(folderPath, spec.company_sources));
    for (const row of seedRows) companySources.push(normalizeSeedRow(row, spec.entity_type));
    entityTypes[spec.entity_type] = {
      folder: spec.folder,
      schema_files: spec.schema_files.map((file) => `${spec.folder}/${file}`),
      company_sources_file: `${spec.folder}/${spec.company_sources}`,
      allowed_tables: Array.from(allowedTables).sort(),
      company_count: seedRows.length
    };
  }

  const driver = {
    version: 'schema_driver_generated_v1',
    generated_at: new Date().toISOString(),
    schema_is_authority: true,
    source_package: 'schema_and_company_sources_by_type_v1-1.zip',
    entity_types: entityTypes,
    tables,
    fill_policy: {
      no_guessing: true,
      use_company_sources_as_seed_only_not_final_truth: true,
      missing_values_must_remain_null: true,
      official_source_required_for_verified_status: true,
      never_final_if_click_failed: true,
      never_final_if_discount_context: true,
      never_final_if_empty_or_invalid: true,
      only_approved_candidate_can_become_import_candidate: true,
      final_database_write_requires_review_status: 'approved_candidate',
      default_unverified_data_status: 'needs_review',
      default_verified_data_status: 'verified_from_source',
      minimum_source_confidence_for_import_candidate: 85
    },
    field_mappings: buildMappings(tables),
    quality_flag_mapping: {
      missing: { target_table: 'data_quality_flags', flag_type: 'missing', default_severity: 'medium' },
      conflicting: { target_table: 'data_quality_flags', flag_type: 'conflicting', default_severity: 'high' },
      unverified: { target_table: 'data_quality_flags', flag_type: 'unverified', default_severity: 'medium' },
      needs_source: { target_table: 'data_quality_flags', flag_type: 'needs_source', default_severity: 'high' }
    }
  };

  const propFirms = companySources.filter((row) => ['cfd_prop_firm', 'futures_prop_firm', 'crypto_prop_firm'].includes(row.entity_type));

  await ensureDir(path.dirname(outSchema));
  await ensureDir(path.dirname(outCompanySeed));
  await fs.writeFile(outSchema, JSON.stringify(driver, null, 2), 'utf8');
  await fs.writeFile(outCompanySeed, JSON.stringify({ generated_at: driver.generated_at, count: companySources.length, companies: companySources }, null, 2), 'utf8');
  await fs.writeFile(outPropSeed, JSON.stringify({ generated_at: driver.generated_at, count: propFirms.length, companies: propFirms }, null, 2), 'utf8');

  console.log(`Schema tables: ${Object.keys(tables).length}`);
  console.log(`Company sources: ${companySources.length}`);
  console.log(`Prop firm sources: ${propFirms.length}`);
  console.log(`Wrote: ${outSchema}`);
  console.log(`Wrote: ${outCompanySeed}`);
  console.log(`Wrote: ${outPropSeed}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
