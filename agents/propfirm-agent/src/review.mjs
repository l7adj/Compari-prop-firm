import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { writeCsv } from './scrape.mjs';

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
  const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? '';
    });
    return row;
  });
}

function truthy(value) {
  return String(value).toLowerCase() === 'true' || String(value) === '1';
}

function compact(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function normalizePercent(value) {
  const text = compact(value).replace(',', '.');
  const match = text.match(/([0-9]{1,3}(?:\.[0-9]+)?)\s*%/);
  if (!match) return { ok: false, value: text };
  const num = Number(match[1]);
  if (!Number.isFinite(num) || num < 0 || num > 100) return { ok: false, value: text };
  return { ok: true, value: `${num % 1 === 0 ? num.toFixed(0) : String(num)}%` };
}

function normalizeMoney(value) {
  const text = compact(value);
  const match = text.match(/(?:[$€£]\s*)?([0-9][0-9,.]*)/);
  if (!match) return { ok: false, value: text };
  const normalized = match[1].replace(/,/g, '');
  const num = Number(normalized);
  if (!Number.isFinite(num) || num <= 0) return { ok: false, value: text };
  return { ok: true, value: String(num) };
}

function normalizeInteger(value) {
  const text = compact(value);
  const match = text.match(/\b([0-9]+)\b/);
  if (!match) return { ok: false, value: text };
  const num = Number(match[1]);
  if (!Number.isInteger(num) || num < 0 || num > 365) return { ok: false, value: text };
  return { ok: true, value: String(num) };
}

function normalizeText(value) {
  const text = compact(value);
  return { ok: text.length > 0, value: text };
}

function normalizeValueByFormat(expectedFormat, value) {
  if (!compact(value)) return { ok: false, value: '', reason: 'empty_value' };
  if (expectedFormat === 'percent') {
    const result = normalizePercent(value);
    return { ...result, reason: result.ok ? '' : 'invalid_percent_format' };
  }
  if (expectedFormat === 'money_or_number') {
    const result = normalizeMoney(value);
    return { ...result, reason: result.ok ? '' : 'invalid_money_format' };
  }
  if (expectedFormat === 'integer') {
    const result = normalizeInteger(value);
    return { ...result, reason: result.ok ? '' : 'invalid_integer_format' };
  }
  const result = normalizeText(value);
  return { ...result, reason: result.ok ? '' : 'empty_value' };
}

function getMapping(schemaDriver, row) {
  return schemaDriver.field_mappings?.[row.entity_type]?.[row.field_name] || null;
}

function baseIssues(row, mapping, schemaDriver) {
  const reasons = [];
  if (!mapping) reasons.push('field_not_mapped_in_schema_driver');
  const required = mapping?.requires_context || ['company_name', 'entity_type', 'source_url', 'interaction_path'];
  for (const key of required) {
    if (!compact(row[key])) reasons.push(`missing_${key}`);
  }
  if (!compact(row.entity_type)) reasons.push('missing_entity_type');
  const allowed = schemaDriver.entity_types?.[row.entity_type]?.allowed_tables || [];
  if (mapping?.target_table && allowed.length && !allowed.includes(mapping.target_table)) {
    reasons.push(`target_table_not_allowed_for_entity_type:${mapping.target_table}`);
  }
  if (truthy(row.needs_review)) reasons.push(row.review_reason || 'extractor_marked_needs_review');
  if (String(row.review_reason || '').includes('click_failed')) reasons.push('interaction_click_failed');
  if (String(row.review_reason || '').includes('discount_or_promo_context_detected')) reasons.push('discount_or_promo_context_detected');
  if (String(row.review_reason || '').includes('field_not_found')) reasons.push('field_not_found');
  return reasons.filter(Boolean);
}

function conditionKey(row, mapping) {
  return [
    row.company_name,
    row.entity_type,
    row.program_type,
    row.account_size,
    mapping?.target_table || '',
    mapping?.target_column || '',
    JSON.stringify(mapping?.fixed_columns || {})
  ].map((x) => compact(x).toLowerCase()).join('||');
}

function issueTypeFromReason(reason) {
  if (reason.includes('missing') || reason.includes('field_not_found') || reason.includes('empty')) return 'missing';
  if (reason.includes('conflict')) return 'conflicting';
  if (reason.includes('discount') || reason.includes('promo')) return 'unverified';
  if (reason.includes('invalid')) return 'unverified';
  if (reason.includes('click_failed')) return 'needs_source';
  if (reason.includes('not_mapped') || reason.includes('not_allowed')) return 'unverified';
  return 'unverified';
}

function severityFromReason(reason) {
  if (reason.includes('conflict')) return 'high';
  if (reason.includes('click_failed')) return 'high';
  if (reason.includes('not_allowed') || reason.includes('not_mapped')) return 'high';
  if (reason.includes('discount') || reason.includes('promo')) return 'medium';
  if (reason.includes('field_not_found') || reason.includes('empty')) return 'medium';
  return 'low';
}

function detectConflicts(rows, schemaDriver) {
  const grouped = new Map();
  for (const row of rows) {
    const mapping = getMapping(schemaDriver, row);
    if (!mapping) continue;
    const normalized = normalizeValueByFormat(mapping.expected_format, row.value);
    if (!normalized.ok) continue;
    const key = conditionKey(row, mapping);
    if (!grouped.has(key)) grouped.set(key, new Set());
    grouped.get(key).add(normalized.value.toLowerCase());
  }
  const conflicts = new Set();
  for (const [key, values] of grouped.entries()) {
    if (values.size > 1) conflicts.add(key);
  }
  return conflicts;
}

function makeDecision(row, conflicts, schemaDriver) {
  const mapping = getMapping(schemaDriver, row);
  const expectedFormat = mapping?.expected_format || 'text';
  const normalized = normalizeValueByFormat(expectedFormat, row.value);
  const reasons = baseIssues(row, mapping, schemaDriver);
  if (!normalized.ok) reasons.push(normalized.reason);
  if (mapping && conflicts.has(conditionKey(row, mapping))) reasons.push('conflicting_values_for_same_schema_condition');

  const policy = schemaDriver.fill_policy || {};
  let reviewStatus = 'approved_candidate';
  let sourceConfidence = policy.minimum_source_confidence_for_import_candidate || 85;

  if (reasons.length) {
    const hardReject = reasons.some((r) => (
      r.includes('field_not_found') ||
      r.includes('empty') ||
      r.includes('invalid') ||
      r.includes('click_failed') ||
      r.includes('not_mapped') ||
      r.includes('not_allowed') ||
      r.includes('conflicting')
    ));
    reviewStatus = hardReject ? 'rejected' : 'manual_review';
    sourceConfidence = reviewStatus === 'manual_review' ? 60 : 30;
  }

  const dataStatus = reviewStatus === 'approved_candidate'
    ? (policy.default_verified_data_status || 'verified_from_source')
    : (policy.default_unverified_data_status || 'needs_review');

  return {
    company_name: row.company_name,
    entity_type: row.entity_type,
    program_type: row.program_type,
    account_size: row.account_size,
    condition_group: mapping?.condition_group || 'unmapped',
    target_table: mapping?.target_table || 'unmapped',
    target_column: mapping?.target_column || row.field_name,
    field_name: row.field_name,
    expected_format: expectedFormat,
    normalized_value: normalized.value,
    raw_value: row.value,
    fixed_columns_json: JSON.stringify(mapping?.fixed_columns || {}),
    source_url: row.source_url,
    source_text: row.source_text,
    interaction_path: row.interaction_path,
    review_status: reviewStatus,
    source_confidence: sourceConfidence,
    data_status: dataStatus,
    issue_type: reasons.length ? issueTypeFromReason(reasons.join(' | ')) : '',
    severity: reasons.length ? severityFromReason(reasons.join(' | ')) : '',
    decision_reason: reasons.join(' | '),
    captured_at: row.captured_at
  };
}

function makeQualityFlags(decisions) {
  return decisions
    .filter((row) => row.review_status !== 'approved_candidate')
    .map((row) => ({
      company_name: row.company_name,
      entity_type: row.entity_type,
      entity_table: row.target_table,
      field_name: row.target_column,
      field_value: row.raw_value,
      flag_type: row.issue_type,
      severity: row.severity,
      description: row.decision_reason,
      source_url: row.source_url,
      interaction_path: row.interaction_path,
      reported_by: 'schema-driven-review-agent',
      created_at: new Date().toISOString()
    }));
}

function makeImportCandidates(decisions) {
  return decisions
    .filter((row) => row.review_status === 'approved_candidate')
    .map((row) => ({
      target_table: row.target_table,
      target_column: row.target_column,
      company_name: row.company_name,
      entity_type: row.entity_type,
      program_type: row.program_type,
      account_size: row.account_size,
      normalized_value: row.normalized_value,
      fixed_columns_json: row.fixed_columns_json,
      source_url: row.source_url,
      source_checked_at: row.captured_at || new Date().toISOString(),
      source_confidence: row.source_confidence,
      data_status: row.data_status,
      source_notes: row.source_text,
      interaction_path: row.interaction_path
    }));
}

function summarize(decisions) {
  const summary = new Map();
  for (const row of decisions) {
    const key = `${row.company_name}||${row.entity_type}`;
    if (!summary.has(key)) {
      summary.set(key, {
        company_name: row.company_name,
        entity_type: row.entity_type,
        approved_candidate: 0,
        manual_review: 0,
        rejected: 0,
        avg_source_confidence: 0,
        total: 0
      });
    }
    const item = summary.get(key);
    item[row.review_status] += 1;
    item.total += 1;
    item.avg_source_confidence += Number(row.source_confidence || 0);
  }
  return Array.from(summary.values()).map((row) => ({
    ...row,
    avg_source_confidence: row.total ? Math.round(row.avg_source_confidence / row.total) : 0
  }));
}

async function main() {
  const args = parseArgs();
  const input = args.input || process.env.REVIEW_INPUT || 'output/normalized_pending_review.csv';
  const outputDir = args.output || process.env.OUTPUT_DIR || 'output';
  const schemaPath = args.schema || process.env.SCHEMA_DRIVER || 'agents/propfirm-agent/schema/schema-driver.json';
  const schemaDriver = await readJson(schemaPath);
  const rows = await readCsv(input);
  const conflicts = detectConflicts(rows, schemaDriver);
  const decisions = rows.map((row) => makeDecision(row, conflicts, schemaDriver));
  const flags = makeQualityFlags(decisions);
  const importCandidates = makeImportCandidates(decisions);
  const summary = summarize(decisions);

  await writeCsv(path.join(outputDir, 'reviewed_conditions.csv'), decisions, [
    'company_name', 'entity_type', 'program_type', 'account_size', 'condition_group', 'target_table',
    'target_column', 'field_name', 'expected_format', 'normalized_value', 'raw_value', 'fixed_columns_json',
    'source_url', 'source_text', 'interaction_path', 'review_status', 'source_confidence', 'data_status',
    'issue_type', 'severity', 'decision_reason', 'captured_at'
  ]);

  await writeCsv(path.join(outputDir, 'schema_import_candidates.csv'), importCandidates, [
    'target_table', 'target_column', 'company_name', 'entity_type', 'program_type', 'account_size',
    'normalized_value', 'fixed_columns_json', 'source_url', 'source_checked_at', 'source_confidence',
    'data_status', 'source_notes', 'interaction_path'
  ]);

  await writeCsv(path.join(outputDir, 'approved_condition_candidates.csv'), decisions.filter((row) => row.review_status === 'approved_candidate'), [
    'company_name', 'entity_type', 'program_type', 'account_size', 'condition_group', 'target_table',
    'target_column', 'field_name', 'expected_format', 'normalized_value', 'raw_value', 'source_url', 'source_text',
    'interaction_path', 'review_status', 'source_confidence', 'data_status', 'captured_at'
  ]);

  await writeCsv(path.join(outputDir, 'data_quality_flags.csv'), flags, [
    'company_name', 'entity_type', 'entity_table', 'field_name', 'field_value', 'flag_type', 'severity',
    'description', 'source_url', 'interaction_path', 'reported_by', 'created_at'
  ]);

  await writeCsv(path.join(outputDir, 'review_summary.csv'), summary, [
    'company_name', 'entity_type', 'approved_candidate', 'manual_review', 'rejected', 'avg_source_confidence', 'total'
  ]);

  console.log(`Reviewed rows: ${decisions.length}`);
  console.log(`Schema import candidates: ${importCandidates.length}`);
  console.log(`Quality flags: ${flags.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
