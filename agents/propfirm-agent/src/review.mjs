import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { writeCsv } from './scrape.mjs';

const PERCENT_FIELDS = new Set([
  'profit_target_phase_1',
  'profit_target_phase_2',
  'max_daily_loss',
  'max_total_loss',
  'profit_split'
]);

const MONEY_FIELDS = new Set(['base_fee']);
const INTEGER_FIELDS = new Set(['min_trading_days']);

const FIELD_META = {
  base_fee: {
    condition_group: 'pricing',
    schema_target_table: 'account_size',
    canonical_field: 'fee_amount',
    expected_format: 'money_or_number'
  },
  profit_target_phase_1: {
    condition_group: 'profit_target',
    schema_target_table: 'challenge_type',
    canonical_field: 'phase_1_profit_target_pct',
    expected_format: 'percent'
  },
  profit_target_phase_2: {
    condition_group: 'profit_target',
    schema_target_table: 'challenge_type',
    canonical_field: 'phase_2_profit_target_pct',
    expected_format: 'percent'
  },
  max_daily_loss: {
    condition_group: 'risk_limit',
    schema_target_table: 'drawdown_rules',
    canonical_field: 'max_daily_loss_pct',
    expected_format: 'percent'
  },
  max_total_loss: {
    condition_group: 'risk_limit',
    schema_target_table: 'drawdown_rules',
    canonical_field: 'max_total_loss_pct',
    expected_format: 'percent'
  },
  profit_split: {
    condition_group: 'payout',
    schema_target_table: 'payout_rules',
    canonical_field: 'profit_split_pct',
    expected_format: 'percent'
  },
  min_trading_days: {
    condition_group: 'trading_rule',
    schema_target_table: 'challenge_type',
    canonical_field: 'min_trading_days',
    expected_format: 'integer'
  },
  refund: {
    condition_group: 'pricing',
    schema_target_table: 'challenge_type',
    canonical_field: 'refund_policy',
    expected_format: 'text'
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

function normalizeValue(fieldName, value) {
  if (!compact(value)) return { ok: false, value: '', reason: 'empty_value' };
  if (PERCENT_FIELDS.has(fieldName)) {
    const result = normalizePercent(value);
    return { ...result, reason: result.ok ? '' : 'invalid_percent_format' };
  }
  if (MONEY_FIELDS.has(fieldName)) {
    const result = normalizeMoney(value);
    return { ...result, reason: result.ok ? '' : 'invalid_money_format' };
  }
  if (INTEGER_FIELDS.has(fieldName)) {
    const result = normalizeInteger(value);
    return { ...result, reason: result.ok ? '' : 'invalid_integer_format' };
  }
  return { ok: compact(value).length > 0, value: compact(value), reason: compact(value) ? '' : 'empty_value' };
}

function baseIssue(row) {
  const reasons = [];
  if (!compact(row.company_name)) reasons.push('missing_company_name');
  if (!compact(row.entity_type)) reasons.push('missing_entity_type');
  if (!compact(row.source_url)) reasons.push('missing_source_url');
  if (!compact(row.interaction_path)) reasons.push('missing_interaction_path');
  if (truthy(row.needs_review)) reasons.push(row.review_reason || 'extractor_marked_needs_review');
  if (String(row.review_reason || '').includes('click_failed')) reasons.push('interaction_click_failed');
  if (String(row.review_reason || '').includes('discount_or_promo_context_detected')) reasons.push('discount_or_promo_context_detected');
  if (String(row.review_reason || '').includes('field_not_found')) reasons.push('field_not_found');
  return reasons.filter(Boolean);
}

function conditionKey(row) {
  return [
    row.company_name,
    row.entity_type,
    row.program_type,
    row.account_size,
    row.field_name
  ].map((x) => compact(x).toLowerCase()).join('||');
}

function issueTypeFromReason(reason) {
  if (reason.includes('missing') || reason.includes('field_not_found') || reason.includes('empty')) return 'missing';
  if (reason.includes('conflict')) return 'conflicting';
  if (reason.includes('discount') || reason.includes('promo')) return 'unverified';
  if (reason.includes('invalid')) return 'unverified';
  if (reason.includes('click_failed')) return 'needs_source';
  return 'unverified';
}

function severityFromReason(reason) {
  if (reason.includes('conflict')) return 'high';
  if (reason.includes('click_failed')) return 'high';
  if (reason.includes('discount') || reason.includes('promo')) return 'medium';
  if (reason.includes('field_not_found') || reason.includes('empty')) return 'medium';
  return 'low';
}

function makeDecision(row, conflicts) {
  const meta = FIELD_META[row.field_name] || {
    condition_group: 'other',
    schema_target_table: 'unknown',
    canonical_field: row.field_name,
    expected_format: 'text'
  };
  const normalized = normalizeValue(row.field_name, row.value);
  const reasons = baseIssue(row);
  if (!normalized.ok) reasons.push(normalized.reason);
  if (conflicts.has(conditionKey(row))) reasons.push('conflicting_values_for_same_condition');

  let reviewStatus = 'approved_candidate';
  let sourceConfidence = 85;
  if (reasons.length) {
    reviewStatus = reasons.some((r) => r.includes('field_not_found') || r.includes('empty') || r.includes('invalid') || r.includes('click_failed'))
      ? 'rejected'
      : 'manual_review';
    sourceConfidence = reviewStatus === 'manual_review' ? 60 : 30;
  }

  return {
    company_name: row.company_name,
    entity_type: row.entity_type,
    program_type: row.program_type,
    account_size: row.account_size,
    condition_group: meta.condition_group,
    schema_target_table: meta.schema_target_table,
    field_name: row.field_name,
    canonical_field: meta.canonical_field,
    expected_format: meta.expected_format,
    normalized_value: normalized.value,
    raw_value: row.value,
    source_url: row.source_url,
    source_text: row.source_text,
    interaction_path: row.interaction_path,
    review_status: reviewStatus,
    source_confidence: sourceConfidence,
    issue_type: reasons.length ? issueTypeFromReason(reasons.join(' | ')) : '',
    severity: reasons.length ? severityFromReason(reasons.join(' | ')) : '',
    decision_reason: reasons.join(' | '),
    captured_at: row.captured_at
  };
}

function detectConflicts(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const normalized = normalizeValue(row.field_name, row.value);
    if (!normalized.ok) continue;
    const key = conditionKey(row);
    if (!grouped.has(key)) grouped.set(key, new Set());
    grouped.get(key).add(normalized.value.toLowerCase());
  }
  const conflicts = new Set();
  for (const [key, values] of grouped.entries()) {
    if (values.size > 1) conflicts.add(key);
  }
  return conflicts;
}

function makeQualityFlags(decisions) {
  return decisions
    .filter((row) => row.review_status !== 'approved_candidate')
    .map((row) => ({
      company_name: row.company_name,
      entity_type: row.entity_type,
      schema_target_table: row.schema_target_table,
      field_name: row.field_name,
      field_value: row.raw_value,
      issue_type: row.issue_type,
      severity: row.severity,
      description: row.decision_reason,
      source_url: row.source_url,
      interaction_path: row.interaction_path,
      reported_by: 'propfirm-review-agent',
      reported_at: new Date().toISOString()
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
  const rows = await readCsv(input);
  const conflicts = detectConflicts(rows);
  const decisions = rows.map((row) => makeDecision(row, conflicts));
  const flags = makeQualityFlags(decisions);
  const summary = summarize(decisions);

  await writeCsv(path.join(outputDir, 'reviewed_conditions.csv'), decisions, [
    'company_name', 'entity_type', 'program_type', 'account_size', 'condition_group', 'schema_target_table',
    'field_name', 'canonical_field', 'expected_format', 'normalized_value', 'raw_value', 'source_url', 'source_text',
    'interaction_path', 'review_status', 'source_confidence', 'issue_type', 'severity', 'decision_reason', 'captured_at'
  ]);

  await writeCsv(path.join(outputDir, 'approved_condition_candidates.csv'), decisions.filter((row) => row.review_status === 'approved_candidate'), [
    'company_name', 'entity_type', 'program_type', 'account_size', 'condition_group', 'schema_target_table',
    'field_name', 'canonical_field', 'expected_format', 'normalized_value', 'raw_value', 'source_url', 'source_text',
    'interaction_path', 'review_status', 'source_confidence', 'captured_at'
  ]);

  await writeCsv(path.join(outputDir, 'data_quality_flags.csv'), flags, [
    'company_name', 'entity_type', 'schema_target_table', 'field_name', 'field_value', 'issue_type', 'severity',
    'description', 'source_url', 'interaction_path', 'reported_by', 'reported_at'
  ]);

  await writeCsv(path.join(outputDir, 'review_summary.csv'), summary, [
    'company_name', 'entity_type', 'approved_candidate', 'manual_review', 'rejected', 'avg_source_confidence', 'total'
  ]);

  console.log(`Reviewed rows: ${decisions.length}`);
  console.log(`Approved candidates: ${decisions.filter((row) => row.review_status === 'approved_candidate').length}`);
  console.log(`Quality flags: ${flags.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
